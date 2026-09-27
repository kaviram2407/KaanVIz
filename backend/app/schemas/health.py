from typing import Optional, Dict
from pydantic import BaseModel


class ComponentHealth(BaseModel):
    status: str  # "ok" or "error" or "disabled"
    message: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: str  # "healthy" or "degraded" or "unhealthy"
    version: str
    environment: str
    database: ComponentHealth
    redis: ComponentHealth
    storage: ComponentHealth
    ai: ComponentHealth
