from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class DimensionSpec(BaseModel):
    field: str = Field(..., description="Column name to group by")
    alias: Optional[str] = Field(None, description="Optional display alias for dimension")
    date_granularity: Optional[str] = Field(
        None,
        description="Optional date grouping granularity: 'day', 'month', 'year', 'quarter'"
    )


class MeasureSpec(BaseModel):
    field: str = Field(..., description="Column name to aggregate")
    aggregation: str = Field(
        ...,
        description="Aggregation function: 'count', 'distinct_count', 'sum', 'avg', 'min', 'max'"
    )
    alias: Optional[str] = Field(None, description="Optional display alias for measure")


class SortSpec(BaseModel):
    field: str = Field(..., description="Field name or alias to sort by")
    direction: str = Field("desc", description="Sort direction: 'asc' or 'desc'")


class FilterSpec(BaseModel):
    field: str = Field(..., description="Column name to filter on")
    operator: str = Field(
        "eq",
        description="Operator: 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'is_null', 'is_not_null'"
    )
    value: Optional[Any] = Field(None, description="Filter target value")


class AnalyticsQueryRequest(BaseModel):
    dataset_id: Optional[str] = Field(None, description="Target dataset ID")
    version_id: Optional[str] = Field(None, description="Optional specific dataset version ID")
    model_id: Optional[str] = Field(None, description="Optional target data model ID")
    dimensions: List[DimensionSpec] = Field(default_factory=list)
    measures: List[MeasureSpec] = Field(default_factory=list)
    filters: List[FilterSpec] = Field(default_factory=list)
    sort: Optional[SortSpec] = None
    limit: Optional[int] = Field(100, ge=1, le=1000, description="Server-side result row limit")


class ColumnMetadata(BaseModel):
    name: str
    physical_type: str
    role: str  # 'dimension' or 'measure'
    aggregation: Optional[str] = None


class AnalyticsQueryResponse(BaseModel):
    dataset_id: str
    version_id: str
    row_count: int
    columns: List[ColumnMetadata]
    data: List[Dict[str, Any]]
    execution_time_ms: float


class SimpleMeasure(BaseModel):
    field: str = Field(..., description="Target column name")
    aggregation: str = Field(
        ...,
        description="Aggregation: 'sum', 'avg', 'count', 'distinct_count', 'min', 'max'"
    )
    display_name: Optional[str] = Field(None, description="Display title for the measure")
    format: Optional[str] = Field("number", description="Formatting style: 'number', 'currency', 'percentage'")


class VisualizationSpec(BaseModel):
    chart_type: str = Field(
        ...,
        description="Chart type: 'bar', 'line', 'area', 'pie', 'donut', 'scatter', 'table', 'kpi'"
    )
    title: Optional[str] = Field(None, description="Chart title")
    dimensions: List[DimensionSpec] = Field(default_factory=list)
    measures: List[MeasureSpec] = Field(default_factory=list)
    kpi_measure: Optional[SimpleMeasure] = Field(None, description="Structured simple measure for KPI/Card visual")
    sort: Optional[SortSpec] = None
    limit: Optional[int] = Field(100, ge=1, le=1000)


class VisualizationValidateRequest(BaseModel):
    spec: VisualizationSpec
    dataset_id: Optional[str] = None


class VisualizationValidateResponse(BaseModel):
    is_valid: bool
    issues: List[str]
