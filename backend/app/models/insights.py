from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class DiagnosticInsight(Base):
    __tablename__ = "diagnostic_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    anomaly_id: Mapped[int] = mapped_column(ForeignKey("anomalies.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)
    impact: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g., "-$450/week"
    
    is_applied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    generated_by: Mapped[str] = mapped_column(String(32), default="grok", nullable=False)  # "grok" or "rule_based"
    
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    anomaly = relationship("Anomaly", foreign_keys=[anomaly_id])
    resource = relationship("Resource", foreign_keys=[resource_id])
