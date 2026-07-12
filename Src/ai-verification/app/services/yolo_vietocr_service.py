from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.schemas.common import DocumentType
from app.services.ocr_service import OcrLine, OcrProcessingError, OcrUnavailableError
from app.services.vietnamese_text import normalize_display_text


class YoloVietOcrUnavailableError(OcrUnavailableError):
    pass


@dataclass(frozen=True)
class FieldDetection:
    label: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int


class YoloVietOcrService:
    _models: dict[str, Any] = {}
    _vietocr_predictor: Any = None

    def read_text(self, image: Any, document_type: DocumentType) -> list[OcrLine]:
        settings = get_settings()
        if not settings.yolo_vietocr_enabled:
            raise YoloVietOcrUnavailableError("YOLOv5 + VietOCR engine is disabled.")

        weights = self._weights_for(document_type)
        model = self._get_yolo_model(str(document_type), weights)
        predictor = self._get_vietocr_predictor()
        detections = self._detect_fields(model, image)
        if not detections:
            return []

        lines: list[OcrLine] = []
        for detection in detections:
            crop = self._crop(image, detection)
            if crop is None:
                continue
            text = self._recognize_crop(predictor, crop)
            if not text:
                continue
            label = self._display_label(detection.label, document_type)
            value = f"{label}: {text}" if label else text
            lines.append(OcrLine(value, round(detection.confidence, 3)))
        return lines

    def _weights_for(self, document_type: DocumentType) -> str:
        settings = get_settings()
        weights = (
            settings.yolo_vietocr_driver_license_weights
            if document_type == DocumentType.DRIVER_LICENSE
            else settings.yolo_vietocr_vehicle_registration_weights
        )
        if not weights:
            raise YoloVietOcrUnavailableError(f"YOLOv5 weights are not configured for {document_type}.")
        path = Path(weights)
        if not path.exists():
            raise YoloVietOcrUnavailableError(f"YOLOv5 weights file not found: {path}")
        return str(path)

    def _get_yolo_model(self, cache_key: str, weights: str) -> Any:
        if cache_key in self._models:
            return self._models[cache_key]
        try:
            import torch
        except ImportError as exc:
            raise YoloVietOcrUnavailableError("PyTorch is not installed. Install torch to enable YOLOv5.") from exc

        try:
            settings = get_settings()
            repo = settings.yolo_vietocr_yolov5_repo
            source = "local" if Path(repo).exists() else "github"
            model = torch.hub.load(repo, "custom", path=weights, source=source, trust_repo=True)
            model.conf = settings.yolo_vietocr_confidence_threshold
        except Exception as exc:
            raise YoloVietOcrUnavailableError(f"YOLOv5 model could not be loaded: {exc}") from exc

        self._models[cache_key] = model
        return model

    def _get_vietocr_predictor(self) -> Any:
        if self._vietocr_predictor is not None:
            return self._vietocr_predictor
        try:
            import torch
            from vietocr.tool.config import Cfg
            from vietocr.tool.predictor import Predictor
        except ImportError as exc:
            raise YoloVietOcrUnavailableError("VietOCR is not installed. Install vietocr to enable this engine.") from exc

        try:
            config = Cfg.load_config_from_name("vgg_transformer")
            config["cnn"]["pretrained"] = False
            config["device"] = "cuda:0" if torch.cuda.is_available() else "cpu"
            self.__class__._vietocr_predictor = Predictor(config)
        except Exception as exc:
            raise YoloVietOcrUnavailableError(f"VietOCR predictor could not be loaded: {exc}") from exc
        return self._vietocr_predictor

    def _detect_fields(self, model: Any, image: Any) -> list[FieldDetection]:
        try:
            import cv2

            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            result = model(rgb_image)
            rows = result.pandas().xyxy[0].to_dict("records")
        except Exception as exc:
            raise OcrProcessingError(f"YOLOv5 failed to detect document fields: {exc}") from exc

        detections: list[FieldDetection] = []
        threshold = get_settings().yolo_vietocr_confidence_threshold
        height, width = image.shape[:2]
        for row in rows:
            confidence = float(row.get("confidence") or 0.0)
            if confidence < threshold:
                continue
            x1 = max(0, min(width - 1, int(row.get("xmin") or 0)))
            y1 = max(0, min(height - 1, int(row.get("ymin") or 0)))
            x2 = max(0, min(width, int(row.get("xmax") or 0)))
            y2 = max(0, min(height, int(row.get("ymax") or 0)))
            if x2 <= x1 or y2 <= y1:
                continue
            detections.append(
                FieldDetection(
                    label=str(row.get("name") or row.get("class") or "").strip().lower(),
                    confidence=confidence,
                    x1=x1,
                    y1=y1,
                    x2=x2,
                    y2=y2,
                )
            )

        return sorted(detections, key=lambda item: (item.y1, item.x1))

    def _crop(self, image: Any, detection: FieldDetection) -> Any | None:
        crop = image[detection.y1 : detection.y2, detection.x1 : detection.x2]
        if crop is None or crop.size == 0:
            return None
        return crop

    def _recognize_crop(self, predictor: Any, crop: Any) -> str | None:
        try:
            import cv2
            from PIL import Image

            rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb_crop)
            text = predictor.predict(image)
        except Exception as exc:
            raise OcrProcessingError(f"VietOCR failed to read a detected field: {exc}") from exc
        return normalize_display_text(str(text)) if text else None

    def _display_label(self, label: str, document_type: DocumentType) -> str | None:
        normalized = label.replace("-", "_").replace(" ", "_").lower()
        common = {
            "name": "Full name",
            "full_name": "Full name",
            "dob": "Date of birth",
            "date_of_birth": "Date of birth",
        }
        driver_license = {
            **common,
            "license_number": "No",
            "driver_license_number": "No",
            "gplx_number": "No",
            "license_class": "Class",
            "class": "Class",
            "issue_date": "Date of issue",
            "expiry_date": "Expiry",
        }
        vehicle_registration = {
            **common,
            "license_plate": "Plate",
            "plate": "Plate",
            "owner_name": "Owner",
            "owner": "Owner",
            "brand": "Brand",
            "model": "Model",
            "engine_number": "Engine",
            "engine": "Engine",
            "chassis_number": "Chassis",
            "chassis": "Chassis",
            "vehicle_type": "Loai xe",
        }
        labels = driver_license if document_type == DocumentType.DRIVER_LICENSE else vehicle_registration
        return labels.get(normalized)
