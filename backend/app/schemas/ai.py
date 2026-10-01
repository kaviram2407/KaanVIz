from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator
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


class AIToggleRequest(BaseModel):
    enabled: bool = Field(..., description="Desired AI status (True to enable, False to disable)")


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


import re

FORBIDDEN_HTML_SCRIPT_RE = re.compile(
    r"<\s*/?\s*(script|iframe|style|applet|object|embed|svg|body|html|link|meta)\b|javascript:|onload\s*=|onerror\s*=|onclick\s*=",
    re.IGNORECASE,
)
FORBIDDEN_SQL_RE = re.compile(
    r"\b(SELECT\s+(\*|[a-z0-9_,\s]+)\s+FROM|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|ALTER\s+TABLE|UNION\s+SELECT|EXEC\s*\()\b",
    re.IGNORECASE,
)
FORBIDDEN_CODE_RE = re.compile(
    r"\b(eval\s*\(|exec\s*\(|system\s*\(|process\.exit|__import__|function\s*\()\b",
    re.IGNORECASE,
)

def validate_safe_text(text: str, field_name: str) -> str:
    if not text:
        return text
    if FORBIDDEN_HTML_SCRIPT_RE.search(text):
        raise ValueError(f"Unsafe HTML/Script content detected in AI output field '{field_name}'")
    if FORBIDDEN_SQL_RE.search(text):
        raise ValueError(f"Arbitrary SQL statements detected in AI output field '{field_name}'")
    if FORBIDDEN_CODE_RE.search(text):
        raise ValueError(f"Executable code constructs detected in AI output field '{field_name}'")
    if len(text) > 2000:
        raise ValueError(f"Excessive text length ({len(text)} chars) in AI output field '{field_name}'")
    return text


class AIExplainResponse(BaseModel):
    title: str = Field(..., description="Title of explained visualization")
    summary: str = Field(..., description="Concise grounded summary of what the visual shows")
    observations: List[str] = Field(default_factory=list, description="Bounded list of concise observations (max 5)")
    dimensions_used: List[str] = Field(default_factory=list)
    measures_used: List[str] = Field(default_factory=list)
    aggregations_used: List[str] = Field(default_factory=list)
    what_visual_shows: Optional[str] = Field(None, description="Alias for summary")
    observed_patterns: List[str] = Field(default_factory=list, description="Alias for observations")
    limitations_and_context: List[str] = Field(default_factory=list)
    suggested_improvements: Optional[List[str]] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def validate_and_sync_explanation(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Check title
            title = data.get("title") or "Visualization Explanation"
            if isinstance(title, str):
                validate_safe_text(title, "title")
            data["title"] = title

            # Sync summary <-> what_visual_shows
            s = data.get("summary") or data.get("what_visual_shows") or "Visualization Explanation"
            if isinstance(s, str):
                validate_safe_text(s, "summary")
            data["summary"] = s
            data["what_visual_shows"] = s

            # Sync observations <-> observed_patterns
            obs = data.get("observations") or data.get("observed_patterns") or []
            if isinstance(obs, list):
                if len(obs) > 10:
                    raise ValueError(f"Excessive observation count ({len(obs)}) in AI output")
                validated_obs = []
                for idx, item in enumerate(obs):
                    if isinstance(item, str) and item.strip():
                        validate_safe_text(item, f"observations[{idx}]")
                        validated_obs.append(item.strip())
                validated_obs = validated_obs[:5]
                data["observations"] = validated_obs
                data["observed_patterns"] = validated_obs

        return data


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
