from fastapi import APIRouter, Depends

from app.core.security import verify_internal_api_key
from app.schemas.requests import VehicleRegistrationVerificationRequest
from app.schemas.responses import VehicleRegistrationVerificationResponse
from app.services.vehicle_registration_service import VehicleRegistrationService

router = APIRouter(
    prefix="/verify",
    tags=["vehicle-registration"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/vehicle-registration", response_model=VehicleRegistrationVerificationResponse)
async def verify_vehicle_registration(
    request: VehicleRegistrationVerificationRequest,
) -> VehicleRegistrationVerificationResponse:
    service = VehicleRegistrationService()
    return await service.verify(request)

