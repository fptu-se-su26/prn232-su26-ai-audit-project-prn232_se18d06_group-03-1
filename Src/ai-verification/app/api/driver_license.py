from fastapi import APIRouter, Depends

from app.core.security import verify_internal_api_key
from app.schemas.requests import DriverLicenseVerificationRequest
from app.schemas.responses import DriverLicenseVerificationResponse
from app.services.driver_license_service import DriverLicenseService
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
