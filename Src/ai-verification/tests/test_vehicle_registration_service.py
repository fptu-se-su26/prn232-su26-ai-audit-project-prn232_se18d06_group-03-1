from app.schemas.common import VehicleType
from app.services.vehicle_registration_service import VehicleRegistrationService


def test_two_letter_plate_is_not_assumed_car_without_text_evidence() -> None:
    service = VehicleRegistrationService()

    vehicle_type = service._infer_vehicle_type("", "59AB-12345")

    assert vehicle_type == VehicleType.UNKNOWN


def test_vehicle_type_text_takes_priority_over_ambiguous_plate() -> None:
    service = VehicleRegistrationService()

    vehicle_type = service._infer_vehicle_type("Loai xe: xe may", "59AB-12345")

    assert vehicle_type == VehicleType.MOTORBIKE
