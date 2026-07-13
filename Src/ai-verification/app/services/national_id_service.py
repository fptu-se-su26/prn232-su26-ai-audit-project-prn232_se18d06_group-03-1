import re

from app.core.config import get_settings
from app.schemas.common import DocumentType, Recommendation
from app.schemas.requests import NationalIdVerificationRequest
from app.schemas.responses import (
    NationalIdDocumentChecks,
    NationalIdExtracted,
    NationalIdMatchChecks,
    NationalIdVerificationResponse,
)
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError
from app.services.ocr_space_service import OcrSpaceService
from app.services.text_similarity import ratio
from app.services.vietnamese_text import normalize_compare_text, normalize_display_text


class NationalIdService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()
        self.ocr_space = OcrSpaceService()

    async def verify(self, request: NationalIdVerificationRequest) -> NationalIdVerificationResponse:
        flags: list[str] = []
        try:
            image = await self.loader.load(str(request.front_image_url))
        except (ImageLoadError, OSError, ValueError) as exc:
            return self._response(
                False,
                0.0,
                NationalIdExtracted(rawText=[]),
                self._empty_checks(),
                self._match_checks(request, None),
                ["IMAGE_DOWNLOAD_FAILED"],
                Recommendation.NEED_MORE_INFO,
                str(exc),
            )

        quality = self.quality.check_image(image, DocumentType.NATIONAL_ID)
        flags.extend(quality.flags)

        try:
            lines = await self.ocr_space.read_text(str(request.front_image_url))
        except OcrUnavailableError as exc:
            return self._response(
                False,
                0.0,
                NationalIdExtracted(rawText=[]),
                self._empty_checks(),
                self._match_checks(request, None),
                ["OCR_ENGINE_UNAVAILABLE"],
                Recommendation.MANUAL_REVIEW,
                str(exc),
            )
        except OcrProcessingError as exc:
            return self._response(
                False,
                0.0,
                NationalIdExtracted(rawText=[]),
                self._empty_checks(),
                self._match_checks(request, None),
                ["OCR_PROCESSING_FAILED"],
                Recommendation.MANUAL_REVIEW,
                str(exc),
            )

        return self.build_response_from_lines(request, lines, flags)

    def build_response_from_lines(
        self,
        request: NationalIdVerificationRequest,
        lines: list[OcrLine],
        flags: list[str] | None = None,
    ) -> NationalIdVerificationResponse:
        flags = list(flags or [])
        if not lines:
            return self._response(
                False,
                0.0,
                NationalIdExtracted(rawText=[]),
                self._empty_checks(),
                self._match_checks(request, None),
                ["NO_TEXT_DETECTED", *flags],
                Recommendation.NEED_MORE_INFO,
                "No readable text was detected in national ID image.",
            )

        extracted = self._extract_fields(lines)
        checks = self._document_checks(extracted)
        matches = self._match_checks(request, extracted)
        fields_found = [
            extracted.national_id_number, extracted.full_name,
            extracted.date_of_birth, extracted.sex,
            extracted.place_of_origin, extracted.place_of_residence,
        ]
        checks_ok = [
            checks.national_motto_found, checks.national_id_title_found,
            checks.chip_card_marker_found,
        ]
        score = sum(1 for f in fields_found if f) + sum(1 for c in checks_ok if c)
        confidence = round(score / (len(fields_found) + len(checks_ok)), 3)

        if not extracted.national_id_number:
            flags.append("NATIONAL_ID_NUMBER_NOT_FOUND")
        if not extracted.full_name:
            flags.append("FULL_NAME_NOT_FOUND")
        if not extracted.date_of_birth:
            flags.append("DATE_OF_BIRTH_NOT_FOUND")
        if not checks.national_motto_found:
            flags.append("NATIONAL_MOTTO_NOT_FOUND")
        if not checks.national_id_title_found:
            flags.append("NATIONAL_ID_TITLE_NOT_FOUND")
        if request.full_name and matches.full_name_matched is False:
            flags.append("FULL_NAME_MISMATCH")
        if confidence < get_settings().low_ocr_confidence_threshold:
            flags.append("LOW_OCR_CONFIDENCE")

        recommendation = self._recommend(flags, confidence, checks)
        valid = self._is_document_valid(checks)
        if request.full_name:
            valid = valid and bool(matches.full_name_matched)
        response_flags = sorted(set(flags))
        if recommendation == Recommendation.PASS:
            response_flags = [
                flag for flag in response_flags
                if flag not in {"IMAGE_TOO_BLURRY", "IMAGE_TOO_DARK", "IMAGE_TOO_BRIGHT"}
            ]

        return self._response(
            valid,
            confidence,
            extracted,
            checks,
            matches,
            response_flags,
            recommendation,
            None if valid else self._message_for(response_flags, recommendation),
        )

    def _extract_fields(self, lines: list[OcrLine]) -> NationalIdExtracted:
        raw_text = [line.text for line in lines]
        joined = "\n".join(raw_text)

        national_id = self._first_match(
            joined,
            [
                r"(?:Số|So|No\.?)\s*/?\s*(?:No\.?)?[:\s]*([0-9]{9,12})",
                r"\b([0-9]{12})\b",
            ],
        )
        full_name = self._extract_after_label(raw_text, [r"Họ và tên", r"Ho va ten", r"Full name"])
        date_of_birth = self._first_match(
            joined,
            [
                r"(?:Ngày sinh|Date of birth)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
            ],
        )
        sex = self._first_match(joined, [r"(?:Giới tính|Sex)[:\s]*([A-Za-zÀ-ỹ]+)"])
        nationality = self._first_match(joined, [r"(?:Quốc tịch|Nationality)[:\s]*([A-Za-zÀ-ỹ ]+?)(?:\n|$)"])
        origin = self._extract_after_label(raw_text, [r"Quê quán", r"Place of origin"])
        residence = self._extract_residence(raw_text)
        expiry = self._first_match(
            joined,
            [
                r"(?:Có giá trị đến|Date of expiry)[:\s]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4})",
            ],
        ) or self._extract_value_after_label(raw_text, [r"Có giá trị đến", r"Date of expiry"])

        return NationalIdExtracted(
            nationalIdNumber=national_id,
            fullName=full_name,
            dateOfBirth=date_of_birth,
            sex=sex,
            nationality=normalize_display_text(nationality),
            placeOfOrigin=origin,
            placeOfResidence=residence,
            expiryDate=expiry,
            rawText=raw_text,
        )

    def _document_checks(self, extracted: NationalIdExtracted) -> NationalIdDocumentChecks:
        joined = normalize_compare_text(" ".join(extracted.raw_text))
        return NationalIdDocumentChecks(
            nationalMottoFound=(
                "cong hoa" in joined
                and ("xa hoi" in joined or "xahoi" in joined)
                and ("viet nam" in joined or "vietnam" in joined)
            ),
            nationalIdTitleFound=(
                ("can cuoc" in joined and "cong dan" in joined)
                or "citizen identity card" in joined
            ),
            chipCardMarkerFound="citizen identity card" in joined or "can cuoc cong dan" in joined,
            nationalIdNumberFound=bool(extracted.national_id_number),
            fullNameFound=bool(extracted.full_name),
            dateOfBirthFound=bool(extracted.date_of_birth),
        )

    def _match_checks(
        self,
        request: NationalIdVerificationRequest,
        extracted: NationalIdExtracted | None,
    ) -> NationalIdMatchChecks:
        extracted_name = extracted.full_name if extracted else None
        name_score = None
        name_matched = None
        if request.full_name:
            expected_name = normalize_compare_text(request.full_name).upper()
            ocr_name = normalize_compare_text(extracted_name).upper()
            name_score = round(ratio(expected_name, ocr_name), 2) if ocr_name else 0.0
            name_matched = name_score >= 85

        return NationalIdMatchChecks(
            fullNameProvided=bool(request.full_name),
            fullNameMatched=name_matched,
            fullNameScore=name_score,
        )

    def _extract_after_label(self, lines: list[str], labels: list[str]) -> str | None:
        for index, line in enumerate(lines):
            for label in labels:
                if re.search(label, line, flags=re.IGNORECASE):
                    parts = re.split(r"[:：]", line, maxsplit=1)
                    if len(parts) == 2 and parts[1].strip():
                        return parts[1].strip()
                    if index + 1 < len(lines):
                        return lines[index + 1].strip()
        return None

    def _extract_value_after_label(self, lines: list[str], labels: list[str]) -> str | None:
        value = self._extract_after_label(lines, labels)
        if value and re.search(r"[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}", value):
            return value
        return None

    def _extract_residence(self, lines: list[str]) -> str | None:
        for index, line in enumerate(lines):
            if re.search(r"(Nơi thường trú|Place of residence)", line, flags=re.IGNORECASE):
                parts = re.split(r"[:：]", line, maxsplit=1)
                values: list[str] = []
                if len(parts) == 2 and parts[1].strip():
                    values.append(parts[1].strip())
                if index + 1 < len(lines):
                    next_line = lines[index + 1].strip()
                    if next_line and not re.search(r"(Có giá trị|Date of expiry|CỘNG HÒA)", next_line, flags=re.IGNORECASE):
                        values.append(next_line)
                return normalize_display_text(", ".join(values))
        return None

    def _first_match(self, text: str, patterns: list[str]) -> str | None:
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                return normalize_display_text(match.group(1).strip())
        return None

    def _recommend(
        self,
        flags: list[str],
        confidence: float,
        checks: NationalIdDocumentChecks,
    ) -> Recommendation:
        reject_flags = {
            "FULL_NAME_MISMATCH",
            "NATIONAL_ID_TITLE_NOT_FOUND",
            "NATIONAL_MOTTO_NOT_FOUND",
        }
        need_more_flags = {"NO_TEXT_DETECTED", "IMAGE_TOO_SMALL", "DOCUMENT_NOT_READABLE"}
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

    def _message_for(self, flags: list[str], recommendation: Recommendation) -> str:
        if recommendation == Recommendation.REJECT:
            if "NATIONAL_ID_TITLE_NOT_FOUND" in flags:
                return "Uploaded image does not appear to be a CCCD front image."
            if "NATIONAL_MOTTO_NOT_FOUND" in flags:
                return "Uploaded image is missing required Vietnamese national ID markers."
            if "FULL_NAME_MISMATCH" in flags:
                return "Full name on the national ID does not match the provided full name."
            return "National ID verification was rejected."
        if recommendation == Recommendation.NEED_MORE_INFO:
            return "National ID image is not readable enough. Please upload a clearer front image."
        return "National ID OCR completed, but extracted fields or document markers need review."

    def _is_document_valid(self, checks: NationalIdDocumentChecks) -> bool:
        return (
            checks.national_motto_found
            and checks.national_id_title_found
            and checks.national_id_number_found
            and checks.full_name_found
            and checks.date_of_birth_found
        )

    def _empty_checks(self) -> NationalIdDocumentChecks:
        return NationalIdDocumentChecks(
            nationalMottoFound=False,
            nationalIdTitleFound=False,
            chipCardMarkerFound=False,
            nationalIdNumberFound=False,
            fullNameFound=False,
            dateOfBirthFound=False,
        )

    def _response(
        self,
        valid: bool,
        confidence: float,
        extracted: NationalIdExtracted,
        checks: NationalIdDocumentChecks,
        matches: NationalIdMatchChecks,
        flags: list[str],
        recommendation: Recommendation,
        message: str | None,
    ) -> NationalIdVerificationResponse:
        return NationalIdVerificationResponse(
            valid=valid,
            documentType=DocumentType.NATIONAL_ID,
            ocrConfidence=confidence,
            extracted=extracted,
            documentChecks=checks,
            matchChecks=matches,
            flags=flags,
            recommendation=recommendation,
            message=message,
        )
