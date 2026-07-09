from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.security import verify_internal_api_key
from app.schemas.common import DocumentType
from app.schemas.requests import DriverLicenseVerificationRequest
from app.schemas.responses import DriverLicenseVerificationResponse
from app.services.driver_license_service import DriverLicenseService
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.ocr_service import OcrProcessingError, OcrUnavailableError
from app.services.ocr_space_service import OcrSpaceService

router = APIRouter(
    prefix="/verify",
    tags=["driver-license"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/driver-license", response_model=DriverLicenseVerificationResponse)
async def verify_driver_license(
    request: DriverLicenseVerificationRequest,
) -> DriverLicenseVerificationResponse:
    service = DriverLicenseService()
    return await service.verify(request)


@router.post("/driver-license-file", response_model=DriverLicenseVerificationResponse)
async def verify_driver_license_file(
    front_image: UploadFile = File(...),
    full_name: str | None = Form(default=None),
) -> DriverLicenseVerificationResponse:
    service = DriverLicenseService()
    request = DriverLicenseVerificationRequest(fullName=full_name, frontImageUrl="uploaded-file")
    try:
        content = await front_image.read()
        image = ImageLoader()._decode(content)
    except ImageLoadError as exc:
        response = service.build_response_from_lines(
            request,
            [],
            ["IMAGE_DECODE_FAILED"],
        )
        response.message = str(exc)
        return response

    quality = service.quality.check_image(image, DocumentType.DRIVER_LICENSE)
    flags = list(quality.flags)

    try:
        lines = await OcrSpaceService().read_text_bytes(
            content,
            front_image.filename or "driver-license.jpg",
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
        return service.build_response_from_lines(request, [], ["NO_TEXT_DETECTED", *flags])
    return service.build_response_from_lines(request, lines, flags)


@router.post("/driver-license-ocrspace", response_model=DriverLicenseVerificationResponse)
async def verify_driver_license_ocrspace(
    request: DriverLicenseVerificationRequest,
) -> DriverLicenseVerificationResponse:
    service = DriverLicenseService()
    try:
        lines = await OcrSpaceService().read_text(request.front_image_url)
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
