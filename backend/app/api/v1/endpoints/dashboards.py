import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardItemCreate,
    DashboardItemResponse,
    DashboardItemSummaryResponse,
    DashboardDetailsResponse,
    DashboardListResponse,
)
from app.services.dashboard_service import DashboardService
from app.services.ingestion_service import DEFAULT_WORKSPACE_ID

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def format_dashboard_details(dashboard) -> DashboardDetailsResponse:
    items_res = [
        DashboardItemResponse(
            id=item.id,
            dashboard_id=item.dashboard_id,
            title=item.title,
            visualization_spec=item.visualization_spec,
            dataset_id=item.dataset_id,
            layout=item.layout,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
        for item in (dashboard.items or [])
    ]

    return DashboardDetailsResponse(
        id=dashboard.id,
        workspace_id=dashboard.workspace_id,
        name=dashboard.name,
        description=dashboard.description,
        status=dashboard.status,
        filters=dashboard.filters or {},
        items=items_res,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at
    )


def format_dashboard_summary(dashboard) -> DashboardItemSummaryResponse:
    return DashboardItemSummaryResponse(
        id=dashboard.id,
        workspace_id=dashboard.workspace_id,
        name=dashboard.name,
        description=dashboard.description,
        status=dashboard.status,
        items_count=len(dashboard.items or []),
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at
    )


@router.post(
    "/workspaces/{workspace_id}/dashboards",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Dashboard"
)
def create_dashboard(
    workspace_id: str,
    request: DashboardCreate,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        dashboard = service.create_dashboard(workspace_id=workspace_id, data=request)
        return format_dashboard_details(dashboard)
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_DATA", "message": str(ve)}}
        )
    except Exception as e:
        logger.error(f"Failed to create dashboard: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "DASHBOARD_ERROR", "message": "Failed to create dashboard."}}
        )


@router.post(
    "/dashboards",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Dashboard (Default Workspace)"
)
def create_dashboard_default(
    request: DashboardCreate,
    db: Session = Depends(get_db)
):
    return create_dashboard(workspace_id=DEFAULT_WORKSPACE_ID, request=request, db=db)


@router.get(
    "/workspaces/{workspace_id}/dashboards",
    response_model=DashboardListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Dashboards"
)
def list_dashboards(
    workspace_id: str,
    db: Session = Depends(get_db)
):
    service = DashboardService(db)
    dashboards = service.list_dashboards(workspace_id=workspace_id)
    items = [format_dashboard_summary(d) for d in dashboards]
    return DashboardListResponse(items=items, total=len(items))


@router.get(
    "/dashboards",
    response_model=DashboardListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Dashboards (Default Workspace)"
)
def list_dashboards_default(db: Session = Depends(get_db)):
    return list_dashboards(workspace_id=DEFAULT_WORKSPACE_ID, db=db)


@router.get(
    "/workspaces/{workspace_id}/dashboards/{dashboard_id}",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Details"
)
def get_dashboard(
    workspace_id: str,
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        dashboard = service.get_dashboard(dashboard_id=dashboard_id, workspace_id=workspace_id)
        return format_dashboard_details(dashboard)
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )


@router.get(
    "/dashboards/{dashboard_id}",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Dashboard Details (Default Workspace)"
)
def get_dashboard_default(
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    return get_dashboard(workspace_id=DEFAULT_WORKSPACE_ID, dashboard_id=dashboard_id, db=db)


@router.put(
    "/workspaces/{workspace_id}/dashboards/{dashboard_id}",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Dashboard"
)
def update_dashboard(
    workspace_id: str,
    dashboard_id: str,
    request: DashboardUpdate,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        dashboard = service.update_dashboard(dashboard_id=dashboard_id, workspace_id=workspace_id, data=request)
        return format_dashboard_details(dashboard)
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_DATA", "message": str(ve)}}
        )


@router.put(
    "/dashboards/{dashboard_id}",
    response_model=DashboardDetailsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Dashboard (Default Workspace)"
)
def update_dashboard_default(
    dashboard_id: str,
    request: DashboardUpdate,
    db: Session = Depends(get_db)
):
    return update_dashboard(workspace_id=DEFAULT_WORKSPACE_ID, dashboard_id=dashboard_id, request=request, db=db)


@router.delete(
    "/workspaces/{workspace_id}/dashboards/{dashboard_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Dashboard"
)
def delete_dashboard(
    workspace_id: str,
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        service.delete_dashboard(dashboard_id=dashboard_id, workspace_id=workspace_id)
        return {"status": "success", "message": f"Dashboard '{dashboard_id}' deleted."}
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )


@router.delete(
    "/dashboards/{dashboard_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Dashboard (Default Workspace)"
)
def delete_dashboard_default(
    dashboard_id: str,
    db: Session = Depends(get_db)
):
    return delete_dashboard(workspace_id=DEFAULT_WORKSPACE_ID, dashboard_id=dashboard_id, db=db)


@router.post(
    "/workspaces/{workspace_id}/dashboards/{dashboard_id}/items",
    response_model=DashboardItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Item to Dashboard"
)
def add_dashboard_item(
    workspace_id: str,
    dashboard_id: str,
    request: DashboardItemCreate,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        item = service.add_item_to_dashboard(dashboard_id=dashboard_id, workspace_id=workspace_id, item_data=request)
        return DashboardItemResponse(
            id=item.id,
            dashboard_id=item.dashboard_id,
            title=item.title,
            visualization_spec=item.visualization_spec,
            dataset_id=item.dataset_id,
            layout=item.layout,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )


@router.delete(
    "/workspaces/{workspace_id}/dashboards/{dashboard_id}/items/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove Item from Dashboard"
)
def delete_dashboard_item(
    workspace_id: str,
    dashboard_id: str,
    item_id: str,
    db: Session = Depends(get_db)
):
    try:
        service = DashboardService(db)
        service.delete_dashboard_item(dashboard_id=dashboard_id, item_id=item_id, workspace_id=workspace_id)
        return {"status": "success", "message": f"Dashboard item '{item_id}' deleted."}
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "NOT_FOUND", "message": str(ke)}}
        )
