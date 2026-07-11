from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.security import verify_internal_api_key
from app.schemas.requests import NationalIdVerificationRequest
from app.schemas.responses import NationalIdVerificationResponse
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.national_id_service import NationalIdService
from app.services.ocr_service import OcrProcessingError, OcrUnavailableError
from app.services.ocr_space_service import OcrSpaceService

router = APIRouter(
    prefix="/verify",
    tags=["national-id"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/national-id", response_model=NationalIdVerificationResponse)
async def verify_national_id(
    request: NationalIdVerificationRequest,
) -> NationalIdVerificationResponse:
    service = NationalIdService()
    return await service.verify(request)


@router.post("/national-id-file", response_model=NationalIdVerificationResponse)
async def verify_national_id_file(
    front_image: UploadFile = File(...),
    full_name: str | None = Form(default=None),
) -> NationalIdVerificationResponse:
    service = NationalIdService()
    request = NationalIdVerificationRequest(
        fullname=full_name,
        frontImageUrl="uploaded-file",
    )
    try:
        content = await front_image.read()
        ImageLoader()._decode(content)
    except ImageLoadError as exc:
        response = service.build_response_from_lines(request, [], ["IMAGE_DECODE_FAILED"])
        response.message = str(exc)
        return response

    try:
        lines = await OcrSpaceService().read_text_bytes(
            content,
            front_image.filename or "national-id.jpg",
            front_image.content_type or "application/octet-stream",
        )
    except OcrUnavailableError as exc:
        response = service.build_response_from_lines(request, [], ["OCR_ENGINE_UNAVAILABLE"])
        response.message = str(exc)
        return response
    except OcrProcessingError as exc:
        response = service.build_response_from_lines(request, [], ["OCR_PROCESSING_FAILED"])
        response.message = str(exc)
        return response

    if not lines:
        return service.build_response_from_lines(request, [], ["NO_TEXT_DETECTED"])
    return service.build_response_from_lines(request, lines)
