from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

class FaceVerifyRequest(BaseModel):
    image_base64_1: str
    image_base64_2: str

class DocumentScanRequest(BaseModel):
    image_base64: str
    document_type: Optional[str] = None

class PriceSuggestionRequest(BaseModel):
    vehicle_type: Literal["Car", "Motorbike"]
    date: date
    vacant_rate: float = Field(ge=0, le=1)
    base_price: float = Field(gt=0)
