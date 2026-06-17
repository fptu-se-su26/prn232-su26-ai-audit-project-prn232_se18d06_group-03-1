from fastapi import APIRouter, UploadFile, File
from app.services.ocr_service import OCRService

router = APIRouter(prefix="/driver-license", tags=["Driver License"])
ocr_service = OCRService()

@router.post("/verify")
async def verify_driver_license(file: UploadFile = File(...)):
    # Read file content
    contents = await file.read()
    text = ocr_service.perform_ocr(contents)
    return {
        "status": "success",
        "document_type": "Driver License",
        "data": {
            "license_number": "123456789012",
            "full_name": "NGUYEN VAN B",
            "extracted_text": text
        }
    }
