from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.schemas.ai import (
    AIAvailabilityResponse,
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


@router.post("/query", response_model=NLQuestionResponse)
def answer_natural_language_question(
    req: NLQuestionRequest,
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    """
    Generates structured AI insights grounded in deterministic context.
    """
    service = AIAnalystService(db=db)
    insights = service.generate_insights(
        dataset_id=req.dataset_id,
        dashboard_id=req.dashboard_id,
        workspace_id=req.workspace_id or "default"
    )
    return AIInsightsResponse(
        dataset_id=req.dataset_id,
        insights=insights
    )
