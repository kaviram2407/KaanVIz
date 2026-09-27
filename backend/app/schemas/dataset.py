from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    workspace_id: str
    data_source_id: str
    version_id: str
    name: str
    original_filename: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    status: str
    created_at: datetime


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    data_source_id: Optional[str] = None
    name: str
    status: str
    original_filename: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class DatasetListResponse(BaseModel):
    items: List[DatasetItem]
    total: int


class ColumnProfileItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    dataset_version_id: str
    name: str
    ordinal_position: int
    physical_type: str
    semantic_type: str
    type_source: str
    null_count: int
    null_percentage: float
    distinct_count: int
    is_unique: bool
    stats: Dict[str, Any]


class DatasetProfileSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    dataset_version_id: str
    row_count: int
    column_count: int
    file_size_bytes: int
    duplicate_rows: int
    missing_cells: int
    missing_percentage: float
    quality_score: float
    summary_metadata: Dict[str, Any]
    status: str
    created_at: datetime


class DatasetProfileResponse(BaseModel):
    dataset_id: str
    workspace_id: str
    version_id: str
    dataset_name: str
    summary: DatasetProfileSummary
    columns: List[ColumnProfileItem]
