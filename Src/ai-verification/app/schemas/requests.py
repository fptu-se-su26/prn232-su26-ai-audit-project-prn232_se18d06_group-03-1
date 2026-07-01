from pydantic import AliasChoices, BaseModel, Field

from app.schemas.common import DocumentType, VehicleType


class ImageQualityRequest(BaseModel):
    image_url: str = Field(alias="imageUrl")
    purpose: DocumentType = DocumentType.UNKNOWN


class DriverLicenseVerificationRequest(BaseModel):
    full_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("fullname", "fullName"),
        serialization_alias="fullname",
    )
    front_image_url: str = Field(alias="frontImageUrl")


class VehicleRegistrationVerificationRequest(BaseModel):
    expected_vehicle_type: VehicleType = Field(alias="expectedVehicleType")
    expected_license_plate: str | None = Field(default=None, alias="expectedLicensePlate")
    expected_brand: str | None = Field(default=None, alias="expectedBrand")
    expected_model: str | None = Field(default=None, alias="expectedModel")
    file_url: str = Field(alias="fileUrl")


class FaceEnrollRequest(BaseModel):
    request_id: int = Field(alias="requestId")
    user_id: int = Field(alias="userId")
    selfie_image_url: str = Field(alias="selfieImageUrl")
    national_id_front_image_url: str = Field(alias="nationalIdFrontImageUrl")


class FaceMatchDocumentRequest(BaseModel):
    request_id: int = Field(alias="requestId")
    user_id: int = Field(alias="userId")
    enrolled_selfie_image_url: str = Field(alias="enrolledSelfieImageUrl")
    document_image_url: str = Field(alias="documentImageUrl")
    document_type: DocumentType = Field(alias="documentType")
