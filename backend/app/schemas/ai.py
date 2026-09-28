from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.analytics import (
    DimensionSpec,
    MeasureSpec,
    SortSpec,
    FilterSpec,
    SimpleMeasure,
    VisualizationSpec,
    AnalyticsQueryResponse,
)


class AIAvailabilityResponse(BaseModel):
    enabled: bool = Field(..., description="Whether AI features are enabled")
    provider: str = Field(..., description="Configured provider name")
    status: str = Field(
        ...,
        description="Availability status: 'enabled', 'disabled', 'unavailable', 'provider_error'"
    )
    message: Optional[str] = Field(None, description="Detailed status or error message")
    model: Optional[str] = Field(None, description="Active AI model name")
    configured: Optional[bool] = Field(None, description="Whether API key / provider is configured")


class AITestConnectionResponse(BaseModel):
    success: bool = Field(..., description="Whether connection test succeeded")
    provider: str = Field(..., description="Target provider name")
    model: str = Field(..., description="Target model name")
    configured: bool = Field(..., description="Whether provider is configured")
    message: str = Field(..., description="Detailed result or error message")


class AnalyticsQueryIntent(BaseModel):
    intent: str = Field("analytics_query", description="Intent type, e.g. 'analytics_query'")
    dataset_id: Optional[str] = Field(None, description="Target dataset ID")
    dimensions: List[DimensionSpec] = Field(default_factory=list)
    measures: List[MeasureSpec] = Field(default_factory=list)
    filters: List[FilterSpec] = Field(default_factory=list)
    sort: Optional[SortSpec] = None
    limit: Optional[int] = Field(100, ge=1, le=1000)


class AIVisualizationSuggestion(BaseModel):
    chart_type: str = Field(
        ...,
        description="Supported chart type: 'bar', 'line', 'area', 'pie', 'donut', 'scatter', 'table', 'kpi'"
    )
    title: Optional[str] = Field(None, description="Suggested chart title")
    dimensions: List[DimensionSpec] = Field(default_factory=list)
    measures: List[MeasureSpec] = Field(default_factory=list)
    kpi_measure: Optional[SimpleMeasure] = Field(None, description="Structured simple measure for KPI/Card")
    sort: Optional[SortSpec] = None
    limit: Optional[int] = Field(100, ge=1, le=1000)
    explanation: Optional[str] = Field(None, description="Rationale for the suggested visual")


class AIInsight(BaseModel):
    type: str = Field(..., description="Insight category: 'trend', 'outlier', 'summary', 'correlation', 'distribution'")
    title: str = Field(..., description="Insight title")
    summary: str = Field(..., description="Detailed textual summary")
    evidence: List[str] = Field(default_factory=list, description="Grounded quantitative evidence statements")
    related_fields: List[str] = Field(default_factory=list, description="Dataset fields involved")


class AIExplainResponse(BaseModel):
    title: str = Field(..., description="Title of explained visualization")
    what_visual_shows: str = Field(..., description="Summary of what the visual presents")
    dimensions_used: List[str] = Field(default_factory=list)
    measures_used: List[str] = Field(default_factory=list)
    aggregations_used: List[str] = Field(default_factory=list)
    observed_patterns: List[str] = Field(default_factory=list)
    limitations_and_context: List[str] = Field(default_factory=list)
    suggested_improvements: Optional[List[str]] = Field(default_factory=list)


class NLQuestionRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User natural language question")
    dataset_id: Optional[str] = Field(None, description="Optional target dataset ID")
    dashboard_id: Optional[str] = Field(None, description="Optional target dashboard ID")
    workspace_id: Optional[str] = Field("default", description="Workspace ID")


class NLQuestionResponse(BaseModel):
    question: str
    query_intent: AnalyticsQueryIntent
    analytics_result: Optional[AnalyticsQueryResponse] = None
    visual_suggestion: Optional[AIVisualizationSuggestion] = None
    summary_answer: str


class AIVisualizeRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Natural language visualization request")
    dataset_id: str = Field(..., description="Target dataset ID")
    workspace_id: Optional[str] = Field("default", description="Workspace ID")


class AIVisualizeResponse(BaseModel):
    suggestion: AIVisualizationSuggestion
    is_valid: bool
    validation_issues: List[str] = Field(default_factory=list)


class AIExplainVisualRequest(BaseModel):
    visual_spec: VisualizationSpec = Field(..., description="Visualization specification to explain")
    dataset_id: str = Field(..., description="Target dataset ID")
    dashboard_id: Optional[str] = None
    workspace_id: Optional[str] = Field("default")


class AIInsightsRequest(BaseModel):
    dataset_id: str = Field(..., description="Target dataset ID")
    dashboard_id: Optional[str] = None
    workspace_id: Optional[str] = Field("default")


class AIInsightsResponse(BaseModel):
    dataset_id: str
    insights: List[AIInsight]
