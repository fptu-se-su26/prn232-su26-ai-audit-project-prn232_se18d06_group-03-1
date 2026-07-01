from app.models.ocr_model import OCRModel

class OCRService:
    def __init__(self):
        self.ocr_model = OCRModel()

    def perform_ocr(self, image_bytes: bytes) -> str:
        # Perform text extraction using OCRModel
        return self.ocr_model.extract_text(image_bytes)
