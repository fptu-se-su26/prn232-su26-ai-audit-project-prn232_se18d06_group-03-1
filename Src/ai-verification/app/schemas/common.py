from enum import StrEnum


class Recommendation(StrEnum):
    PASS = "Pass"
    NEED_MORE_INFO = "NeedMoreInfo"
    MANUAL_REVIEW = "ManualReview"
    REJECT = "Reject"


class VehicleType(StrEnum):
    MOTORBIKE = "Motorbike"
    CAR = "Car"
    UNKNOWN = "Unknown"


class DocumentType(StrEnum):
    DRIVER_LICENSE = "DriverLicense"
    VEHICLE_REGISTRATION = "VehicleRegistration"
    NATIONAL_ID = "NationalId"
    SELFIE = "Selfie"
    UNKNOWN = "Unknown"

