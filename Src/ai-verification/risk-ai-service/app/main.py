from fastapi import FastAPI

from app.api import health, risk


app = FastAPI(
    title="MoveVN Booking Risk AI Service",
    version="0.1.0",
    description="Rule-based FastAPI service for booking risk scoring.",
)

app.include_router(health.router)
app.include_router(risk.router)

