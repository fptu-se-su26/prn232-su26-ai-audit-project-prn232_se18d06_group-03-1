from typing import Dict, Any, Optional

from pydantic import BaseModel

class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class FaceVerifyResponse(BaseModel):
    match: bool
    confidence: float

class PriceSuggestionResponse(BaseModel):
    suggested_price: int
    formatted_suggested_price: str
    multiplier: float
    applied_rules: list[str]
    is_weekend: bool
    is_holiday: bool
    is_low_vacancy: bool
