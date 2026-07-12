from fastapi import FastAPI

from app.api import cccd, driver_license, face, health, image_quality, national_id, vehicle_registration, yolo_vietocr
from app.core.logging import configure_logging


configure_logging()

app = FastAPI(
    title="MoveVN AI Verification Service",
    version="0.1.0",
    description="Internal OCR, image quality, and face matching APIs for MoveVN verification.",
)

app.include_router(health.router)
app.include_router(image_quality.router)
app.include_router(national_id.router)
app.include_router(driver_license.router)
app.include_router(vehicle_registration.router)
app.include_router(yolo_vietocr.router)
app.include_router(face.router)
app.include_router(cccd.router)

