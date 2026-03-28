# Costintel Data Model

## Database Schema

### 1. Resources Table
Represents cloud infrastructure resources being monitored.

```sql
CREATE TABLE resources (
  id INTEGER PRIMARY KEY,
  resource_id VARCHAR(255) UNIQUE,
  resource_name VARCHAR(255),
  resource_type VARCHAR(50),  -- ec2, rds, lambda, s3
  region VARCHAR(100),
  status VARCHAR(50),          -- running, stopped, available
  tags JSONB,                  -- Key-value metadata
  cost_per_hour FLOAT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Relationships**: 1 resource → many metrics, costs, anomalies, actions

---

### 2. Metrics Table
Time-series performance metrics for resources.

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY,
  resource_id INTEGER FOREIGN KEY,
  timestamp TIMESTAMP,
  cpu_usage FLOAT (0-100),
  memory_usage FLOAT (0-100),
  requests INTEGER,
  errors INTEGER,
  storage_used FLOAT (GB),
  network_in FLOAT (MB),
  network_out FLOAT (MB),
  created_at TIMESTAMP
);
```

**Key Indexes**: 
- (resource_id, timestamp) - Fast range queries
- (timestamp) - Time-series queries

**Relationships**: Many metrics → 1 resource

---

### 3. Cost Records Table
Tracks costs by resource and time period.

```sql
CREATE TABLE cost_records (
  id INTEGER PRIMARY KEY,
  resource_id INTEGER FOREIGN KEY,
  cost_amount FLOAT,
  cost_type VARCHAR(50),       -- on-demand, reserved, spot
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  service VARCHAR(100),        -- EC2, RDS, Lambda, S3
  created_at TIMESTAMP
);
```

**Relationships**: Many costs → 1 resource

---

### 4. Anomalies Table (NEW)
Detected cost and performance anomalies.

```sql
CREATE TABLE anomalies (
  id INTEGER PRIMARY KEY,
  resource_id INTEGER FOREIGN KEY,
  timestamp TIMESTAMP,
  anomaly_score FLOAT (0-1),   -- Severity: 0 = normal, 1 = critical
  reason VARCHAR(500),          -- Human-readable description
  anomaly_type VARCHAR(100),   -- usage_spike, cost_spike, performance_degradation
  metadata JSONB,              -- Additional context
  created_at TIMESTAMP
);
```

**Key Indexes**: 
- (resource_id, timestamp) 
- (timestamp) for recent anomalies

**Relationships**: 
- Many anomalies → 1 resource
- 1 anomaly → many insights

---

### 5. Diagnostic Insights Table (NEW - xAI Grok)
AI-generated explanations and recommendations for anomalies.

```sql
CREATE TABLE diagnostic_insights (
  id INTEGER PRIMARY KEY,
  anomaly_id INTEGER FOREIGN KEY,  -- Which anomaly triggered this
  resource_id INTEGER FOREIGN KEY,
  title VARCHAR(255),              -- "EC2 Demand Spike"
  explanation TEXT,                -- AI explanation from Grok
  recommendation TEXT,             -- Suggested action
  impact VARCHAR(100),             -- "-$450/wk" or "+15% performance"
  is_applied BOOLEAN DEFAULT FALSE, -- Action taken?
  generated_by VARCHAR(50),        -- "grok", "rule_engine"
  generated_at TIMESTAMP,
  applied_at TIMESTAMP NULL,
  created_at TIMESTAMP
);
```

**Relationships**: 
- Many insights → 1 anomaly
- Many insights → 1 resource

---

### 6. Actions Table
Optimization actions executed on resources.

```sql
CREATE TABLE actions (
  id INTEGER PRIMARY KEY,
  resource_id INTEGER FOREIGN KEY,
  action_type VARCHAR(50),     -- stop_instance, throttle_lambda, cleanup_storage
  description TEXT,
  status VARCHAR(50),          -- pending, executing, completed, failed
  impact_description TEXT,     -- What changed
  savings_achieved FLOAT,      -- Actual cost savings
  executed_by VARCHAR(100),    -- "system" or username
  executed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

**Relationships**: Many actions → 1 resource

---

## Data Model Relationships

```
┌─────────────┐
│  resources  │◄─────────┐
├─────────────┤          │ (1:many)
│ id          │          │
│ resource_id │          │
│ name        │          │
│ type        │          │
│ region      │          │
│ status      │          │
│ cost/hour   │          │
└─────────────┘          │
       │                 │
       │ (1:many)        │
       ▼                 │
┌─────────────┐    ┌────────────────┐
│   metrics   │    │  cost_records  │
├─────────────┤    ├────────────────┤
│ id          │    │ id             │
│ resource_id ├────┼─ resource_id   │
│ timestamp   │    │ cost_amount    │
│ cpu_usage   │    │ period_start   │
│ memory_usage│    │ period_end     │
│ requests    │    │ service        │
│ errors      │    └────────────────┘
│ storage     │
│ network     │
└─────────────┘

       │
       │ (1:many)
       ▼
┌─────────────┐
│ anomalies   │
├─────────────┤
│ id          │
│ resource_id ├──────────────────┐
│ timestamp   │                  │
│ score       │                  │
│ reason      │                  │
│ type        │                  │
│ metadata    │                  │
└─────────────┘                  │
       │ (1:many)                │
       │                         │
       ▼                         │
┌──────────────────────┐         │
│diagnostic_insights   │         │
├──────────────────────┤         │
│ id                   │         │
│ anomaly_id      ◄────┴─────────┘
│ resource_id     ◄────┐
│ title                │
│ explanation          │
│ recommendation       │
│ impact               │
│ is_applied           │
│ generated_by         │
│ generated_at         │
└──────────────────────┘

       │
       │ (1:many)
       ▼
