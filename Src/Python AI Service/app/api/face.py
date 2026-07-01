from fastapi import APIRouter, UploadFile, File
from app.services.face_service import FaceService

router = APIRouter(prefix="/face", tags=["Face Verification"])
face_service = FaceService()

@router.post("/verify")
async def verify_face(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    contents1 = await file1.read()
    contents2 = await file2.read()
    result = face_service.verify_faces(contents1, contents2)
    return {
        "status": "success",
        "data": result
    }
