from fastapi import APIRouter

from app.schemas.requests import PriceSuggestionRequest
from app.schemas.responses import PriceSuggestionResponse
from app.services.pricing_service import PricingSuggestionService

router = APIRouter(tags=["Pricing"])
pricing_service = PricingSuggestionService()


@router.post("/suggest-price", response_model=PriceSuggestionResponse)
def suggest_price(request: PriceSuggestionRequest):
    return pricing_service.suggest_price(
        base_price=request.base_price,
        target_date=request.date,
        vacant_rate=request.vacant_rate,
    )
