from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, driver_license, vehicle_document, face
from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description="API Service for AI-based document verification and face recognition",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(driver_license.router)
app.include_router(vehicle_document.router)
app.include_router(face.router)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "environment": settings.APP_ENV
    }
