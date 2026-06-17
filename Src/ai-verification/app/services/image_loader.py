from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.config import get_settings


class ImageLoadError(RuntimeError):
    pass


class ImageLoader:
    async def load(self, image_url: str) -> Any:
        parsed = urlparse(image_url)
        if parsed.scheme in {"http", "https"}:
            return await self._load_remote(image_url)
        if parsed.scheme == "file":
            return self._load_local(Path(parsed.path))
        return self._load_local(Path(image_url))

    async def _load_remote(self, image_url: str) -> Any:
        settings = get_settings()
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.get(image_url)
            response.raise_for_status()
            content = response.content
        if len(content) > settings.max_image_bytes:
            raise ImageLoadError("Image is larger than configured maximum size.")
        return self._decode(content)

    def _load_local(self, path: Path) -> Any:
        if not path.exists():
            raise ImageLoadError(f"Image file not found: {path}")
        content = path.read_bytes()
        return self._decode(content)

    def _decode(self, content: bytes) -> Any:
        try:
            import cv2
            import numpy as np
        except ImportError as exc:
            raise ImageLoadError("OpenCV and NumPy are required to decode images.") from exc
        data = np.frombuffer(content, dtype=np.uint8)
        image = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if image is None:
            raise ImageLoadError("Unsupported or unreadable image.")
        return image
