-- AEROGUARD Database Schema
-- Compatible with PostgreSQL 12+ and SQLite

CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(64) UNIQUE NOT NULL,
    station_name VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    installation_date TIMESTAMP NOT NULL,
    station_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
    last_seen TIMESTAMP NOT NULL,
    sensor_health DOUBLE PRECISION NOT NULL DEFAULT 100.0
);

CREATE TABLE IF NOT EXISTS observations (
    id SERIAL PRIMARY KEY,
    observation_id VARCHAR(64) UNIQUE NOT NULL,
    station_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    temperature DOUBLE PRECISION,
    relative_humidity DOUBLE PRECISION,
    atmospheric_pressure DOUBLE PRECISION,
    quality_status VARCHAR(32) NOT NULL DEFAULT 'VALID',
    anomaly_status VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    trust_score DOUBLE PRECISION NOT NULL DEFAULT 95.0
);

CREATE TABLE IF NOT EXISTS anomaly_events (
    id SERIAL PRIMARY KEY,
    observation_id VARCHAR(64) NOT NULL,
    station_id VARCHAR(64) NOT NULL,
    anomaly_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    trust_score DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS anomaly_evidence (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER NOT NULL,
    evidence_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    score DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS sensor_health (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(64) UNIQUE NOT NULL,
    health_score DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    health_status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
    fault_count INTEGER NOT NULL DEFAULT 0,
    last_fault TIMESTAMP,
    maintenance_priority VARCHAR(32) NOT NULL DEFAULT 'LOW',
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS maintenance (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(64) NOT NULL,
    sensor_type VARCHAR(64) NOT NULL,
    problem TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL,
    assigned_engineer VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER NOT NULL,
    reviewer VARCHAR(128) NOT NULL,
    decision VARCHAR(64) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Indexes for high-speed queries
CREATE INDEX IF NOT EXISTS idx_stations_station_id ON stations(station_id);
CREATE INDEX IF NOT EXISTS idx_stations_state ON stations(state);
CREATE INDEX IF NOT EXISTS idx_stations_status ON stations(station_status);

CREATE INDEX IF NOT EXISTS idx_obs_station_id ON observations(station_id);
CREATE INDEX IF NOT EXISTS idx_obs_timestamp ON observations(timestamp);
CREATE INDEX IF NOT EXISTS idx_obs_anomaly_status ON observations(anomaly_status);
CREATE INDEX IF NOT EXISTS idx_obs_station_time ON observations(station_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_anom_station_id ON anomaly_events(station_id);
CREATE INDEX IF NOT EXISTS idx_anom_severity ON anomaly_events(severity);
CREATE INDEX IF NOT EXISTS idx_anom_type ON anomaly_events(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anom_status ON anomaly_events(status);
CREATE INDEX IF NOT EXISTS idx_anom_created_at ON anomaly_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_anomaly_id ON anomaly_evidence(anomaly_id);
CREATE INDEX IF NOT EXISTS idx_maint_station_id ON maintenance(station_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance(status);
