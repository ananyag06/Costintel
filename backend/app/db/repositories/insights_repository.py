from datetime import datetime
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.insights import DiagnosticInsight


class InsightsRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, insight: DiagnosticInsight) -> DiagnosticInsight:
        self.db.add(insight)
        self.db.flush()
        self.db.refresh(insight)
        return insight

    def get(self, insight_id: int) -> DiagnosticInsight | None:
        stmt = select(DiagnosticInsight).where(DiagnosticInsight.id == insight_id)
        return self.db.scalar(stmt)

    def get_by_anomaly(self, anomaly_id: int) -> DiagnosticInsight | None:
        stmt = select(DiagnosticInsight).where(DiagnosticInsight.anomaly_id == anomaly_id)
        return self.db.scalar(stmt)

    def list(self, limit: int = 100, skip: int = 0) -> list[DiagnosticInsight]:
        stmt = (
            select(DiagnosticInsight)
            .order_by(desc(DiagnosticInsight.generated_at))
            .limit(limit)
            .offset(skip)
        )
        return list(self.db.scalars(stmt))

    def list_by_resource(self, resource_id: int, limit: int = 50) -> list[DiagnosticInsight]:
        stmt = (
            select(DiagnosticInsight)
            .where(DiagnosticInsight.resource_id == resource_id)
            .order_by(desc(DiagnosticInsight.generated_at))
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def list_unapplied(self, limit: int = 50) -> list[DiagnosticInsight]:
        stmt = (
            select(DiagnosticInsight)
            .where(DiagnosticInsight.is_applied == False)
            .order_by(desc(DiagnosticInsight.generated_at))
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def update(self, insight: DiagnosticInsight) -> DiagnosticInsight:
        self.db.merge(insight)
        self.db.flush()
        self.db.refresh(insight)
        return insight

    def mark_applied(self, insight_id: int) -> DiagnosticInsight | None:
        insight = self.get(insight_id)
        if insight:
            insight.is_applied = True
            insight.applied_at = datetime.utcnow()
            return self.update(insight)
        return None

    def delete(self, insight_id: int) -> bool:
        insight = self.get(insight_id)
        if insight:
            self.db.delete(insight)
            self.db.flush()
            return True
        return False
