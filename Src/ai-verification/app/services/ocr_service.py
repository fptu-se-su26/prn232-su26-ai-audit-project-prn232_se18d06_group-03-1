import logging
from dataclasses import dataclass
from typing import Any

from app.services.vietnamese_text import normalize_display_text

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OcrLine:
    text: str
    confidence: float


class OcrUnavailableError(RuntimeError):
    pass


class OcrProcessingError(RuntimeError):
    pass


class PaddleOcrService:
    _reader = None

    def read_text(self, image: Any) -> list[OcrLine]:
        reader = self._get_reader()
        try:
            result = reader.ocr(image)
        except TypeError:
            try:
                result = reader.ocr(image, cls=True)
            except Exception as exc:
                raise OcrProcessingError(f"PaddleOCR failed to process image: {exc}") from exc
        except Exception as exc:
            raise OcrProcessingError(f"PaddleOCR failed to process image: {exc}") from exc
        return self._flatten_result(result)

    def _get_reader(self):
        if PaddleOcrService._reader is not None:
            return PaddleOcrService._reader
        try:
            from paddleocr import PaddleOCR
        except ImportError as exc:
            raise OcrUnavailableError(
                "PaddleOCR is not installed. Install requirements.txt to enable OCR."
            ) from exc

        try:
            PaddleOcrService._reader = PaddleOCR(
                lang="vi",
                use_doc_orientation_classify=True,
                use_doc_unwarping=True,
                use_textline_orientation=True,
            )
        except TypeError:
            logger.warning("Falling back to legacy PaddleOCR constructor.")
            PaddleOcrService._reader = PaddleOCR(lang="vi", use_angle_cls=True)
        return PaddleOcrService._reader

    def _flatten_result(self, result) -> list[OcrLine]:
        lines: list[OcrLine] = []
        if not result:
            return lines

        for page in result:
            if hasattr(page, "json"):
                data = page.json
                rec_texts = data.get("res", {}).get("rec_texts", [])
                rec_scores = data.get("res", {}).get("rec_scores", [])
                lines.extend(
                    OcrLine(normalize_display_text(str(text)) or "", float(score or 0.0))
                    for text, score in zip(rec_texts, rec_scores)
                    if (normalize_display_text(str(text)) or "").strip()
                )
                continue

            if not page:
                continue
            for item in page:
                if len(item) >= 2 and isinstance(item[1], (list, tuple)):
                    text = normalize_display_text(str(item[1][0]).strip()) or ""
                    confidence = float(item[1][1] or 0.0)
                    if text:
                        lines.append(OcrLine(text, confidence))
        return lines
