import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for absolute path resolution
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/oilleak_db"
    FASTAPI_ENV: str = "development"
    API_PORT: int = 8000
    SECRET_KEY: str = "oil_spill_attribution_secret_key_2026"
    
    # Model Weights Path
    WEIGHTS_DIR: Path = BASE_DIR / "backend" / "app" / "models" / "weights"
    DEFAULT_WEIGHTS_FILE: Path = WEIGHTS_DIR / "s1_unet_hardneg_best.pth"

    # Data Path
    DATA_DIR: Path = BASE_DIR / "data"

    # Copernicus Marine Service (CMEMS) credentials
    COPERNICUSMARINE_SERVICE_USERNAME: str = ""
    COPERNICUSMARINE_SERVICE_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
