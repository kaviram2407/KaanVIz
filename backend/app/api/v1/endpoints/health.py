import os
import logging
from fastapi import APIRouter
from sqlalchemy import text
import redis

from app.core.config import settings
from app.db.session import engine
from app.schemas.health import HealthCheckResponse, ComponentHealth

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    """Verify application health and component status."""
    
    # 1. Check PostgreSQL
    db_health = ComponentHealth(status="ok", message="PostgreSQL connectivity verified")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_health = ComponentHealth(status="error", message=f"Database connection failed: {str(e)}")

    # 2. Check Redis
    redis_health = ComponentHealth(status="ok", message="Redis connectivity verified")
    try:
        r = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        redis_health = ComponentHealth(status="error", message=f"Redis connection failed: {str(e)}")

    # 3. Check Storage Directory Access
    storage_health = ComponentHealth(status="ok", message="Storage paths accessible")
    try:
        for path in [
            settings.STORAGE_RAW_PATH,
            settings.STORAGE_PROCESSED_PATH,
            settings.STORAGE_METADATA_PATH,
            settings.STORAGE_EXPORTS_PATH,
        ]:
            if not os.path.exists(path):
                os.makedirs(path, exist_ok=True)
    except Exception as e:
        logger.error(f"Storage path verification failed: {e}")
        storage_health = ComponentHealth(status="error", message=f"Storage path check failed: {str(e)}")

    # 4. Check AI Status
    if settings.AI_ENABLED:
        ai_health = ComponentHealth(status="ok", message=f"AI enabled with provider: {settings.AI_PROVIDER}")
    else:
        ai_health = ComponentHealth(status="disabled", message="AI is optional and currently disabled")

    # Overall system status
    overall_status = "healthy"
    if db_health.status == "error" or redis_health.status == "error" or storage_health.status == "error":
        overall_status = "degraded"

    return HealthCheckResponse(
        status=overall_status,
        version="0.1.0",
        environment=settings.APP_ENV,
        database=db_health,
        redis=redis_health,
        storage=storage_health,
        ai=ai_health,
    )
