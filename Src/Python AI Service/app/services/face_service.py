from app.models.face_model import FaceModel

class FaceService:
    def __init__(self):
        self.face_model = FaceModel()

    def verify_faces(self, image1_bytes: bytes, image2_bytes: bytes) -> dict:
        confidence = self.face_model.compare_faces(image1_bytes, image2_bytes)
        return {
            "match": confidence > 0.8,
            "confidence": float(confidence)
        }
