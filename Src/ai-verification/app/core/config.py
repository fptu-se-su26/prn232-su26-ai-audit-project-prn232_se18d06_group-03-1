from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "ai-verification"
    service_version: str = "0.1.0"
    internal_api_key: str = "dev-ai-verification-key"
    request_timeout_seconds: int = 30
    max_image_bytes: int = 10 * 1024 * 1024
    ocr_language: str = "vi"
    ocr_model_name: str = "PP-OCRv6"
    ocr_space_api_key: str | None = None
    ocr_space_api_url: str = "https://api.ocr.space/parse/image"
    ocr_space_language: str = "vnm"
    face_match_pass_threshold: float = 0.75
    face_match_manual_threshold: float = 0.55
    low_ocr_confidence_threshold: float = 0.65
    good_ocr_confidence_threshold: float = 0.80

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
