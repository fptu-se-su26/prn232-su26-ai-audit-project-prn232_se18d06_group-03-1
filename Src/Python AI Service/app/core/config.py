import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    APP_ENV: str = os.getenv("APP_ENV", "local")
    APP_NAME: str = os.getenv("APP_NAME", "AI Verification Service")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key")


settings = Settings()
