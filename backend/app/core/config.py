from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str = "bidsentinel-dev-secret-key-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Seed demo data on boot when the users table is empty.
    AUTO_SEED: bool = True

    DATABASE_URL: str = "sqlite+aiosqlite:///./bidsentinel.db"
    SYNC_DATABASE_URL: str = "sqlite:///./bidsentinel.db"

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    STORAGE_BACKEND: str = "local"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "bidsentinel"

    AI_PROVIDER: Literal["gemini", "claude", "mock"] = "mock"
    GEMINI_API_KEY: str = ""
    CLAUDE_API_KEY: str = ""

    CONNECTOR_MODE: Literal["mock", "live"] = "mock"

    UDYAM_API_URL: str = ""
    GSTN_API_URL: str = ""
    PAN_ITD_API_URL: str = ""
    MCA21_API_URL: str = ""
    EPFO_API_URL: str = ""
    ESIC_API_URL: str = ""
    STARTUP_INDIA_API_URL: str = ""
    NSIC_API_URL: str = ""
    DIGILOCKER_API_URL: str = ""
    DPIIT_MII_API_URL: str = ""
    BIS_API_URL: str = ""
    GEM_BLACKLIST_API_URL: str = ""

    ALLOWED_ORIGINS: str = "*"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def cors_allows_credentials(self) -> bool:
        # Browsers reject `Access-Control-Allow-Origin: *` on credentialed
        # requests, so wildcard CORS has to stay anonymous.
        return "*" not in self.cors_origins

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
