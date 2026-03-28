-- Migration: Create diagnostic_insights table for xAI Grok insights

CREATE TABLE IF NOT EXISTS diagnostic_insights (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    impact VARCHAR(64) NOT NULL,
    
    is_applied BOOLEAN NOT NULL DEFAULT FALSE,
    generated_by VARCHAR(32) NOT NULL DEFAULT 'grok',
    
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_anomaly_id (anomaly_id),
    INDEX idx_resource_id (resource_id),
    INDEX idx_generated_at (generated_at),
    INDEX idx_is_applied (is_applied)
);
