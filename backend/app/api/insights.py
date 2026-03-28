import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.db.repositories import InsightsRepository, AnomalyRepository, ResourceRepository
from app.models.insights import DiagnosticInsight
from app.schemas.insights import DiagnosticInsightRead, DiagnosticInsightUpdate
from app.services.insights_generator import InsightsGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/insights", tags=["insights"])
insights_generator = InsightsGenerator()


@router.get("", response_model=List[DiagnosticInsightRead])
def list_insights(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    List all diagnostic insights with pagination.
    """
    insights_repo = InsightsRepository(db)
    insights = insights_repo.list(limit=limit, skip=skip)
    return insights


@router.get("/by-resource/{resource_id}", response_model=List[DiagnosticInsightRead])
def list_insights_by_resource(
    resource_id: int,
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    List diagnostic insights for a specific resource.
    """
    insights_repo = InsightsRepository(db)
    resource_repo = ResourceRepository(db)
    
    resource = resource_repo.get(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    insights = insights_repo.list_by_resource(resource_id, limit=limit)
    return insights


@router.get("/unapplied", response_model=List[DiagnosticInsightRead])
def list_unapplied_insights(
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    List all unapplied diagnostic insights (recommended actions not yet taken).
    """
    insights_repo = InsightsRepository(db)
    insights = insights_repo.list_unapplied(limit=limit)
    return insights


@router.get("/{insight_id}", response_model=DiagnosticInsightRead)
def get_insight(
    insight_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific diagnostic insight by ID.
    """
    insights_repo = InsightsRepository(db)
    insight = insights_repo.get(insight_id)
    
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    return insight


@router.post("/generate/{anomaly_id}", response_model=DiagnosticInsightRead)
def generate_insight_for_anomaly(
    anomaly_id: int,
    db: Session = Depends(get_db),
):
    """
    Generate a diagnostic insight for a specific anomaly using Grok AI.
    If insight already exists, return it. Otherwise, generate and save new insight.
    """
    insights_repo = InsightsRepository(db)
    anomaly_repo = AnomalyRepository(db)
    resource_repo = ResourceRepository(db)
    
    # Check if insight already exists
    existing_insight = insights_repo.get_by_anomaly(anomaly_id)
    if existing_insight:
        return existing_insight
    
    # Fetch anomaly and resource
    anomaly = anomaly_repo.get_by_id(anomaly_id)
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    
    resource = resource_repo.get(anomaly.resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    try:
        # Generate insight using Grok
        insight = insights_generator.generate_insight(anomaly, resource)
        
        # Save to database
        saved_insight = insights_repo.create(insight)
        logger.info(f"Generated insight for anomaly {anomaly_id}: {saved_insight.title}")
        
        return saved_insight
    except Exception as e:
        logger.error(f"Failed to generate insight for anomaly {anomaly_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insight: {str(e)}")


@router.patch("/{insight_id}/apply", response_model=DiagnosticInsightRead)
def mark_insight_applied(
    insight_id: int,
    db: Session = Depends(get_db),
):
    """
    Mark a diagnostic insight as applied (action taken).
    """
    insights_repo = InsightsRepository(db)
    
    insight = insights_repo.mark_applied(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    db.commit()
    db.refresh(insight)
    
    logger.info(f"Marked insight {insight_id} as applied")
    return insight


@router.delete("/{insight_id}")
def delete_insight(
    insight_id: int,
    db: Session = Depends(get_db),
):
    """
    Delete a diagnostic insight.
    """
    insights_repo = InsightsRepository(db)
    
    success = insights_repo.delete(insight_id)
    if not success:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    db.commit()
    logger.info(f"Deleted insight {insight_id}")
    
    return {"status": "deleted", "insight_id": insight_id}
