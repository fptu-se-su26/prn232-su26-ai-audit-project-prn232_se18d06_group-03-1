from fastapi import APIRouter, Depends

from app.core.security import verify_internal_api_key
from app.schemas.common import DocumentType, Recommendation, VehicleType
from app.schemas.requests import DriverLicenseVerificationRequest, VehicleRegistrationVerificationRequest
from app.schemas.responses import (
    DriverLicenseExtracted,
    DriverLicenseVerificationResponse,
    VehicleRegistrationExtracted,
    VehicleRegistrationVerificationResponse,
)
from app.services.driver_license_service import DriverLicenseService
from app.services.image_loader import ImageLoadError, ImageLoader
from app.services.ocr_service import OcrProcessingError, OcrUnavailableError
from app.services.vehicle_registration_service import VehicleRegistrationService
from app.services.yolo_vietocr_service import YoloVietOcrService

router = APIRouter(
    prefix="/verify",
    tags=["yolov5-vietocr"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/driver-license-yolo-vietocr", response_model=DriverLicenseVerificationResponse)
async def verify_driver_license_yolo_vietocr(
    request: DriverLicenseVerificationRequest,
) -> DriverLicenseVerificationResponse:
    service = DriverLicenseService()
    try:
        image = await ImageLoader().load(str(request.front_image_url))
        quality = service.quality.check_image(image, DocumentType.DRIVER_LICENSE)
        lines = YoloVietOcrService().read_text(image, DocumentType.DRIVER_LICENSE)
    except (ImageLoadError, OSError, ValueError) as exc:
        return service._response(
            valid=False,
            license_vehicle_type=VehicleType.UNKNOWN,
            license_class_valid=False,
            confidence=0.0,
            extracted=DriverLicenseExtracted(rawText=[]),
            document_checks=service._empty_checks(),
            name_match=service._name_match(request.full_name, None),
            flags=["IMAGE_DOWNLOAD_FAILED"],
            recommendation=Recommendation.NEED_MORE_INFO,
            message=str(exc),
        )
    except OcrUnavailableError as exc:
        return service._response(
            valid=False,
            license_vehicle_type=VehicleType.UNKNOWN,
            license_class_valid=False,
            confidence=0.0,
            extracted=DriverLicenseExtracted(rawText=[]),
            document_checks=service._empty_checks(),
            name_match=service._name_match(request.full_name, None),
            flags=["YOLO_VIETOCR_UNAVAILABLE"],
            recommendation=Recommendation.MANUAL_REVIEW,
            message=str(exc),
        )
    except OcrProcessingError as exc:
        return service._response(
            valid=False,
            license_vehicle_type=VehicleType.UNKNOWN,
            license_class_valid=False,
            confidence=0.0,
            extracted=DriverLicenseExtracted(rawText=[]),
            document_checks=service._empty_checks(),
            name_match=service._name_match(request.full_name, None),
            flags=["YOLO_VIETOCR_PROCESSING_FAILED"],
            recommendation=Recommendation.MANUAL_REVIEW,
            message=str(exc),
        )

    flags = ["OCR_ENGINE_YOLO_VIETOCR", *quality.flags]
    if not lines:
        return service.build_response_from_lines(request, [], ["NO_TEXT_DETECTED", *flags])
    return service.build_response_from_lines(request, lines, flags)


@router.post("/vehicle-registration-yolo-vietocr", response_model=VehicleRegistrationVerificationResponse)
async def verify_vehicle_registration_yolo_vietocr(
    request: VehicleRegistrationVerificationRequest,
) -> VehicleRegistrationVerificationResponse:
    service = VehicleRegistrationService()
    try:
        image = await ImageLoader().load(str(request.file_url))
        quality = service.quality.check_image(image, DocumentType.VEHICLE_REGISTRATION)
        lines = YoloVietOcrService().read_text(image, DocumentType.VEHICLE_REGISTRATION)
    except (ImageLoadError, OSError, ValueError) as exc:
        return service._response(
            False,
            VehicleType.UNKNOWN,
            False,
            None,
            None,
            None,
            0.0,
            VehicleRegistrationExtracted(rawText=[]),
            ["IMAGE_DOWNLOAD_FAILED"],
            Recommendation.NEED_MORE_INFO,
            str(exc),
        )
    except OcrUnavailableError as exc:
        return service._response(
            False,
            VehicleType.UNKNOWN,
            False,
            None,
            None,
            None,
            0.0,
            VehicleRegistrationExtracted(rawText=[]),
            ["YOLO_VIETOCR_UNAVAILABLE"],
            Recommendation.MANUAL_REVIEW,
            str(exc),
        )
    except OcrProcessingError as exc:
        return service._response(
            False,
            VehicleType.UNKNOWN,
            False,
            None,
            None,
            None,
            0.0,
            VehicleRegistrationExtracted(rawText=[]),
            ["YOLO_VIETOCR_PROCESSING_FAILED"],
            Recommendation.MANUAL_REVIEW,
            str(exc),
        )

    flags = ["OCR_ENGINE_YOLO_VIETOCR", *quality.flags]
    if not lines:
        return service.build_response_from_lines(request, [], ["NO_TEXT_DETECTED", *flags])
    return service.build_response_from_lines(request, lines, flags)
