from fastapi import APIRouter
from app.api.v1.endpoints import health, datasets, analytics, dashboards

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(datasets.router, tags=["Datasets"])
api_router.include_router(analytics.router, tags=["Analytics"])
api_router.include_router(dashboards.router, tags=["Dashboards"])
