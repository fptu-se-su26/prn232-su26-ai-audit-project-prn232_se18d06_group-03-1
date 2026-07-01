from app.schemas.common import Recommendation, VehicleType
from app.services.vehicle_registration_service import VehicleRegistrationService


def test_two_letter_plate_is_not_assumed_car_without_text_evidence() -> None:
    service = VehicleRegistrationService()

    vehicle_type = service._infer_vehicle_type("", "59AB-12345")

    assert vehicle_type == VehicleType.UNKNOWN


def test_vehicle_type_text_takes_priority_over_ambiguous_plate() -> None:
    service = VehicleRegistrationService()

    vehicle_type = service._infer_vehicle_type("Loai xe: xe may", "59AB-12345")

    assert vehicle_type == VehicleType.MOTORBIKE


def test_base_model_matches_engine_size_model_names() -> None:
    service = VehicleRegistrationService()

    assert service._matches_model("Air Blade", "Air Blade 125") is True
    assert service._matches_model("Air Blade", "Air Blade 150") is True
    assert service._matches_model("Air Blade", "Air Blade 160") is True
    assert service._matches_model("SH", "SH 150") is True
    assert service._matches_model("Vario", "Vario 150") is True
    assert service._matches_model("Vario", "Vario 160") is True


def test_car_model_numbers_are_part_of_model_name() -> None:
    service = VehicleRegistrationService()

    assert service._matches_model("VF 7", "VF7") is True
    assert service._matches_model("VF3", "VF 3") is True
    assert service._matches_model("VF3", "VF7") is False
    assert service._matches_model("CX5", "CX 5") is True


def test_license_plate_match_is_exact_after_normalization() -> None:
    service = VehicleRegistrationService()

    assert service._matches_license_plate("59X1-12345", "59X112345") is True
    assert service._matches_license_plate("59X1-12345", "59X1-54321") is False


def test_clear_model_mismatch_is_rejected() -> None:
    service = VehicleRegistrationService()

    recommendation = service._recommend(["MODEL_MISMATCH_CLEAR"], 0.9)

    assert recommendation == Recommendation.REJECT


def test_blurry_image_passes_when_ocr_is_confident() -> None:
    service = VehicleRegistrationService()

    recommendation = service._recommend(["IMAGE_TOO_BLURRY"], 0.9)

    assert recommendation == Recommendation.PASS


def test_blurry_image_requires_manual_review_when_ocr_is_not_confident() -> None:
    service = VehicleRegistrationService()

    recommendation = service._recommend(["IMAGE_TOO_BLURRY"], 0.7)

    assert recommendation == Recommendation.MANUAL_REVIEW
