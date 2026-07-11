import re

from app.core.config import get_settings
from app.schemas.common import DocumentType, Recommendation, VehicleType
from app.schemas.requests import DriverLicenseVerificationRequest
from app.schemas.responses import (
    DriverLicenseDocumentChecks,
    DriverLicenseExtracted,
    DriverLicenseNameMatch,
    DriverLicenseVerificationResponse,
)
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService
from app.services.license_rules import (
    CAR_LICENSE_CLASSES,
    MOTORBIKE_LICENSE_CLASSES,
    infer_vehicle_type_from_license_class,
    is_license_class_valid,
    normalize_license_class,
)
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError, PaddleOcrService
from app.services.text_similarity import ratio
from app.services.vietnamese_text import normalize_compare_text, normalize_display_text


class DriverLicenseService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()
        self.ocr = PaddleOcrService()

    async def verify(
        self,
        request: DriverLicenseVerificationRequest,
    ) -> DriverLicenseVerificationResponse:
        settings = get_settings()
        flags: list[str] = []

        try:
            image = await self.loader.load(str(request.front_image_url))
        except (ImageLoadError, OSError, ValueError) as exc:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(None, None),
                flags=["IMAGE_DOWNLOAD_FAILED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message=str(exc),
            )

        quality = self.quality.check_image(image, DocumentType.DRIVER_LICENSE)
        flags.extend(quality.flags)

        try:
            lines = self.ocr.read_text(image)
        except OcrUnavailableError as exc:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(None, None),
                flags=["OCR_ENGINE_UNAVAILABLE"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )
        except OcrProcessingError as exc:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(None, None),
                flags=["OCR_PROCESSING_FAILED"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )

        if not lines:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(request.full_name, None),
                flags=["NO_TEXT_DETECTED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message="No readable text was detected in driver license image.",
            )

        return self.build_response_from_lines(request, lines, flags)

    def verify_image(
        self,
        image,
        full_name: str | None = None,
    ) -> DriverLicenseVerificationResponse:
        request = DriverLicenseVerificationRequest(
            fullName=full_name,
            frontImageUrl="uploaded-file",
        )
        flags: list[str] = []
        quality = self.quality.check_image(image, DocumentType.DRIVER_LICENSE)
        flags.extend(quality.flags)

        try:
            lines = self.ocr.read_text(image)
        except OcrUnavailableError as exc:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(None, None),
                flags=["OCR_ENGINE_UNAVAILABLE"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )
        except OcrProcessingError as exc:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(None, None),
                flags=["OCR_PROCESSING_FAILED"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )

        if not lines:
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(full_name, None),
                flags=["NO_TEXT_DETECTED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message="No readable text was detected in driver license image.",
            )

        return self.build_response_from_lines(request, lines, flags)

    def build_response_from_lines(
        self,
        request: DriverLicenseVerificationRequest,
        lines: list[OcrLine],
        flags: list[str] | None = None,
    ) -> DriverLicenseVerificationResponse:
        settings = get_settings()
        flags = list(flags or [])
        if not lines:
            recommendation = (
                Recommendation.NEED_MORE_INFO
                if "NO_TEXT_DETECTED" in flags
                else Recommendation.MANUAL_REVIEW
            )
            return self._response(
                valid=False,
                license_vehicle_type=VehicleType.UNKNOWN,
                license_class_valid=False,
                confidence=0.0,
                extracted=DriverLicenseExtracted(rawText=[]),
                document_checks=self._empty_checks(),
                name_match=self._name_match(request.full_name, None),
                flags=flags,
                recommendation=recommendation,
                message="OCR did not return readable driver license text.",
            )
        extracted = self._extract_fields(lines)
        checks = self._document_checks(extracted)
        name_match = self._name_match(request.full_name, extracted.full_name)
        license_vehicle_type = infer_vehicle_type_from_license_class(extracted.license_class)
        license_class_valid = is_license_class_valid(
            extracted.license_class,
            VehicleType.UNKNOWN,
            [],
        )
        ocr_confidence = round(sum(line.confidence for line in lines) / len(lines), 3)

        if not extracted.driver_license_number:
            flags.append("DRIVER_LICENSE_NUMBER_NOT_FOUND")

        if not extracted.license_class:
            flags.append("LICENSE_CLASS_NOT_FOUND")
        elif not checks.license_class_known_in_vietnam:
            flags.append("LICENSE_CLASS_NOT_RECOGNIZED_IN_VIETNAM")

        if request.full_name and not extracted.full_name:
            flags.append("FULL_NAME_NOT_FOUND")
        elif name_match.provided and name_match.matched is False:
            flags.append("FULL_NAME_MISMATCH")

        if license_vehicle_type == VehicleType.UNKNOWN:
            flags.append("LICENSE_CLASS_UNCERTAIN")

        if not checks.ministry_found:
            flags.append("MINISTRY_MARKER_NOT_FOUND")
        if not checks.national_motto_found:
            flags.append("NATIONAL_MOTTO_NOT_FOUND")
        if not checks.driver_license_title_found:
            flags.append("DRIVER_LICENSE_TITLE_NOT_FOUND")

        if ocr_confidence < settings.low_ocr_confidence_threshold:
            flags.append("LOW_OCR_CONFIDENCE")

        recommendation = self._recommend(flags, ocr_confidence, checks)
        valid = self._is_document_valid(checks)
        if name_match.provided:
            valid = valid and bool(name_match.matched)
        response_flags = sorted(set(flags))
        if recommendation == Recommendation.PASS:
            response_flags = [
                flag for flag in response_flags
                if flag not in {"IMAGE_TOO_BLURRY", "IMAGE_TOO_DARK", "IMAGE_TOO_BRIGHT"}
            ]
        return self._response(
            valid=valid,
            license_vehicle_type=license_vehicle_type,
            license_class_valid=license_class_valid,
            confidence=ocr_confidence,
            extracted=extracted,
            document_checks=checks,
            name_match=name_match,
            flags=response_flags,
            recommendation=recommendation,
            message=None if valid else "Driver license OCR completed, but document markers or license class need review.",
        )

    def _extract_fields(self, lines: list[OcrLine]) -> DriverLicenseExtracted:
        raw_text = [line.text for line in lines]
        joined = "\n".join(raw_text)

        license_number = self._first_match(
            joined,
            [
                r"(?:S[á»‘o]|No\.?|GPLX|LICENSE\s*NO)[:\s]*([0-9]{6,14})",
                r"\b([0-9]{9,14})\b",
            ],
        )
        license_class = self._extract_license_class(joined)
        dob = self._first_match(
            joined,
            [
                r"(?:NgÃ y sinh|Sinh ngÃ y|Date of birth)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
                r"(?:Ngày sinh|Sinh ngày|Date of Birth|Date of birth)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
                r"\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})\b",
            ],
        )
        issue_date = self._first_match(
            joined,
            [
                r"(?:Ngày cấp|Date of issue)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
            ],
        )
        expiry = self._first_match(
            joined,
            [
                r"(?:CÃ³ giÃ¡ trá»‹ Ä‘áº¿n|Háº¡n Ä‘áº¿n|Expiry|Expires)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
                r"(?:Ngày hết hạn|Ngày hết gạn|Expiration date|Expiry|Expires)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
            ],
        )
        expiry_status = self._extract_expiry_status(joined, expiry)
        full_name = self._extract_name(raw_text)

        return DriverLicenseExtracted(
            fullName=full_name,
            driverLicenseNumber=license_number,
            dateOfBirth=dob,
            licenseClass=license_class,
            issueDate=issue_date,
            expiryDate=normalize_display_text(expiry or ("Không thời hạn" if expiry_status == "Unlimited" else None)),
            expiryStatus=expiry_status,
            rawText=raw_text,
        )

    def _extract_expiry_status(self, text: str, expiry: str | None = None) -> str | None:
        compare = normalize_compare_text(text)
        if (
            "khong thoi han" in compare
            or "khong thoi hn" in compare
            or "khong thoi h n" in compare
            or ("expires" in compare and "khong" in compare and ("thoi" in compare or "han" in compare))
        ):
            return "Unlimited"
        if expiry:
            return "FixedDate"
        return None

    def _extract_license_class(self, text: str) -> str | None:
        class_pattern = r"(A1|A2|A3|A4|B1|B2|C1E|C1|D1E|D2E|D1|D2|BE|CE|DE|FC|FD|FE|FB2|A|B|C|D|E)"
        label_patterns = [
            rf"(?:Hạng|Hang|Hạng)\s*/?\s*(?:Class)?\s*[:：]?\s*{class_pattern}\b",
            rf"(?:Class)\s*[:：]\s*{class_pattern}\b",
        ]
        for pattern in label_patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return normalize_license_class(match.group(1))

        for candidate in re.findall(rf"\b{class_pattern}\b", text, flags=re.IGNORECASE):
            normalized = normalize_license_class(candidate)
            if normalized:
                return normalized
        return None

    def _extract_name(self, lines: list[str]) -> str | None:
        for index, line in enumerate(lines):
            if re.search(r"(Há»\s*tÃªn|Ho\s*ten|Full\s*name|Name)", line, flags=re.IGNORECASE):
                parts = re.split(r"[:ï¼š]", line, maxsplit=1)
                if len(parts) == 2 and parts[1].strip():
                    return parts[1].strip()
                if index + 1 < len(lines):
                    return lines[index + 1].strip()
        return None

    def _first_match(self, text: str, patterns: list[str]) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _recommend(
        self,
        flags: list[str],
        confidence: float,
        checks: DriverLicenseDocumentChecks,
    ) -> Recommendation:
        reject_flags = {"FULL_NAME_MISMATCH", "LICENSE_CLASS_NOT_RECOGNIZED_IN_VIETNAM"}
        need_more_flags = {
            "NO_TEXT_DETECTED",
            "IMAGE_TOO_SMALL",
            "DOCUMENT_NOT_READABLE",
        }
        if any(flag in reject_flags for flag in flags):
            return Recommendation.REJECT
        if any(flag in need_more_flags for flag in flags):
            return Recommendation.NEED_MORE_INFO
        non_blocking_quality_flags = {"IMAGE_TOO_BLURRY", "IMAGE_TOO_DARK", "IMAGE_TOO_BRIGHT"}
        only_non_blocking_quality = all(flag in non_blocking_quality_flags for flag in flags)
        if self._is_document_valid(checks) and confidence >= get_settings().good_ocr_confidence_threshold:
            if not flags or only_non_blocking_quality:
                return Recommendation.PASS
        if flags or confidence < get_settings().good_ocr_confidence_threshold:
            return Recommendation.MANUAL_REVIEW
        return Recommendation.PASS

    def _document_checks(self, extracted: DriverLicenseExtracted) -> DriverLicenseDocumentChecks:
        joined = normalize_compare_text(" ".join(extracted.raw_text))
        license_class = normalize_license_class(extracted.license_class)
        known_classes = MOTORBIKE_LICENSE_CLASSES | CAR_LICENSE_CLASSES
        return DriverLicenseDocumentChecks(
            ministryFound=self._has_any(
                joined,
                [
                    "bo gtvt",
                    "bo giao thong van tai",
                    "bg tvt",
                    "bogtvt",
                    "cuc canh sat giao thong",
                    "canh sat giao thong",
                    "issuing authority",
                ],
            ),
            nationalMottoFound=self._has_national_motto(joined),
            driverLicenseTitleFound=self._has_driver_license_title(joined),
            licenseClassFound=bool(license_class),
            licenseClassKnownInVietnam=bool(license_class and license_class in known_classes),
        )

    def _empty_checks(self) -> DriverLicenseDocumentChecks:
        return DriverLicenseDocumentChecks(
            ministryFound=False,
            nationalMottoFound=False,
            driverLicenseTitleFound=False,
            licenseClassFound=False,
            licenseClassKnownInVietnam=False,
        )

    def _is_document_valid(self, checks: DriverLicenseDocumentChecks) -> bool:
        return (
            checks.driver_license_title_found
            and checks.license_class_found
            and checks.license_class_known_in_vietnam
            and (checks.ministry_found or checks.national_motto_found)
        )

    def _name_match(self, system_full_name: str | None, ocr_full_name: str | None) -> DriverLicenseNameMatch:
        if not system_full_name:
            return DriverLicenseNameMatch(provided=False)

        system_normalized = normalize_compare_text(system_full_name).upper()
        ocr_normalized = normalize_compare_text(ocr_full_name).upper()
        if not ocr_normalized:
            return DriverLicenseNameMatch(
                provided=True,
                matched=False,
                score=0.0,
                systemFullNameNormalized=system_normalized,
                ocrFullNameNormalized=None,
            )

        score = round(ratio(system_normalized, ocr_normalized), 2)
        return DriverLicenseNameMatch(
            provided=True,
            matched=score >= 85,
            score=score,
            systemFullNameNormalized=system_normalized,
            ocrFullNameNormalized=ocr_normalized,
        )

    def _has_any(self, text: str, markers: list[str]) -> bool:
        return any(marker in text for marker in markers)

    def _has_national_motto(self, text: str) -> bool:
        return (
            "cong hoa" in text
            and ("xa hoi" in text or "xahoi" in text)
            and ("viet nam" in text or "vietnam" in text)
        )

    def _has_driver_license_title(self, text: str) -> bool:
        return (
            ("giay" in text and "phep" in text and "lai" in text and "xe" in text)
            or "driver license" in text
            or "drivers license" in text
            or "driver s license" in text
        )

    def _response(
        self,
        valid: bool,
        license_vehicle_type: VehicleType,
        license_class_valid: bool,
        confidence: float,
        extracted: DriverLicenseExtracted,
        document_checks: DriverLicenseDocumentChecks,
        name_match: DriverLicenseNameMatch,
        flags: list[str],
        recommendation: Recommendation,
        message: str | None,
    ) -> DriverLicenseVerificationResponse:
        return DriverLicenseVerificationResponse(
            valid=valid,
            documentType=DocumentType.DRIVER_LICENSE,
            licenseVehicleType=license_vehicle_type,
            licenseClassValidForExpectedVehicle=license_class_valid,
            ocrConfidence=confidence,
            extracted=extracted,
            documentChecks=document_checks,
            nameMatch=name_match,
            flags=flags,
            recommendation=recommendation,
            message=message,
        )
