import logging
from functools import lru_cache
from typing import Optional

from anthropic import Anthropic, APIError

from app.core.config import get_settings
from app.models.anomalies import Anomaly
from app.models.insights import DiagnosticInsight
from app.models.resource import Resource
from app.models.metrics import Metric
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
settings = get_settings()


class InsightsGenerator:
    """Generate diagnostic insights for anomalies using xAI Grok API."""

    def __init__(self):
        self.client = None
        self.model = settings.grok_model
        self.cache_ttl = settings.insights_cache_ttl
        self.enabled = settings.enable_insights_generation and settings.xai_api_key
        
        if self.enabled:
            try:
                self.client = Anthropic(api_key=settings.xai_api_key)
                logger.info("Grok client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Grok client: {e}")
                self.enabled = False

    def generate_insight(
        self,
        anomaly: Anomaly,
        resource: Resource,
        recent_metrics: Optional[list[Metric]] = None,
    ) -> DiagnosticInsight:
        """
        Generate a diagnostic insight for an anomaly using Grok API.
        Falls back to rule-based explanation if API unavailable.
        """
        try:
            if self.enabled and self.client:
                return self._generate_with_grok(anomaly, resource, recent_metrics)
        except Exception as e:
            logger.warning(f"Grok generation failed, using fallback: {e}")
        
        return self._generate_rule_based(anomaly, resource)

    def _generate_with_grok(
        self,
        anomaly: Anomaly,
        resource: Resource,
        recent_metrics: Optional[list[Metric]] = None,
    ) -> DiagnosticInsight:
        """Use Grok API to generate insights."""
        
        metrics_context = ""
        if recent_metrics:
            metrics_summary = {
                "avg_cpu": sum(m.cpu_usage for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0,
                "avg_memory": sum(m.memory_usage for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0,
                "avg_requests": sum(m.requests for m in recent_metrics) / len(recent_metrics) if recent_metrics else 0,
            }
            metrics_context = f"\nRecent metrics average: CPU={metrics_summary['avg_cpu']:.1f}%, Memory={metrics_summary['avg_memory']:.1f}%, Requests={metrics_summary['avg_requests']:.0f}"

        prompt = f"""Analyze the following AWS resource anomaly and provide a diagnostic insight.

Resource Details:
- Name: {resource.name}
- Type: {resource.type.value}
- Region: {resource.region}
- Status: {resource.status.value}
- Instance Type: {resource.instance_type or 'N/A'}

Anomaly Details:
- Anomaly Score: {anomaly.anomaly_score:.2f}
- Reason: {anomaly.reason}
- Timestamp: {anomaly.timestamp}{metrics_context}

Provide a JSON response with the following structure:
{{
    "title": "Brief anomaly title (max 50 chars)",
    "explanation": "Plain-English explanation of what happened and why (2-3 sentences)",
    "recommendation": "Specific action to fix this issue (1-2 sentences)",
    "impact": "Estimated savings in format like '-$450/week' or '-15% cost'"
}}

Focus on cost optimization and resource efficiency."""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text
        return self._parse_grok_response(response_text, anomaly, resource)

    def _parse_grok_response(
        self,
        response_text: str,
        anomaly: Anomaly,
        resource: Resource,
    ) -> DiagnosticInsight:
        """Parse Grok JSON response and create DiagnosticInsight."""
        import json
        
        try:
            # Extract JSON from response (Grok might include text around JSON)
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            
            if json_start == -1 or json_end == 0:
                logger.warning("No JSON found in Grok response, using fallback")
                return self._generate_rule_based(anomaly, resource)
            
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            insight = DiagnosticInsight(
                anomaly_id=anomaly.id,
                resource_id=resource.id,
                title=data.get("title", "Cost Anomaly Detected")[:255],
                explanation=data.get("explanation", anomaly.reason),
                recommendation=data.get("recommendation", "Review resource configuration"),
                impact=data.get("impact", "-$0"),
                generated_by="grok",
            )
            return insight
        except Exception as e:
            logger.error(f"Failed to parse Grok response: {e}")
            return self._generate_rule_based(anomaly, resource)

    def _generate_rule_based(
        self,
        anomaly: Anomaly,
        resource: Resource,
    ) -> DiagnosticInsight:
        """Generate rule-based insight when API is unavailable."""
        
        title_map = {
            "usage_spike": "Unexpected Usage Spike Detected",
            "cost_spike": "Cost Increase Detected",
            "scaling_issue": "Anomalous Scaling Behavior",
            "memory_leak": "High Memory Utilization",
            "request_spike": "Request Rate Anomaly",
        }
        
        reason_lower = anomaly.reason.lower()
        title = next(
            (title for key, title in title_map.items() if key in reason_lower),
            "Resource Anomaly Detected"
        )
        
        recommendation_map = {
            "usage_spike": "Investigate resource metrics for unusual patterns and consider implementing request throttling or scaling adjustments.",
            "cost_spike": "Review resource configuration and consider downscaling or stopping idle resources.",
            "scaling_issue": "Check auto-scaling policies and adjust scaling bounds to prevent unexpected resource allocation.",
            "memory_leak": "Review application logs for memory leaks and consider restart scheduling.",
            "request_spike": "Implement caching, load balancing, or rate limiting to handle traffic spikes.",
        }
        
        recommendation = next(
            (rec for key, rec in recommendation_map.items() if key in reason_lower),
            "Review resource configuration and implement appropriate remediation."
        )
        
        impact = "-$10" if anomaly.anomaly_score > 0.7 else "-$5"
        
        insight = DiagnosticInsight(
            anomaly_id=anomaly.id,
            resource_id=resource.id,
            title=title,
            explanation=f"{anomaly.reason}. This anomaly was detected based on historical patterns and cost metrics.",
            recommendation=recommendation,
            impact=impact,
            generated_by="rule_based",
        )
        return insight

    @lru_cache(maxsize=128)
    def get_cached_insight(self, anomaly_id: int) -> Optional[DiagnosticInsight]:
        """Retrieve cached insight (placeholder for Redis in production)."""
        # In production, this would query Redis with TTL
        return None
