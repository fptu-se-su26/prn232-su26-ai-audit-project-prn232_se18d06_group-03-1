import hashlib
from typing import Any

from app.core.config import get_settings
from app.schemas.common import DocumentType, Recommendation
from app.schemas.requests import FaceEnrollRequest, FaceMatchDocumentRequest
from app.schemas.responses import FaceEnrollResponse, FaceMatchDocumentResponse
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.image_quality_service import ImageQualityService


class FaceService:
    def __init__(self) -> None:
        self.loader = ImageLoader()
        self.quality = ImageQualityService()

    async def enroll(self, request: FaceEnrollRequest) -> FaceEnrollResponse:
        try:
            selfie = await self.loader.load(str(request.selfie_image_url))
            cccd = await self.loader.load(str(request.national_id_front_image_url))
        except (ImageLoadError, OSError, ValueError) as exc:
            return FaceEnrollResponse(
                valid=False,
                selfieQualityScore=0.0,
                cccdFaceDetected=False,
                selfieFaceDetected=False,
                matchScore=None,
                embeddingRef=None,
                flags=["IMAGE_DOWNLOAD_FAILED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message=str(exc),
            )

        quality = self.quality.check_image(selfie, DocumentType.SELFIE)
        if not quality.acceptable:
            return FaceEnrollResponse(
                valid=False,
                selfieQualityScore=quality.quality_score,
                cccdFaceDetected=False,
                selfieFaceDetected=False,
                matchScore=None,
                embeddingRef=None,
                flags=quality.flags,
                recommendation=Recommendation.NEED_MORE_INFO,
                message="Selfie image quality is not acceptable.",
            )

        selfie_faces = self._detect_faces(selfie)
        cccd_faces = self._detect_faces(cccd)
        flags: list[str] = []
        if len(selfie_faces) == 0:
            flags.append("NO_FACE_DETECTED")
        if len(selfie_faces) > 1:
            flags.append("MULTIPLE_FACES_DETECTED")
        if len(cccd_faces) == 0:
            flags.append("CCCD_FACE_NOT_DETECTED")

        if flags:
            return FaceEnrollResponse(
                valid=False,
                selfieQualityScore=quality.quality_score,
                cccdFaceDetected=bool(cccd_faces),
                selfieFaceDetected=bool(selfie_faces),
                matchScore=None,
                embeddingRef=None,
                flags=flags,
                recommendation=Recommendation.NEED_MORE_INFO,
                message="Face detection failed for enrollment.",
            )

        match_score = self._fallback_match_score(selfie, cccd)
        recommendation = self._recommend_match(match_score)
        valid = recommendation == Recommendation.PASS
        return FaceEnrollResponse(
            valid=valid,
            selfieQualityScore=quality.quality_score,
            cccdFaceDetected=True,
            selfieFaceDetected=True,
            matchScore=match_score,
            embeddingRef=self._embedding_ref(request.user_id, str(request.selfie_image_url)) if valid else None,
            flags=[] if valid else ["LOW_FACE_MATCH_SCORE"],
            recommendation=recommendation,
            message=None if valid else "Face match score requires follow-up.",
        )

    async def match_document(self, request: FaceMatchDocumentRequest) -> FaceMatchDocumentResponse:
        try:
            selfie = await self.loader.load(str(request.enrolled_selfie_image_url))
            document = await self.loader.load(str(request.document_image_url))
        except (ImageLoadError, OSError, ValueError) as exc:
            return FaceMatchDocumentResponse(
                valid=False,
                documentFaceDetected=False,
                matchScore=None,
                flags=["IMAGE_DOWNLOAD_FAILED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message=str(exc),
            )

        document_faces = self._detect_faces(document)
        if not document_faces:
            return FaceMatchDocumentResponse(
                valid=False,
                documentFaceDetected=False,
                matchScore=None,
                flags=["NO_FACE_DETECTED"],
                recommendation=Recommendation.NEED_MORE_INFO,
                message="No face was detected in document image.",
            )

        match_score = self._fallback_match_score(selfie, document)
        recommendation = self._recommend_match(match_score)
        valid = recommendation == Recommendation.PASS
        return FaceMatchDocumentResponse(
            valid=valid,
            documentFaceDetected=True,
            matchScore=match_score,
            flags=[] if valid else ["LOW_FACE_MATCH_SCORE"],
            recommendation=recommendation,
            message=None if valid else "Document face match score requires follow-up.",
        )

    def _detect_faces(self, image: Any) -> list[tuple[int, int, int, int]]:
        try:
            import cv2
        except ImportError:
            return []
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        classifier = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = classifier.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
        return [tuple(int(value) for value in face) for face in faces]

    def _fallback_match_score(self, first: Any, second: Any) -> float:
        import cv2

        first_hist = self._histogram_embedding(first)
        second_hist = self._histogram_embedding(second)
        score = float(cv2.compareHist(first_hist, second_hist, cv2.HISTCMP_CORREL))
        return round(max(0.0, min(1.0, score)), 3)

    def _histogram_embedding(self, image: Any) -> Any:
        import cv2

        resized = cv2.resize(image, (128, 128))
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [32, 32], [0, 180, 0, 256])
        return cv2.normalize(hist, hist).flatten()

    def _recommend_match(self, match_score: float) -> Recommendation:
        settings = get_settings()
        if match_score >= settings.face_match_pass_threshold:
            return Recommendation.PASS
        if match_score >= settings.face_match_manual_threshold:
            return Recommendation.MANUAL_REVIEW
        return Recommendation.REJECT

    def _embedding_ref(self, user_id: int, source: str) -> str:
        digest = hashlib.sha256(f"{user_id}:{source}".encode("utf-8")).hexdigest()[:24]
        return f"face-embedding-{digest}"
