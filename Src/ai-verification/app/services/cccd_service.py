import logging
import re
from dataclasses import dataclass
from typing import Any

from app.schemas.common import DocumentType, Recommendation

logger = logging.getLogger(__name__)
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError, PaddleOcrService


@dataclass
class CccdExtracted:
    national_id: str | None = None
    full_name: str | None = None
    date_of_birth: str | None = None
    sex: str | None = None
    nationality: str | None = None
    home_address: str | None = None
    address: str | None = None
    issue_date: str | None = None
    expiry_date: str | None = None
    raw_text: list[str] | None = None


@dataclass
class CccdResult:
    success: bool
    confidence: float
    extracted: CccdExtracted
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None


class CccdService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()
        self.ocr = PaddleOcrService()

    async def verify(self, front_image_url: str, back_image_url: str | None = None) -> CccdResult:
        try:
            image = await self.loader.load(front_image_url)
        except (ImageLoadError, OSError, ValueError) as exc:
            return CccdResult(
                success=False,
                confidence=0.0,
                extracted=CccdExtracted(),
                flags=["IMAGE_DOWNLOAD_FAILED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message=str(exc),
            )
        return await self._process_image(image)

    async def verify_image(self, image: Any) -> CccdResult:
        return await self._process_image(image)

    async def _process_image(self, image: Any) -> CccdResult:
        quality = self.quality.check_image(image, DocumentType.NATIONAL_ID)
        flags = list(quality.flags)

        if not quality.acceptable:
            return CccdResult(
                success=False,
                confidence=0.0,
                extracted=CccdExtracted(),
                flags=flags,
                recommendation=Recommendation.NEED_MORE_INFO,
                message="Ảnh CCCD không đạt chất lượng. Vui lòng chụp lại ảnh rõ nét hơn.",
            )

        try:
            lines = self.ocr.read_text(image)
        except OcrUnavailableError as exc:
            return CccdResult(
                success=False,
                confidence=0.0,
                extracted=CccdExtracted(),
                flags=["OCR_ENGINE_UNAVAILABLE"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )
        except OcrProcessingError as exc:
            return CccdResult(
                success=False,
                confidence=0.0,
                extracted=CccdExtracted(),
                flags=["OCR_PROCESSING_FAILED"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message=str(exc),
            )

        if not lines:
            logger.warning("PaddleOCR returned no text lines for the image.")
            return CccdResult(
                success=False,
                confidence=0.0,
                extracted=CccdExtracted(),
                flags=["NO_TEXT_DETECTED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message="Không phát hiện văn bản trên ảnh CCCD.",
            )

        raw_texts = [line.text for line in lines]
        logger.info("OCR text lines: %s", raw_texts)

        extracted = self._extract_fields(lines)
        ocr_confidence = round(sum(line.confidence for line in lines) / len(lines), 3)

        if not extracted.national_id:
            flags.append("NATIONAL_ID_NOT_FOUND")
            logger.warning("National ID not found in OCR text. Joined text: %s", "\n".join(raw_texts))
        if not extracted.full_name:
            flags.append("FULL_NAME_NOT_FOUND")
        if not extracted.date_of_birth:
            flags.append("DATE_OF_BIRTH_NOT_FOUND")

        recommendation = Recommendation.PASS if (extracted.national_id and extracted.full_name and not flags) else Recommendation.NEED_MORE_INFO

        return CccdResult(
            success=bool(extracted.national_id),
            confidence=ocr_confidence,
            extracted=extracted,
            flags=flags,
            recommendation=recommendation,
            message=None if extracted.national_id else "Không thể trích xuất số CCCD từ ảnh.",
        )

    def _extract_fields(self, lines: list[OcrLine]) -> CccdExtracted:
        raw_text = [line.text for line in lines]
        joined = "\n".join(raw_text)

        national_id = self._first_match(joined, [
            r"(?:CĂN CƯỚC|CCCD|SỐ CCCD|Canc Cuoc|Can Cuoc)[\s:]*(?:CÔNG DÂN|CONG DAN)?[\s:]*(\d{12})",
            r"\b(\d{12})\b",
        ])

        if national_id:
            national_id = national_id.strip()

        full_name = self._extract_field(joined, r"(?:Họ và tên|Họ tên|Ho va ten|Ho ten|Họ tên|Full name|Name)[:\s]*(.+)")

        if not full_name:
            for i, line in enumerate(raw_text):
                cleaned = line.strip().upper()
                if cleaned == "CĂN CƯỚC CÔNG DÂN" or cleaned.startswith("CĂN CƯỚC"):
                    if i + 1 < len(raw_text):
                        continue
                if re.match(r"^\d{12}$", cleaned):
                    continue
                if re.match(r"^\d{2}/\d{2}/\d{4}$", cleaned):
                    continue
                if cleaned in ("NAM", "NỮ", "NU"):
                    continue
                if re.match(r"^QUÊ QUÁN|^NGUYÊN QUÁN|^NƠI THƯỜNG TRÚ|^QUOC TICH|^DÂN TỘC", cleaned):
                    continue
                if not full_name and len(cleaned) > 5 and not re.search(r"[:/]", cleaned):
                    full_name = line.strip()
                    break

        date_of_birth = self._extract_field(joined, [
            r"(?:Ngày sinh|Ngay sinh|Sinh ngày|Sinh ngay|Date of birth|DOB)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
            r"\b(\d{2}/\d{2}/\d{4})\b",
        ])

        sex = self._extract_field(joined, r"(?:Giới tính|Gioi tinh|Sex|Giới)[:\s]*(Nam|Nữ|Nu|Nam|Male|Female)")
        if not sex:
            for line in raw_text:
                cleaned = line.strip().upper()
                if cleaned in ("NAM", "NỮ", "NU"):
                    sex = cleaned.title()
                    break

        nationality = self._extract_field(joined, r"(?:Quốc tịch|Quoc tich|Nationality|Dân tộc)[:\s]*(.+)")
        if not nationality:
            for line in raw_text:
                cleaned = line.strip().upper()
                if "VIỆT NAM" in cleaned or "VIET NAM" in cleaned or "VIETNAM" in cleaned:
                    if not re.search(r"(CỘNG HÒA|ĐỘC LẬP|HẠNH PHÚC)", cleaned, re.IGNORECASE):
                        nationality = line.strip()
                        break

        home_address = self._extract_field(joined, r"(?:Quê quán|Que quan|Nguyên quán|Nguyên quan|Nguyen quan|Que quan)[:\s]*(.+)")
        if home_address:
            home_address = self._clean_address(home_address)

        address = self._extract_field(joined, r"(?:Nơi thường trú|Noi thuong tru|Địa chỉ thường trú|Dia chi thuong tru|Địa chỉ|Dia chi|Address)[:\s]*(.+)")
        if address:
            address = self._clean_address(address)

        issue_date = self._first_match(joined, [
            r"(?:Ngày cấp|Ngay cap|Date of issue|Issue date)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
        ])

        expiry_date = self._first_match(joined, [
            r"(?:Có giá trị đến|Co gia tri den|Ngày hết hạn|Ngay het han|Expiry date|Expires)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{4})",
        ])

        return CccdExtracted(
            national_id=national_id,
            full_name=full_name,
            date_of_birth=date_of_birth,
            sex=sex,
            nationality=nationality,
            home_address=home_address,
            address=address,
            issue_date=issue_date,
            expiry_date=expiry_date,
            raw_text=raw_text,
        )

    def _extract_field(self, text: str, patterns: str | list[str]) -> str | None:
        if isinstance(patterns, str):
            patterns = [patterns]
        for pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if match:
                value = match.group(1).strip().strip(":;,. ")
                return value if value else None
        return None

    def _first_match(self, text: str, patterns: list[str]) -> str | None:
        return self._extract_field(text, patterns)

    def _clean_address(self, address: str) -> str:
        address = re.sub(r"\s+", " ", address).strip()
        return address.strip(":;,. ")
