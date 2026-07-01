from pydantic import BaseModel
from typing import Dict, Any, Optional

class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class FaceVerifyResponse(BaseModel):
    match: bool
    confidence: float
