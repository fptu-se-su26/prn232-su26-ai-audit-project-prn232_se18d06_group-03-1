from pydantic import BaseModel, Field

from app.schemas.common import DocumentType, Recommendation, VehicleType


class ImageQualityMetrics(BaseModel):
    blur_score: float | None = Field(default=None, alias="blurScore")
    brightness: float | None = None
    width: int | None = None
    height: int | None = None


class ImageQualityResponse(BaseModel):
    acceptable: bool
    quality_score: float = Field(alias="qualityScore")
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None
    metrics: ImageQualityMetrics


class DriverLicenseExtracted(BaseModel):
    full_name: str | None = Field(default=None, alias="fullName")
    driver_license_number: str | None = Field(default=None, alias="driverLicenseNumber")
    date_of_birth: str | None = Field(default=None, alias="dateOfBirth")
    license_class: str | None = Field(default=None, alias="licenseClass")
    issue_date: str | None = Field(default=None, alias="issueDate")
    expiry_date: str | None = Field(default=None, alias="expiryDate")
    expiry_status: str | None = Field(default=None, alias="expiryStatus")
    raw_text: list[str] = Field(default_factory=list, alias="rawText")


class DriverLicenseDocumentChecks(BaseModel):
    ministry_found: bool = Field(alias="ministryFound")
    national_motto_found: bool = Field(alias="nationalMottoFound")
    driver_license_title_found: bool = Field(alias="driverLicenseTitleFound")
    license_class_found: bool = Field(alias="licenseClassFound")
    license_class_known_in_vietnam: bool = Field(alias="licenseClassKnownInVietnam")


class DriverLicenseNameMatch(BaseModel):
    provided: bool
    matched: bool | None = None
    score: float | None = None
    system_full_name_normalized: str | None = Field(default=None, alias="systemFullNameNormalized")
    ocr_full_name_normalized: str | None = Field(default=None, alias="ocrFullNameNormalized")


class DriverLicenseVerificationResponse(BaseModel):
    valid: bool
    document_type: DocumentType = Field(alias="documentType")
    license_vehicle_type: VehicleType = Field(alias="licenseVehicleType")
    license_class_valid_for_expected_vehicle: bool = Field(alias="licenseClassValidForExpectedVehicle")
    ocr_confidence: float = Field(alias="ocrConfidence")
    extracted: DriverLicenseExtracted
    document_checks: DriverLicenseDocumentChecks = Field(alias="documentChecks")
    name_match: DriverLicenseNameMatch = Field(alias="nameMatch")
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None


class NationalIdExtracted(BaseModel):
    national_id_number: str | None = Field(default=None, alias="nationalIdNumber")
    full_name: str | None = Field(default=None, alias="fullName")
    date_of_birth: str | None = Field(default=None, alias="dateOfBirth")
    sex: str | None = None
    nationality: str | None = None
    place_of_origin: str | None = Field(default=None, alias="placeOfOrigin")
    place_of_residence: str | None = Field(default=None, alias="placeOfResidence")
    expiry_date: str | None = Field(default=None, alias="expiryDate")
    raw_text: list[str] = Field(default_factory=list, alias="rawText")


class NationalIdDocumentChecks(BaseModel):
    national_motto_found: bool = Field(alias="nationalMottoFound")
    national_id_title_found: bool = Field(alias="nationalIdTitleFound")
    chip_card_marker_found: bool = Field(alias="chipCardMarkerFound")
    national_id_number_found: bool = Field(alias="nationalIdNumberFound")
    full_name_found: bool = Field(alias="fullNameFound")
    date_of_birth_found: bool = Field(alias="dateOfBirthFound")


class NationalIdMatchChecks(BaseModel):
    full_name_provided: bool = Field(alias="fullNameProvided")
    full_name_matched: bool | None = Field(default=None, alias="fullNameMatched")
    full_name_score: float | None = Field(default=None, alias="fullNameScore")


class NationalIdVerificationResponse(BaseModel):
    valid: bool
    document_type: DocumentType = Field(alias="documentType")
    ocr_confidence: float = Field(alias="ocrConfidence")
    extracted: NationalIdExtracted
    document_checks: NationalIdDocumentChecks = Field(alias="documentChecks")
    match_checks: NationalIdMatchChecks = Field(alias="matchChecks")
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None


class VehicleRegistrationExtracted(BaseModel):
    license_plate: str | None = Field(default=None, alias="licensePlate")
    owner_name: str | None = Field(default=None, alias="ownerName")
    brand: str | None = None
    model: str | None = None
    engine_number: str | None = Field(default=None, alias="engineNumber")
    chassis_number: str | None = Field(default=None, alias="chassisNumber")
    vehicle_type: VehicleType = Field(default=VehicleType.UNKNOWN, alias="vehicleType")
    raw_text: list[str] = Field(default_factory=list, alias="rawText")


class VehicleRegistrationVerificationResponse(BaseModel):
    valid: bool
    document_type: DocumentType = Field(alias="documentType")
    registration_vehicle_type: VehicleType = Field(alias="registrationVehicleType")
    vehicle_type_matches_expected: bool = Field(alias="vehicleTypeMatchesExpected")
    license_plate_matches_expected: bool | None = Field(default=None, alias="licensePlateMatchesExpected")
    brand_matches_expected: bool | None = Field(default=None, alias="brandMatchesExpected")
    model_matches_expected: bool | None = Field(default=None, alias="modelMatchesExpected")
    ocr_confidence: float = Field(alias="ocrConfidence")
    extracted: VehicleRegistrationExtracted
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None


class FaceEnrollResponse(BaseModel):
    valid: bool
    selfie_quality_score: float = Field(alias="selfieQualityScore")
    cccd_face_detected: bool = Field(alias="cccdFaceDetected")
    selfie_face_detected: bool = Field(alias="selfieFaceDetected")
    match_score: float | None = Field(default=None, alias="matchScore")
    embedding_ref: str | None = Field(default=None, alias="embeddingRef")
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None


class FaceMatchDocumentResponse(BaseModel):
    valid: bool
    document_face_detected: bool = Field(alias="documentFaceDetected")
    match_score: float | None = Field(default=None, alias="matchScore")
    flags: list[str]
    recommendation: Recommendation
    message: str | None = None
