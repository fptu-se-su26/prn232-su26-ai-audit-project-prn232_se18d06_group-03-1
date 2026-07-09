from pathlib import Path
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError
from app.services.vietnamese_text import normalize_display_text


class OcrSpaceService:
    async def read_text(self, image_url: str) -> list[OcrLine]:
        settings = get_settings()
        if not settings.ocr_space_api_key:
            raise OcrUnavailableError("OCR.space API key is not configured.")

        data = {
            "apikey": settings.ocr_space_api_key,
            "language": settings.ocr_space_language,
            "OCREngine": "2",
            "scale": "true",
            "isOverlayRequired": "false",
        }

        parsed = urlparse(image_url)
        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                if parsed.scheme in {"http", "https"}:
                    response = await client.post(
                        settings.ocr_space_api_url,
                        data={**data, "url": image_url},
                    )
                else:
                    path = Path(image_url)
                    if not path.exists():
                        raise OcrProcessingError(f"Image file not found: {path}")
                    with path.open("rb") as file:
                        response = await client.post(
                            settings.ocr_space_api_url,
                            data=data,
                            files={"file": (path.name, file, "application/octet-stream")},
                        )
                response.raise_for_status()
        except OcrProcessingError:
            raise
        except Exception as exc:
            raise OcrProcessingError(f"OCR.space request failed: {exc}") from exc

        return self._parse_response(response.json())

    async def read_text_bytes(
        self,
        content: bytes,
        file_name: str = "image.jpg",
        content_type: str = "application/octet-stream",
    ) -> list[OcrLine]:
        settings = get_settings()
        if not settings.ocr_space_api_key:
            raise OcrUnavailableError("OCR.space API key is not configured.")
        if len(content) > settings.max_image_bytes:
            raise OcrProcessingError("Image is larger than configured maximum size.")

        data = {
            "apikey": settings.ocr_space_api_key,
            "language": settings.ocr_space_language,
            "OCREngine": "2",
            "scale": "true",
            "isOverlayRequired": "false",
        }

        try:
            async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
                response = await client.post(
                    settings.ocr_space_api_url,
                    data=data,
                    files={"file": (file_name, content, content_type)},
                )
                response.raise_for_status()
        except Exception as exc:
            raise OcrProcessingError(f"OCR.space request failed: {exc}") from exc

        return self._parse_response(response.json())

    def _parse_response(self, payload: dict) -> list[OcrLine]:
        if payload.get("IsErroredOnProcessing"):
            message = payload.get("ErrorMessage") or payload.get("ErrorDetails") or "OCR.space processing failed."
            if isinstance(message, list):
                message = "; ".join(str(item) for item in message)
            raise OcrProcessingError(str(message))

        lines: list[OcrLine] = []
        for item in payload.get("ParsedResults") or []:
            for line in str(item.get("ParsedText") or "").splitlines():
                normalized = normalize_display_text(line)
                if normalized:
                    lines.append(OcrLine(normalized, 0.90))
        return lines
