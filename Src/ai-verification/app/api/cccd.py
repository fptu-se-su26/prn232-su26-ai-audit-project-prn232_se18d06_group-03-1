import cv2
import numpy as np

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import AliasChoices, BaseModel, Field

from app.core.security import verify_internal_api_key
from app.services.cccd_service import CccdService
from app.services.image_loader import ImageLoadError


class NationalIdVerificationRequest(BaseModel):
    front_image_url: str = Field(alias="frontImageUrl")
    back_image_url: str | None = Field(default=None, alias="backImageUrl")


class NationalIdExtracted(BaseModel):
    national_id: str | None = Field(default=None, alias="nationalId")
    full_name: str | None = Field(default=None, alias="fullName")
    date_of_birth: str | None = Field(default=None, alias="dateOfBirth")
    sex: str | None = None
    nationality: str | None = None
    home_address: str | None = Field(default=None, alias="homeAddress")
    address: str | None = None
    issue_date: str | None = Field(default=None, alias="issueDate")
    expiry_date: str | None = Field(default=None, alias="expiryDate")
    raw_text: list[str] = Field(default_factory=list, alias="rawText")


class NationalIdVerificationResponse(BaseModel):
    success: bool
    confidence: float
    extracted: NationalIdExtracted
    flags: list[str]
    message: str | None = None


router = APIRouter(
    prefix="/verify",
    tags=["national-id"],
    dependencies=[Depends(verify_internal_api_key)],
)


@router.post("/national-id", response_model=NationalIdVerificationResponse)
async def verify_national_id(
    request: NationalIdVerificationRequest,
) -> NationalIdVerificationResponse:
    service = CccdService()
    result = await service.verify(request.front_image_url, request.back_image_url)

    return _to_response(result)


@router.post("/national-id/upload", response_model=NationalIdVerificationResponse)
async def verify_national_id_upload(
    frontImage: UploadFile = File(...),
) -> NationalIdVerificationResponse:
    contents = await frontImage.read()
    data = np.frombuffer(contents, dtype=np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ImageLoadError("Unsupported or unreadable image.")

    service = CccdService()
    result = await service.verify_image(image)

    return _to_response(result)


def _to_response(result) -> NationalIdVerificationResponse:
    return NationalIdVerificationResponse(
        success=result.success,
        confidence=result.confidence,
        extracted=NationalIdExtracted(
            nationalId=result.extracted.national_id,
            fullName=result.extracted.full_name,
            dateOfBirth=result.extracted.date_of_birth,
            sex=result.extracted.sex,
            nationality=result.extracted.nationality,
            homeAddress=result.extracted.home_address,
            address=result.extracted.address,
            issueDate=result.extracted.issue_date,
            expiryDate=result.extracted.expiry_date,
            rawText=result.extracted.raw_text or [],
        ),
        flags=result.flags,
        message=result.message,
    )
