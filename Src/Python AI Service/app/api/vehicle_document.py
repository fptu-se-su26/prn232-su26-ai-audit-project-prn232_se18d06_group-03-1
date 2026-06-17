from fastapi import APIRouter, UploadFile, File
from app.services.vehicle_document_service import VehicleDocumentService

router = APIRouter(prefix="/vehicle-document", tags=["Vehicle Document"])
vehicle_service = VehicleDocumentService()

@router.post("/verify")
async def verify_vehicle_document(file: UploadFile = File(...)):
    contents = await file.read()
    result = vehicle_service.process_document(contents)
    if "error" in result:
        return {
            "status": "failed",
            "message": result["error"]
        }
    return {
        "status": "success",
        "data": result
    }
