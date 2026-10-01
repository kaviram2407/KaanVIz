import time
from collections import defaultdict
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db.session import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In-memory sliding window rate limiter: max 30 AI requests per minute per IP
AI_REQUEST_HISTORY = defaultdict(list)
MAX_AI_REQUESTS_PER_MIN = 30
WINDOW_SECONDS = 60

def check_ai_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    history = [t for t in AI_REQUEST_HISTORY[client_ip] if now - t < WINDOW_SECONDS]
    if len(history) >= MAX_AI_REQUESTS_PER_MIN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {MAX_AI_REQUESTS_PER_MIN} AI requests per minute allowed."
        )
    history.append(now)
    AI_REQUEST_HISTORY[client_ip] = history

from app.schemas.ai import (
    AIAvailabilityResponse,
    AITestConnectionResponse,
    AIToggleRequest,
    NLQuestionRequest,
    NLQuestionResponse,
    AIVisualizeRequest,
    AIVisualizeResponse,
    AIExplainVisualRequest,
    AIExplainResponse,
    AIInsightsRequest,
    AIInsightsResponse,
)
from app.services.ai_analyst_service import AIAnalystService

router = APIRouter(prefix="/ai", tags=["AI Analyst"])


@router.get("/status", response_model=AIAvailabilityResponse)
def get_ai_status(db: Session = Depends(get_db)):
    """
    Returns explicit AI availability status.
    AI features are optional and degrade gracefully when disabled or unconfigured.
    """
    service = AIAnalystService(db=db)
    return service.check_availability()


@router.post("/toggle", response_model=AIAvailabilityResponse)
def toggle_ai_status(
    req: AIToggleRequest,
    db: Session = Depends(get_db)
):
    """
    Allows user to enable or disable AI Analyst functionality via runtime backend configuration.
    Never exposes credentials or modifies database schemas.
    """
    service = AIAnalystService(db=db)
    return service.toggle_ai(enabled=req.enabled)


@router.post("/test-connection", response_model=AITestConnectionResponse)
def test_ai_connection(db: Session = Depends(get_db)):
    """
    Tests connection to the configured AI provider.
    Never exposes API keys or secrets in response.
    """
    service = AIAnalystService(db=db)
    return service.test_connection()


@router.post("/query", response_model=NLQuestionResponse)
def answer_natural_language_question(
    req: NLQuestionRequest,
    db: Session = Depends(get_db),
    _=Depends(check_ai_rate_limit)
):
    """
    Processes a natural language question.
    Converts question to structured query intent, validates intent,
    executes query via Phase 6 analytics engine, and returns bounded results.
    """
    service = AIAnalystService(db=db)
    return service.answer_natural_language_question(
        question=req.question,
        dataset_id=req.dataset_id,
        dashboard_id=req.dashboard_id,
        workspace_id=req.workspace_id or "default"
    )


@router.post("/visualize", response_model=AIVisualizeResponse)
def generate_ai_visualization(
    req: AIVisualizeRequest,
    db: Session = Depends(get_db),
    _=Depends(check_ai_rate_limit)
):
    """
    Converts a natural language request into a validated visualization spec.
    Validates chart type, fields, aggregations, and dataset compatibility.
    """
    service = AIAnalystService(db=db)
    return service.generate_visualization(
        prompt=req.prompt,
        dataset_id=req.dataset_id,
        workspace_id=req.workspace_id or "default"
    )


@router.post("/explain", response_model=AIExplainResponse)
def explain_visualization(
    req: AIExplainVisualRequest,
    db: Session = Depends(get_db),
    _=Depends(check_ai_rate_limit)
):
    """
    Generates a structured explanation for a given visualization specification.
    """
    service = AIAnalystService(db=db)
    return service.explain_visual(
        visual_spec=req.visual_spec,
        dataset_id=req.dataset_id,
        dashboard_id=req.dashboard_id,
        workspace_id=req.workspace_id or "default"
    )


@router.post("/insights", response_model=AIInsightsResponse)
def generate_ai_insights(
    req: AIInsightsRequest,
    db: Session = Depends(get_db),
    _=Depends(check_ai_rate_limit)
):
    """
    Generates structured AI insights grounded in deterministic context.
    """
    service = AIAnalystService(db=db)
    return service.generate_insights(
        dataset_id=req.dataset_id,
        visual_spec=req.visual_spec,
        dashboard_id=req.dashboard_id,
        workspace_id=req.workspace_id or "default"
    )
