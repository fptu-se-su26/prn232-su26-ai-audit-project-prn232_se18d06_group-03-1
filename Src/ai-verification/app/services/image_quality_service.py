from typing import Any

from app.schemas.common import DocumentType, Recommendation
from app.schemas.responses import ImageQualityMetrics, ImageQualityResponse
from app.services.image_loader import ImageLoadError, ImageLoader


class ImageQualityService:
    def __init__(self) -> None:
        self.loader = ImageLoader()

    async def check_from_url(self, image_url: str, purpose: DocumentType) -> ImageQualityResponse:
        try:
            image = await self.loader.load(image_url)
        except (ImageLoadError, OSError, ValueError) as exc:
            return ImageQualityResponse(
                acceptable=False,
                qualityScore=0.0,
                flags=["IMAGE_DOWNLOAD_FAILED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message=str(exc),
                metrics=ImageQualityMetrics(),
            )
        return self.check_image(image, purpose)

    def check_image(self, image: Any, purpose: DocumentType) -> ImageQualityResponse:
        try:
            import cv2
            import numpy as np
        except ImportError:
            return ImageQualityResponse(
                acceptable=False,
                qualityScore=0.0,
                flags=["IMAGE_PROCESSING_ENGINE_UNAVAILABLE"],
                recommendation=Recommendation.MANUAL_REVIEW,
                message="OpenCV and NumPy are required to check image quality.",
                metrics=ImageQualityMetrics(),
            )
        height, width = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        brightness = float(np.mean(gray))

        flags: list[str] = []
        if width < 480 or height < 320:
            flags.append("IMAGE_TOO_SMALL")
        if blur_score < 80:
            flags.append("IMAGE_TOO_BLURRY")
        if brightness < 45:
            flags.append("IMAGE_TOO_DARK")
        if brightness > 225:
            flags.append("IMAGE_TOO_BRIGHT")

        quality_score = self._score(width, height, blur_score, brightness)
        acceptable = not flags
        recommendation = Recommendation.PASS if acceptable else Recommendation.NEED_MORE_INFO

        return ImageQualityResponse(
            acceptable=acceptable,
            qualityScore=quality_score,
            flags=flags,
            recommendation=recommendation,
            message=None if acceptable else f"{purpose} image quality is not acceptable.",
            metrics=ImageQualityMetrics(
                blurScore=blur_score,
                brightness=brightness,
                width=width,
                height=height,
            ),
        )

    def _score(self, width: int, height: int, blur_score: float, brightness: float) -> float:
        size_score = min(1.0, (width * height) / (1280 * 720))
        blur_component = min(1.0, blur_score / 250)
        brightness_component = max(0.0, 1.0 - abs(brightness - 135) / 135)
        score = 0.35 * size_score + 0.40 * blur_component + 0.25 * brightness_component
        return round(float(max(0.0, min(1.0, score))), 3)
