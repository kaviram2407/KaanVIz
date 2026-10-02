from typing import List, Union
from pydantic import Field, AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KaanViz"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, str):
            if not v.strip():
                return []
            if v.startswith("["):
                import json
                try:
                    res = json.loads(v)
                    if isinstance(res, list):
                        return [str(i) for i in res]
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i) for i in v]
        return [str(v)]

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://kaanviz:kaanviz_dev_password@localhost:5432/kaanviz_db"
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: object) -> str:
        if isinstance(v, str):
            val = v.strip()
            if val.startswith("postgres://"):
                return val.replace("postgres://", "postgresql+psycopg2://", 1)
            if val.startswith("postgresql://") and not val.startswith("postgresql+psycopg2://"):
                return val.replace("postgresql://", "postgresql+psycopg2://", 1)
            return val
        return str(v)

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # Local Storage Paths
    STORAGE_BASE_PATH: str = Field(default="./storage")
    STORAGE_RAW_PATH: str = Field(default="./storage/raw")
    STORAGE_PROCESSED_PATH: str = Field(default="./storage/processed")
    STORAGE_METADATA_PATH: str = Field(default="./storage/metadata")
    STORAGE_EXPORTS_PATH: str = Field(default="./storage/exports")

    # AI Configuration (Optional)
    AI_ENABLED: bool = False
    AI_PROVIDER: str = "none"
    AI_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "nvidia/nemotron-3-super-120b-a12b"

    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
