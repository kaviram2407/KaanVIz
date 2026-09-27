from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.analytics import VisualizationSpec


class LayoutItem(BaseModel):
    x: int = Field(..., ge=0)
    y: int = Field(..., ge=0)
    w: int = Field(..., ge=1, le=12)
    h: int = Field(..., ge=1, le=12)
    i: Optional[str] = None
    minW: Optional[int] = 2
    minH: Optional[int] = 2


class DashboardItemCreate(BaseModel):
    title: Optional[str] = None
    visualization_spec: VisualizationSpec
    dataset_id: Optional[str] = None
    layout: LayoutItem


class DashboardItemUpdate(BaseModel):
    title: Optional[str] = None
    visualization_spec: Optional[VisualizationSpec] = None
    layout: Optional[LayoutItem] = None


class DashboardItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dashboard_id: str
    title: Optional[str] = None
    visualization_spec: Dict[str, Any]
    dataset_id: Optional[str] = None
    layout: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class DashboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    filters: Dict[str, Any] = Field(default_factory=dict)
    items: List[DashboardItemCreate] = Field(default_factory=list)


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    items: Optional[List[DashboardItemCreate]] = None


class DashboardItemSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    status: str
    items_count: int = 0
    created_at: datetime
    updated_at: datetime


class DashboardDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    status: str
    filters: Dict[str, Any]
    items: List[DashboardItemResponse]
    created_at: datetime
    updated_at: datetime


class DashboardListResponse(BaseModel):
    items: List[DashboardItemSummaryResponse]
    total: int
