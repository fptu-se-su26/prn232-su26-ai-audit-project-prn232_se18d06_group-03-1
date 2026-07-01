from fastapi import APIRouter, Depends

from app.core.security import verify_internal_api_key
from app.schemas.requests import FaceEnrollRequest, FaceMatchDocumentRequest
from app.schemas.responses import FaceEnrollResponse, FaceMatchDocumentResponse
from app.services.face_service import FaceService

router = APIRouter(
    prefix="/face",
    tags=["face"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/enroll", response_model=FaceEnrollResponse)
async def enroll_face(request: FaceEnrollRequest) -> FaceEnrollResponse:
    service = FaceService()
    return await service.enroll(request)


@router.post("/match-document", response_model=FaceMatchDocumentResponse)
async def match_document_face(request: FaceMatchDocumentRequest) -> FaceMatchDocumentResponse:
    service = FaceService()
    return await service.match_document(request)

