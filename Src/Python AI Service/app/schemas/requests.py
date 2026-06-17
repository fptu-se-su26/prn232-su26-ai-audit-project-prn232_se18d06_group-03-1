from pydantic import BaseModel
from typing import Optional

class FaceVerifyRequest(BaseModel):
    image_base64_1: str
    image_base64_2: str

class DocumentScanRequest(BaseModel):
    image_base64: str
    document_type: Optional[str] = None
