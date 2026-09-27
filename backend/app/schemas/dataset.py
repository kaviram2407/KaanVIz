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


# Phase 5 Data Modeling & Relationship Schemas

class ModelDatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    model_id: str
    dataset_id: str
    dataset_version_id: str
    alias: Optional[str] = None
    created_at: datetime


class RelationshipItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    model_id: str
    source_dataset_id: str
    source_dataset_version_id: str
    source_field: str
    target_dataset_id: str
    target_dataset_version_id: str
    target_field: str
    cardinality: str
    relationship_type: str
    status: str
    created_at: datetime
    updated_at: datetime


class DataModelItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    status: str
    datasets_count: int = 0
    relationships_count: int = 0
    created_at: datetime
    updated_at: datetime


class DataModelDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    status: str
    datasets: List[ModelDatasetItem]
    relationships: List[RelationshipItem]
    created_at: datetime
    updated_at: datetime


class BindDatasetToModelRequest(BaseModel):
    dataset_id: str
    dataset_version_id: Optional[str] = None
    alias: Optional[str] = None


class CreateRelationshipRequest(BaseModel):
    source_dataset_id: str
    source_field: str
    target_dataset_id: str
    target_field: str
    cardinality: str = "one_to_many"  # one_to_one, one_to_many, many_to_one, many_to_many
    source_version_id: Optional[str] = None
    target_version_id: Optional[str] = None


class ValidateRelationshipRequest(BaseModel):
    source_dataset_id: str
    source_field: str
    target_dataset_id: str
    target_field: str
    cardinality: str = "one_to_many"
    source_version_id: Optional[str] = None
    target_version_id: Optional[str] = None


class ValidateRelationshipResponse(BaseModel):
    is_valid: bool
    issues: List[str]


# Phase 4 Data Preview & Preparation Dry-Run Preview Schemas

class ColumnHeaderItem(BaseModel):
    name: str
    physical_type: str


class DatasetSampleResponse(BaseModel):
    dataset_id: str
    version_id: str
    total_rows: int
    limit: int
    columns: List[ColumnHeaderItem]
    rows: List[Dict[str, Any]]


class CellChangeItem(BaseModel):
    row_index: int
    column: str
    before_value: str
    after_value: str


class PreviewPreparationResponse(BaseModel):
    dataset_id: str
    source_version_id: str
    total_rows_before: int
    total_rows_after: int
    preview_limit: int
    changed_cells_count: int
    changed_rows_count: int
    columns_before: List[ColumnHeaderItem]
    columns_after: List[ColumnHeaderItem]
    rows_before: List[Dict[str, Any]]
    rows_after: List[Dict[str, Any]]
    cell_changes: List[CellChangeItem]


