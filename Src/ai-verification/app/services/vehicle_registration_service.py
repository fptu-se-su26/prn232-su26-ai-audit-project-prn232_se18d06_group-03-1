import re
from difflib import SequenceMatcher

from app.core.config import get_settings
from app.schemas.common import DocumentType, Recommendation, VehicleType
from app.schemas.requests import VehicleRegistrationVerificationRequest
from app.schemas.responses import VehicleRegistrationExtracted, VehicleRegistrationVerificationResponse
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError, PaddleOcrService
from app.services.ocr_space_service import OcrSpaceService
from app.services.vietnamese_text import normalize_compare_text, normalize_license_plate


class VehicleRegistrationService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()
        self.ocr = PaddleOcrService()
        self.ocr_space = OcrSpaceService()

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
                None,
                None,
                None,
                0.0,
                VehicleRegistrationExtracted(rawText=[]),
                ["IMAGE_DOWNLOAD_FAILED"],
                Recommendation.NEED_MORE_INFO,
                str(exc),
            )

        quality = self.quality.check_image(image, DocumentType.VEHICLE_REGISTRATION)
        flags.extend(quality.flags)

        try:
            lines = await self.ocr_space.read_text(str(request.file_url))
        except OcrUnavailableError as exc:
            return self._response(
                False,
                VehicleType.UNKNOWN,
                False,
                None,
                None,
                None,
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
                None,
                None,
                None,
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
                None,
                None,
                None,
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
        plate_matches = self._matches_license_plate(extracted.license_plate, request.expected_license_plate)
        brand_matches = self._matches_name(extracted.brand, request.expected_brand)
        model_matches = self._matches_model(extracted.model, request.expected_model)

        if not extracted.license_plate:
            flags.append("LICENSE_PLATE_NOT_FOUND")
        elif plate_matches is False:
            flags.append("LICENSE_PLATE_MISMATCH_CLEAR")

        if request.expected_brand:
            if not extracted.brand:
                flags.append("BRAND_NOT_FOUND")
            elif brand_matches is False:
                flags.append("BRAND_MISMATCH_CLEAR")

        if request.expected_model:
            if not extracted.model:
                flags.append("MODEL_NOT_FOUND")
            elif model_matches is False:
                flags.append("MODEL_MISMATCH_CLEAR")

        if registration_vehicle_type == VehicleType.UNKNOWN:
            flags.append("VEHICLE_TYPE_UNCERTAIN")
        elif not type_matches:
            flags.append("VEHICLE_TYPE_MISMATCH_SIGNAL")

        if confidence < get_settings().low_ocr_confidence_threshold:
            flags.append("LOW_OCR_CONFIDENCE")

        recommendation = self._recommend(flags, confidence)
        valid = recommendation == Recommendation.PASS

        return self._response(
            valid,
            registration_vehicle_type,
            type_matches,
            plate_matches,
            brand_matches,
            model_matches,
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
        lines = text.splitlines()
        plate_label_indexes = [
            index
            for index, line in enumerate(lines)
            if any(marker in normalize_compare_text(line) for marker in ["bien so", "plate", "n plate"])
        ]

        for index in plate_label_indexes:
            nearby = " ".join(lines[index : index + 5])
            plate = self._extract_plate_from_text(nearby)
            if plate:
                return plate

        for line in lines:
            compare = normalize_compare_text(line)
            if any(marker in compare for marker in ["engine", "chassis", "so may", "so khung"]):
                continue
            plate = self._extract_plate_from_text(line)
            if plate:
                return plate

        return None

    def _extract_plate_from_text(self, text: str) -> str | None:
        compact_text = re.sub(r"[^A-Z0-9]", "", text.upper())

        motorbike_match = re.search(r"([0-9]{2}[A-Z][0-9][0-9]{5})", compact_text)
        if motorbike_match:
            plate = motorbike_match.group(1)
            return f"{plate[:4]}-{plate[4:]}"

        car_match = re.search(r"([0-9]{2}[A-Z]{1,2}[0-9]{4,6})", compact_text)
        if car_match:
            plate = car_match.group(1)
            prefix_len = 3 if plate[2].isalpha() and plate[3].isdigit() else 4
            return f"{plate[:prefix_len]}-{plate[prefix_len:]}"

        return None

    def _infer_vehicle_type(self, text: str, license_plate: str | None) -> VehicleType:
        compare = normalize_compare_text(text)
        if any(word in compare for word in ["o to", "oto", "automobile", "xe con", "xe tai"]):
            return VehicleType.CAR
        if any(word in compare for word in ["mo to", "xe may", "motorcycle", "gian may", "gan may"]):
            return VehicleType.MOTORBIKE
        plate = normalize_license_plate(license_plate)
        if re.match(r"^[0-9]{2}[A-Z][0-9][0-9]{5}$", plate):
            return VehicleType.MOTORBIKE
        if re.match(r"^[0-9]{2}[A-Z][0-9]{4,6}$", plate):
            return VehicleType.CAR
        return VehicleType.UNKNOWN

    def _matches_license_plate(self, extracted: str | None, expected: str | None) -> bool | None:
        if not expected:
            return None
        extracted_plate = normalize_license_plate(extracted)
        expected_plate = normalize_license_plate(expected)
        if not extracted_plate:
            return False
        return extracted_plate == expected_plate

    def _matches_name(self, extracted: str | None, expected: str | None) -> bool | None:
        if not expected:
            return None
        extracted_normalized = normalize_compare_text(extracted)
        expected_normalized = normalize_compare_text(expected)
        if not extracted_normalized:
            return False
        return self._text_matches(extracted_normalized, expected_normalized)

    def _matches_model(self, extracted: str | None, expected: str | None) -> bool | None:
        if not expected:
            return None
        extracted_base = self._base_model_name(extracted)
        expected_base = self._base_model_name(expected)
        if not extracted_base:
            return False
        return self._text_matches(extracted_base, expected_base, allow_contains=False)

    def _base_model_name(self, value: str | None) -> str:
        normalized = normalize_compare_text(value)
        normalized = re.sub(r"\b(abs|cbs|fi|esp|deluxe|special|premium|standard)\b", " ", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip()

        compact = normalized.replace(" ", "")
        if compact.startswith("airblade"):
            return "air blade"
        if compact.startswith("vario"):
            return "vario"
        if re.fullmatch(r"sh\s*(125|150|160|300|350)?", normalized):
            return "sh"

        return normalized

    def _text_matches(self, left: str, right: str, allow_contains: bool = True) -> bool:
        if not left or not right:
            return False
        if left == right:
            return True
        left_compact = left.replace(" ", "")
        right_compact = right.replace(" ", "")
        if left_compact == right_compact:
            return True
        if allow_contains:
            if len(left_compact) >= 4 and left_compact in right_compact:
                return True
            if len(right_compact) >= 4 and right_compact in left_compact:
                return True
        return SequenceMatcher(None, left_compact, right_compact).ratio() >= 0.88

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
        reject_flags = {
            "LICENSE_PLATE_MISMATCH_CLEAR",
            "BRAND_MISMATCH_CLEAR",
            "MODEL_MISMATCH_CLEAR",
        }
        need_more_flags = {
            "NO_TEXT_DETECTED",
            "IMAGE_TOO_SMALL",
            "DOCUMENT_NOT_READABLE",
        }
        non_blocking_flags = {
            "VEHICLE_TYPE_UNCERTAIN",
            "VEHICLE_TYPE_MISMATCH_SIGNAL",
        }
        if any(flag in reject_flags for flag in flags):
            return Recommendation.REJECT
        if any(flag in need_more_flags for flag in flags):
            return Recommendation.NEED_MORE_INFO
        if flags and all(flag in non_blocking_flags for flag in flags):
            return Recommendation.PASS
        if flags and all(flag in non_blocking_flags | {"IMAGE_TOO_BLURRY"} for flag in flags):
            return Recommendation.PASS if confidence >= get_settings().good_ocr_confidence_threshold else Recommendation.MANUAL_REVIEW
        if flags or confidence < get_settings().good_ocr_confidence_threshold:
            return Recommendation.MANUAL_REVIEW
        return Recommendation.PASS

    def _response(
        self,
        valid: bool,
        registration_vehicle_type: VehicleType,
        type_matches: bool,
        plate_matches: bool | None,
        brand_matches: bool | None,
        model_matches: bool | None,
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
            licensePlateMatchesExpected=plate_matches,
            brandMatchesExpected=brand_matches,
            modelMatchesExpected=model_matches,
            ocrConfidence=confidence,
            extracted=extracted,
            flags=flags,
            recommendation=recommendation,
            message=message,
        )
