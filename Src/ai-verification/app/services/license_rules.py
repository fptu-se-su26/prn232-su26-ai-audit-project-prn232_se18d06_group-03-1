import re

from app.schemas.common import VehicleType

MOTORBIKE_LICENSE_CLASSES = {"A", "A1", "A2", "A3", "A4"}
CAR_LICENSE_CLASSES = {
    "B",
    "B1",
    "B2",
    "C",
    "C1",
    "D",
    "D1",
    "D2",
    "E",
    "BE",
    "C1E",
    "CE",
    "D1E",
    "D2E",
    "DE",
    "FB2",
    "FC",
    "FD",
    "FE",
}


def normalize_license_class(value: str | None) -> str | None:
    if not value:
        return None
    normalized = re.sub(r"[^A-Za-z0-9]", "", value).upper()
    return normalized or None


def infer_vehicle_type_from_license_class(value: str | None) -> VehicleType:
    license_class = normalize_license_class(value)
    if license_class in MOTORBIKE_LICENSE_CLASSES:
        return VehicleType.MOTORBIKE
    if license_class in CAR_LICENSE_CLASSES:
        return VehicleType.CAR
    return VehicleType.UNKNOWN


def is_license_class_valid(
    license_class: str | None,
    expected_vehicle_type: VehicleType,
    expected_license_classes: list[str],
) -> bool:
    normalized = normalize_license_class(license_class)
    if not normalized:
        return False

    if expected_license_classes:
        allowed = {normalize_license_class(item) for item in expected_license_classes}
        return normalized in allowed

    if expected_vehicle_type == VehicleType.UNKNOWN:
        return True

    inferred_type = infer_vehicle_type_from_license_class(normalized)
    return inferred_type == expected_vehicle_type