┌─────────────┐
│   actions   │
├─────────────┤
│ id          │
│ resource_id ├────────────────────┐
│ action_type │                    │
│ description │                    │
│ status      │                    │
│ savings     │                    │
│ executed_at │                    │
└─────────────┘                    │
                                   │
                    (linked via insights)
```

## Query Patterns

### 1. Get Recent Anomalies with Insights
```sql
SELECT 
  a.id, a.anomaly_score, a.reason,
  i.title, i.explanation, i.recommendation, i.impact
FROM anomalies a
LEFT JOIN diagnostic_insights i ON a.id = i.anomaly_id
WHERE a.timestamp > NOW() - INTERVAL '7 days'
  AND a.anomaly_score > 0.7
ORDER BY a.timestamp DESC;
```

### 2. Get Unapplied Insights
```sql
SELECT * FROM diagnostic_insights
WHERE is_applied = FALSE
  AND generated_at > NOW() - INTERVAL '30 days'
ORDER BY generated_at DESC;
```

### 3. Calculate Total Savings
```sql
SELECT 
  resource_id,
  SUM(savings_achieved) as total_savings,
  COUNT(*) as action_count
FROM actions
WHERE status = 'completed'
  AND executed_at > NOW() - INTERVAL '30 days'
GROUP BY resource_id;
```

### 4. Get Cost Trends by Service
```sql
SELECT 
  service,
  DATE_TRUNC('day', period_start) as day,
  SUM(cost_amount) as daily_cost
FROM cost_records
WHERE period_start > NOW() - INTERVAL '90 days'
GROUP BY service, DATE_TRUNC('day', period_start)
ORDER BY day DESC;
```

### 5. Find High-Impact Insights
```sql
SELECT 
  di.id, di.title, di.recommendation, di.impact,
  a.anomaly_score,
  COUNT(*) as insight_count
FROM diagnostic_insights di
JOIN anomalies a ON di.anomaly_id = a.id
WHERE a.anomaly_score > 0.8
GROUP BY di.id
HAVING COUNT(*) > 0
ORDER BY di.generated_at DESC;
```

## Data Flow

```
1. COLLECTION
   AWS API → CloudMetricCollector → Metrics Table
   
2. PROCESSING
   Metrics Table → AnomalyDetector → Anomalies Table
   
3. INSIGHT GENERATION (NEW)
   Anomalies Table → InsightsGenerator (xAI Grok) → Insights Table
   
4. DECISION MAKING
   Anomalies + Insights → DecisionEngine → Risk Assessment
   
5. ACTION EXECUTION
   Decisions → Optimizer → Actions Table → AWS API
   
6. COST TRACKING
   AWS Cost Explorer → Cost Records Table → Analytics
```

## Performance Optimization

### Indexes
```sql
-- Fast anomaly queries
CREATE INDEX idx_anomalies_resource_time 
ON anomalies(resource_id, timestamp DESC);

-- Fast insight queries
CREATE INDEX idx_insights_anomaly 
ON diagnostic_insights(anomaly_id);

CREATE INDEX idx_insights_applied 
ON diagnostic_insights(is_applied, generated_at DESC);

-- Fast metric time-series queries
CREATE INDEX idx_metrics_resource_time 
ON metrics(resource_id, timestamp DESC);

-- Fast cost queries
CREATE INDEX idx_costs_service_period 
ON cost_records(service, period_start DESC);
```

### Partitioning Strategy
For large deployments, consider partitioning by time:
```sql
CREATE TABLE metrics_2024_q1 PARTITION OF metrics
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

## Data Retention

- **Metrics**: Keep 90 days (aggregated beyond 30 days)
- **Costs**: Keep 2 years
- **Anomalies**: Keep 6 months
- **Insights**: Keep 1 year
- **Actions**: Keep indefinitely (audit trail)

## Example Data

### Resource
```json
{
  "id": 42,
  "resource_id": "i-0a1b2c3d4e5f6g7h8",
  "resource_name": "production-api-server-1",
  "resource_type": "ec2",
  "region": "us-east-1",
  "status": "running",
  "tags": {
    "env": "production",
    "team": "backend",
    "cost-center": "engineering"
  },
  "cost_per_hour": 0.0928
}
```

### Anomaly
```json
{
  "id": 156,
  "resource_id": 42,
  "timestamp": "2024-03-28T10:22:00Z",
  "anomaly_score": 0.87,
  "reason": "CPU usage spike to 92% from baseline 15%",
  "anomaly_type": "usage_spike",
  "metadata": {
    "baseline_cpu": 15,
    "current_cpu": 92,
    "increase_percent": 513
  }
}
```

### Insight
```json
{
  "id": 203,
  "anomaly_id": 156,
  "resource_id": 42,
  "title": "Unexpected CPU Spike on Production API",
  "explanation": "The production-api-server-1 experienced a 513% CPU usage increase from 15% to 92% at 10:22 UTC. This coincides with a deployment window and indicates either a configuration issue or memory leak in the new release.",
  "recommendation": "Immediately roll back to previous release v2.3.1 and investigate memory consumption in v2.4.0. Consider implementing CPU throttling limits.",
  "impact": "-$180/week if optimized",
  "is_applied": false,
  "generated_by": "grok",
  "generated_at": "2024-03-28T10:24:15Z",
  "applied_at": null
}
```

## Schema Migration

Initial setup (auto-created):
```
app/main.py → Base.metadata.create_all() → PostgreSQL
```

The system uses SQLAlchemy for ORM-based migrations. All tables are created automatically on first run.

---

This data model supports the complete Costintel workflow from metric collection through AI-powered insights to action execution and cost tracking.
