import re

from app.core.config import get_settings
from app.schemas.common import DocumentType, Recommendation, VehicleType
from app.schemas.requests import VehicleRegistrationVerificationRequest
from app.schemas.responses import VehicleRegistrationExtracted, VehicleRegistrationVerificationResponse
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError, PaddleOcrService
from app.services.text_similarity import ratio
from app.services.vietnamese_text import normalize_compare_text, normalize_license_plate


class VehicleRegistrationService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()
        self.ocr = PaddleOcrService()

    async def verify(
        self,
        request: VehicleRegistrationVerificationRequest,
    ) -> VehicleRegistrationVerificationResponse:
        flags: list[str] = []

        try:
            image = await self.loader.load(str(request.file_url))
        except (ImageLoadError, OSError, ValueError) as exc:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                ["IMAGE_DOWNLOAD_FAILED"],
                Recommendation.NEED_MORE_INFO,
                str(exc),
            )

        quality = self.quality.check_image(image, DocumentType.VEHICLE_REGISTRATION)
        flags.extend(quality.flags)
        if not quality.acceptable:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                flags,
                Recommendation.NEED_MORE_INFO,
                "Vehicle registration image is not clear enough for OCR.",
            )

        try:
            lines = self.ocr.read_text(image)
        except OcrUnavailableError as exc:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                ["OCR_ENGINE_UNAVAILABLE"],
                Recommendation.MANUAL_REVIEW,
                str(exc),
            )
        except OcrProcessingError as exc:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                ["OCR_PROCESSING_FAILED"],
                Recommendation.MANUAL_REVIEW,
                str(exc),
            )

        if not lines:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                ["NO_TEXT_DETECTED"],
                Recommendation.NEED_MORE_INFO,
                "No readable text was detected in vehicle registration image.",
            )

        extracted = self._extract_fields(lines)
        confidence = round(sum(line.confidence for line in lines) / len(lines), 3)
        registration_vehicle_type = extracted.vehicle_type
        type_matches = registration_vehicle_type in {request.expected_vehicle_type, VehicleType.UNKNOWN}

        if not extracted.license_plate:
            flags.append("LICENSE_PLATE_NOT_FOUND")
        elif request.license_plate:
            expected = normalize_license_plate(request.license_plate)
            actual = normalize_license_plate(extracted.license_plate)
            if expected and actual and expected != actual:
                flags.append("LICENSE_PLATE_MISMATCH_CLEAR")

        if request.owner_name and extracted.owner_name:
            score = ratio(
                normalize_compare_text(request.owner_name),
                normalize_compare_text(extracted.owner_name),
            )
            if score < 80:
                flags.append("OWNER_NAME_SIMILAR_BUT_NOT_EXACT")

        if registration_vehicle_type == VehicleType.UNKNOWN:
            flags.append("VEHICLE_TYPE_UNCERTAIN")
        elif not type_matches:
            flags.append("VEHICLE_TYPE_MISMATCH_CLEAR")

        if confidence < get_settings().low_ocr_confidence_threshold:
            flags.append("LOW_OCR_CONFIDENCE")

        recommendation = self._recommend(flags, confidence)
        valid = recommendation == Recommendation.PASS

        return self._response(
            valid,
            registration_vehicle_type,
            type_matches,
            confidence,
            extracted,
            sorted(set(flags)),
            recommendation,
            None if valid else "Vehicle registration requires follow-up based on OCR result.",
        )

    def _extract_fields(self, lines: list[OcrLine]) -> VehicleRegistrationExtracted:
        raw_text = [line.text for line in lines]
        joined = "\n".join(raw_text)
        license_plate = self._extract_plate(joined)
        vehicle_type = self._infer_vehicle_type(joined, license_plate)
        owner_name = self._extract_after_label(raw_text, [r"Chủ xe", r"Ten chu xe", r"Owner"])
        brand = self._extract_after_label(raw_text, [r"Nhãn hiệu", r"Nhan hieu", r"Brand"])
        model = self._extract_after_label(raw_text, [r"Số loại", r"So loai", r"Model"])
        engine_number = self._extract_after_label(raw_text, [r"Số máy", r"So may", r"Engine"])
        chassis_number = self._extract_after_label(raw_text, [r"Số khung", r"So khung", r"Chassis"])

        return VehicleRegistrationExtracted(
            licensePlate=license_plate,
            ownerName=owner_name,
            brand=brand,
            model=model,
            engineNumber=engine_number,
            chassisNumber=chassis_number,
            vehicleType=vehicle_type,
            rawText=raw_text,
        )

    def _extract_plate(self, text: str) -> str | None:
        patterns = [
            r"\b([0-9]{2}[A-Z][0-9]?-?[0-9]{4,5})\b",
            r"\b([0-9]{2}[A-Z]-?[0-9]{3}\.?[0-9]{2})\b",
            r"\b([0-9]{2}[A-Z]{1,2}-?[0-9]{4,5})\b",
        ]
        normalized_text = text.upper().replace(" ", "")
        for pattern in patterns:
            match = re.search(pattern, normalized_text)
            if match:
                return match.group(1)
        return None

    def _infer_vehicle_type(self, text: str, license_plate: str | None) -> VehicleType:
        compare = normalize_compare_text(text)
        if any(word in compare for word in ["o to", "oto", "automobile", "xe con", "xe tai"]):
            return VehicleType.CAR
        if any(word in compare for word in ["mo to", "xe may", "motorcycle", "gian may", "gan may"]):
            return VehicleType.MOTORBIKE
        plate = normalize_license_plate(license_plate)
        if re.match(r"^[0-9]{2}[A-Z][0-9]", plate):
            return VehicleType.MOTORBIKE
        if re.match(r"^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$", plate):
            return VehicleType.CAR
        return VehicleType.UNKNOWN

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

    def _recommend(self, flags: list[str], confidence: float) -> Recommendation:
        reject_flags = {"LICENSE_PLATE_MISMATCH_CLEAR", "VEHICLE_TYPE_MISMATCH_CLEAR"}
        need_more_flags = {
            "NO_TEXT_DETECTED",
            "IMAGE_TOO_BLURRY",
            "IMAGE_TOO_DARK",
            "IMAGE_TOO_BRIGHT",
            "IMAGE_TOO_SMALL",
            "DOCUMENT_NOT_READABLE",
        }
        if any(flag in reject_flags for flag in flags):
            return Recommendation.REJECT
        if any(flag in need_more_flags for flag in flags):
            return Recommendation.NEED_MORE_INFO
        if flags or confidence < get_settings().good_ocr_confidence_threshold:
            return Recommendation.MANUAL_REVIEW
        return Recommendation.PASS

    def _response(
        self,
        valid: bool,
        registration_vehicle_type: VehicleType,
        type_matches: bool,
        confidence: float,
        extracted: VehicleRegistrationExtracted,
        flags: list[str],
        recommendation: Recommendation,
        message: str | None,
    ) -> VehicleRegistrationVerificationResponse:
        return VehicleRegistrationVerificationResponse(
            valid=valid,
            documentType=DocumentType.VEHICLE_REGISTRATION,
            registrationVehicleType=registration_vehicle_type,
            vehicleTypeMatchesExpected=type_matches,
            ocrConfidence=confidence,
            extracted=extracted,
            flags=flags,
            recommendation=recommendation,
            message=message,
        )
