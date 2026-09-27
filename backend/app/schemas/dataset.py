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


# Phase 4 Preparation & Transformation Schemas

class PreparationOperation(BaseModel):
    operation_type: str  # fill_missing, remove_duplicates, convert_type, text_normalization, column_operation, date_transform
    target_column: Optional[str] = None
    target_columns: Optional[List[str]] = None
    params: Dict[str, Any] = {}


class PrepareDatasetRequest(BaseModel):
    source_version_id: Optional[str] = None
    operations: List[PreparationOperation]


class PreparedMetricsSummary(BaseModel):
    before_row_count: int
    after_row_count: int
    before_missing_cells: int
    after_missing_cells: int
    before_quality_score: float
    after_quality_score: float
    operations_applied: int


class PreparedDatasetResponse(BaseModel):
    dataset_id: str
    workspace_id: str
    source_version_id: str
    prepared_version_id: str
    version_number: int
    metrics_comparison: PreparedMetricsSummary
    created_at: datetime


class TransformationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    dataset_id: str
    source_version_id: str
    target_version_id: str
    operation_type: str
    operation_spec: Dict[str, Any]
    execution_status: str
    execution_metadata: Dict[str, Any]
    created_at: datetime


class TransformationHistoryResponse(BaseModel):
    dataset_id: str
    transformations: List[TransformationItem]
    total: int


class ValidateDatasetRequest(BaseModel):
    version_id: Optional[str] = None
    operations: Optional[List[PreparationOperation]] = None


class ValidationIssueItem(BaseModel):
    code: str
    column: Optional[str] = None
    message: str


class ValidateDatasetResponse(BaseModel):
    status: str  # 'valid' or 'invalid'
    issues: List[ValidationIssueItem]

