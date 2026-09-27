import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.analytics import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    VisualizationValidateRequest,
    VisualizationValidateResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.ingestion_service import DEFAULT_WORKSPACE_ID

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/workspaces/{workspace_id}/analytics/query",
    response_model=AnalyticsQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Analytics Aggregation Query"
)
def execute_analytics_query(
    workspace_id: str,
    request: AnalyticsQueryRequest,
    db: Session = Depends(get_db)
):
    try:
        service = AnalyticsService(db)
        return service.execute_query(request=request, workspace_id=workspace_id)
    except KeyError as ke:
        logger.warning(f"Analytics query resource not found: {ke}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )
    except ValueError as ve:
        logger.warning(f"Analytics query validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_QUERY", "message": str(ve)}}
        )
    except Exception as e:
        logger.error(f"Unexpected analytics query failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "ANALYTICS_ERROR", "message": "Failed to execute analytics query."}}
        )


@router.post(
    "/analytics/query",
    response_model=AnalyticsQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Analytics Aggregation Query (Default Workspace)"
)
def execute_analytics_query_default(
    request: AnalyticsQueryRequest,
    db: Session = Depends(get_db)
):
    return execute_analytics_query(workspace_id=DEFAULT_WORKSPACE_ID, request=request, db=db)


@router.post(
    "/workspaces/{workspace_id}/analytics/visualize/validate",
    response_model=VisualizationValidateResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Visualization Specification"
)
def validate_visualization_specification(
    workspace_id: str,
    request: VisualizationValidateRequest,
    db: Session = Depends(get_db)
):
    try:
        service = AnalyticsService(db)
        return service.validate_visualization_spec(spec=request.spec, dataset_id=request.dataset_id)
    except Exception as e:
        logger.error(f"Visualization validation failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "Failed to validate visualization spec."}}
        )


@router.post(
    "/analytics/visualize/validate",
    response_model=VisualizationValidateResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Visualization Specification (Default Workspace)"
)
def validate_visualization_specification_default(
    request: VisualizationValidateRequest,
    db: Session = Depends(get_db)
):
    return validate_visualization_specification(workspace_id=DEFAULT_WORKSPACE_ID, request=request, db=db)
