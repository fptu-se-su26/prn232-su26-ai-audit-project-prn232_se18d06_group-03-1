from app.schemas.common import Recommendation
from app.schemas.requests import NationalIdVerificationRequest
from app.services.national_id_service import NationalIdService
from app.services.ocr_service import OcrLine


def test_cccd_front_basic_fields_are_extracted() -> None:
    service = NationalIdService()
    request = NationalIdVerificationRequest(
        fullname="Nguyen Nam Thang",
        frontImageUrl="sample_images/cccd/cccd.png",
    )
    lines = [
        OcrLine("Có giá trị đến:", 0.9),
        OcrLine("Date of expiry", 0.9),
        OcrLine("16/08/2029", 0.9),
        OcrLine("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 0.9),
        OcrLine("Độc lập - Tự do - Hạnh phúc", 0.9),
        OcrLine("CĂN CƯỚC CÔNG DÂN", 0.9),
        OcrLine("Citizen Identity Card", 0.9),
        OcrLine("Số/ No.: 048204004548", 0.9),
        OcrLine("Họ và tên / Full name:", 0.9),
        OcrLine("NGUYỄN NAM THẮNG", 0.9),
        OcrLine("Ngày sinh / Date of birth: 16/08/2004", 0.9),
        OcrLine("Giới tính / Sex: Nam Quốc tịch / Nationality: Việt Nam", 0.9),
        OcrLine("Quê quán / Place of origin:", 0.9),
        OcrLine("Hòa Cường Bắc, Hải Châu, Đà Nẵng", 0.9),
        OcrLine("Nơi thường trú / Place of residence: K72/4 Lê Cơ", 0.9),
        OcrLine("Tổ 20, Hòa Cường Bắc, Hải Châu, Đà Nẵng", 0.9),
    ]

    response = service.build_response_from_lines(request, lines)

    assert response.valid is True
    assert response.recommendation == Recommendation.PASS
    assert response.extracted.national_id_number == "048204004548"
    assert response.extracted.full_name == "NGUYỄN NAM THẮNG"
    assert response.extracted.date_of_birth == "16/08/2004"
    assert response.extracted.sex == "Nam"
    assert response.extracted.place_of_origin == "Hòa Cường Bắc, Hải Châu, Đà Nẵng"
    assert response.extracted.expiry_date == "16/08/2029"
    assert response.match_checks.full_name_matched is True
    assert response.flags == []
