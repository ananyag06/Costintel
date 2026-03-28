import logging
from enum import Enum
from typing import Optional

from app.models.resource import Resource, ResourceType, ResourceStatus
from app.models.metrics import Metric
from app.schemas.metrics import MetricCreate

logger = logging.getLogger(__name__)


class RiskLevel(str, Enum):
    """Risk assessment levels for cost optimization actions."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskAssessment:
    """Result of a risk assessment."""
    
    def __init__(
        self,
        level: RiskLevel,
        score: float,  # 0.0 - 1.0
        factors: dict[str, float],
        recommendation: str,
        allow_execution: bool = True,
    ):
        self.level = level
        self.score = score
        self.factors = factors
        self.recommendation = recommendation
        self.allow_execution = allow_execution


class RiskAssessor:
    """Assess risk of proposed cost optimization actions."""

    def __init__(self):
        self.log_prefix = "[RiskAssessor]"

    def assess_action(
        self,
        resource: Resource,
        action_type: str,
        estimated_savings: float,
        recent_metrics: Optional[list[Metric]] = None,
    ) -> RiskAssessment:
        """
        Assess the risk of executing a proposed action on a resource.
        
        Args:
            resource: The resource to act upon
            action_type: Type of action (e.g., 'stop_instance', 'scale_down')
            estimated_savings: Estimated cost savings from this action
            recent_metrics: Recent metrics for the resource
        
        Returns:
            RiskAssessment with level, score, and recommendation
        """
        factors = {}
        total_risk = 0.0
        
        # Factor 1: Service Criticality (based on resource type)
        criticality_risk = self._assess_service_criticality(resource)
        factors["service_criticality"] = criticality_risk
        total_risk += criticality_risk * 0.25
        
        # Factor 2: Resource Status
        status_risk = self._assess_resource_status(resource)
        factors["resource_status"] = status_risk
        total_risk += status_risk * 0.15
        
        # Factor 3: Action Type Risk
        action_risk = self._assess_action_risk(action_type)
        factors["action_type"] = action_risk
        total_risk += action_risk * 0.30
        
        # Factor 4: Metrics-based Risk (if available)
        if recent_metrics:
            metrics_risk = self._assess_metrics_risk(recent_metrics)
            factors["metrics"] = metrics_risk
            total_risk += metrics_risk * 0.20
        else:
            total_risk += 0.20  # Assume moderate risk if no metrics
        
        # Factor 5: Savings vs Risk Balance
        # Low savings on high-risk actions are more risky
        balance_risk = self._assess_savings_balance(estimated_savings, total_risk)
        factors["savings_balance"] = balance_risk
        total_risk += balance_risk * 0.10
        
        # Normalize risk score
        risk_score = min(total_risk / 5.0, 1.0)  # Cap at 1.0
        
        # Determine risk level
        risk_level = self._get_risk_level(risk_score)
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            risk_level, action_type, resource, risk_score, factors
        )
        
        # Allow execution unless risk is CRITICAL
        allow_execution = risk_level != RiskLevel.CRITICAL
        
        assessment = RiskAssessment(
            level=risk_level,
            score=risk_score,
            factors=factors,
            recommendation=recommendation,
            allow_execution=allow_execution,
        )
        
        logger.info(
            "%s Action '%s' on %s: risk_level=%s, score=%.2f, allow=%s",
            self.log_prefix,
            action_type,
            resource.name,
            risk_level.value,
            risk_score,
            allow_execution,
        )
        
        return assessment

    def _assess_service_criticality(self, resource: Resource) -> float:
        """
        Assess criticality based on resource type.
        Production resources are more critical than dev/staging.
        """
        # Base risk by resource type
        type_risk = {
            ResourceType.ec2: 0.6,      # EC2 instances are moderately critical
            ResourceType.lambda_fn: 0.4,  # Lambda functions have less impact
            ResourceType.s3: 0.3,        # S3 is generally resilient
        }
        
        base_risk = type_risk.get(resource.type, 0.5)
        
        # Adjust based on resource name patterns (prod/staging/dev heuristics)
        name_lower = resource.name.lower()
        if "prod" in name_lower or "production" in name_lower:
            base_risk *= 1.5  # Increase risk for production resources
        elif "dev" in name_lower or "development" in name_lower:
            base_risk *= 0.5  # Decrease risk for dev resources
        
        return min(base_risk, 1.0)

    def _assess_resource_status(self, resource: Resource) -> float:
        """
        Assess risk based on current resource status.
        Running/active resources are higher risk to modify.
        """
        status_risk = {
            ResourceStatus.running: 0.8,
            ResourceStatus.active: 0.7,
            ResourceStatus.throttled: 0.5,
            ResourceStatus.stopped: 0.2,
        }
        
        return status_risk.get(resource.status, 0.5)

    def _assess_action_risk(self, action_type: str) -> float:
        """
        Assess inherent risk of the action type.
        Some actions are more risky than others.
        """
        action_risk = {
            "stop_instance": 0.9,           # Very risky - complete outage
            "terminate_instance": 1.0,      # Critical - permanent deletion
            "scale_down": 0.7,              # Moderately risky - reduced capacity
            "throttle": 0.6,                # Moderate - performance impact
            "cleanup_storage": 0.3,         # Lower risk - storage is resilient
            "modify_config": 0.5,           # Medium risk - configuration change
        }
        
        # Default to medium-high for unknown actions
        return action_risk.get(action_type, 0.6)

    def _assess_metrics_risk(self, metrics: list[Metric]) -> float:
        """
        Assess risk based on current resource metrics.
        High utilization = higher risk to modify.
        """
        if not metrics:
            return 0.5
        
        avg_cpu = sum(m.cpu_usage for m in metrics) / len(metrics)
        avg_requests = sum(m.requests for m in metrics) / len(metrics)
        avg_memory = sum(m.memory_usage for m in metrics) / len(metrics)
        
        # Calculate utilization-based risk
        cpu_risk = min(avg_cpu / 100.0, 1.0)  # Risk increases with CPU usage
        request_risk = min(avg_requests / 1000.0, 1.0)  # Risk increases with request rate
        memory_risk = min(avg_memory / 100.0, 1.0)
        
        # Weight different metrics
        metrics_risk = (cpu_risk * 0.5) + (request_risk * 0.3) + (memory_risk * 0.2)
        
        return min(metrics_risk, 1.0)

    def _assess_savings_balance(self, estimated_savings: float, base_risk: float) -> float:
        """
        Assess if estimated savings justify the risk.
        Small savings on high-risk actions increase risk score.
        """
        # If savings are very low (< $1/week) and risk is high, this is imbalanced
        if estimated_savings < 1.0 and base_risk > 0.5:
            return 0.8  # High imbalance risk
        elif estimated_savings < 5.0 and base_risk > 0.6:
            return 0.6  # Moderate imbalance
        elif estimated_savings < 10.0 and base_risk > 0.7:
            return 0.4  # Some concern
        
        return 0.2  # Good balance

    def _get_risk_level(self, score: float) -> RiskLevel:
        """Map risk score to risk level."""
        if score < 0.25:
            return RiskLevel.LOW
        elif score < 0.5:
            return RiskLevel.MEDIUM
        elif score < 0.75:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def _generate_recommendation(
        self,
        level: RiskLevel,
        action_type: str,
        resource: Resource,
        score: float,
        factors: dict,
    ) -> str:
        """Generate a human-readable recommendation based on risk assessment."""
        
        if level == RiskLevel.LOW:
            return f"Safe to execute {action_type} on {resource.name}. Risk is minimal."
        
        elif level == RiskLevel.MEDIUM:
            return (
                f"Moderate risk for {action_type} on {resource.name}. "
                f"Consider executing during off-peak hours and monitor metrics post-execution."
            )
        
        elif level == RiskLevel.HIGH:
            return (
                f"High risk for {action_type} on {resource.name}. "
                f"Recommend testing in non-production environment first. "
                f"Review resource dependencies before execution."
            )
        
        else:  # CRITICAL
            return (
                f"Critical risk for {action_type} on {resource.name}. "
                f"Action is not recommended. This resource is production-critical or highly utilized. "
                f"Require manual approval and operational readiness review."
            )
