from fastapi import APIRouter, Depends

from app.core.security import verify_internal_api_key
from app.schemas.requests import ImageQualityRequest
from app.schemas.responses import ImageQualityResponse
from app.services.image_quality_service import ImageQualityService

router = APIRouter(
    prefix="/image",
    tags=["image-quality"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/quality-check", response_model=ImageQualityResponse)
async def check_image_quality(request: ImageQualityRequest) -> ImageQualityResponse:
    service = ImageQualityService()
    return await service.check_from_url(str(request.image_url), request.purpose)

