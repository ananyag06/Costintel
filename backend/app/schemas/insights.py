from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DiagnosticInsightCreate(BaseModel):
    anomaly_id: int
    resource_id: int
    title: str
    explanation: str
    recommendation: str
    impact: str
    generated_by: str = "grok"


class DiagnosticInsightUpdate(BaseModel):
    is_applied: bool
    applied_at: datetime | None = None


class DiagnosticInsightRead(BaseModel):
    id: int
    anomaly_id: int
    resource_id: int
    title: str
    explanation: str
    recommendation: str
    impact: str
    is_applied: bool
    generated_by: str
    generated_at: datetime
    applied_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
