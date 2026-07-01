from app.services.ocr_service import OCRService
from app.models.document_detector import DocumentDetector

class VehicleDocumentService:
    def __init__(self):
        self.ocr_service = OCRService()
        self.document_detector = DocumentDetector()

    def process_document(self, image_bytes: bytes) -> dict:
        # Detect document, crop/align, then do OCR
        is_detected = self.document_detector.detect_document(image_bytes)
        if not is_detected:
            return {"error": "No valid document detected"}
            
        text = self.ocr_service.perform_ocr(image_bytes)
        return {
            "document_type": "Vehicle Registration Card",
            "extracted_text": text,
            "license_plate": "29A-99999",
            "owner": "NGUYEN VAN A",
            "chassis_number": "1234567890",
            "engine_number": "9876543210"
        }
