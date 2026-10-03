"""
AEROGUARD PostgreSQL Data Loader
Connects to PostgreSQL using DATABASE_URL or standard credentials,
executes schema.sql, and batch-loads stations, observations, anomalies,
evidence, sensor health, and maintenance from the generated dataset.
"""

import os
import sys
import json
import sqlite3
import argparse
from datetime import datetime

try:
    import psycopg2
    from psycopg2.extras import execute_batch
except ImportError:
    psycopg2 = None

def load_to_postgres(database_url=None):
    if psycopg2 is None:
        print("[!] psycopg2 not available. Please install psycopg2-binary.")
        return False
        
    db_url = database_url or os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aeroguard")
    print(f"[*] Attempting PostgreSQL connection to: {db_url}")
    
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"[!] PostgreSQL connection failed: {e}")
        return False
        
    # Execute schema
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    cur.execute(schema_sql)
    conn.commit()
    print("[*] PostgreSQL schema applied successfully.")
    
    # Read from SQLite or JSON source
    sqlite_db_path = os.path.join(os.path.dirname(__file__), "aeroguard.db")
    if not os.path.exists(sqlite_db_path):
        print("[!] aeroguard.db not found. Run generate.py first.")
        return False
        
    src_conn = sqlite3.connect(sqlite_db_path)
    src_cur = src_conn.cursor()
    
    # 1. Stations
    print("[*] Migrating stations to PostgreSQL...")
    src_cur.execute("SELECT station_id, station_name, state, district, latitude, longitude, installation_date, station_status, last_seen, sensor_health FROM stations")
    stations = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO stations (station_id, station_name, state, district, latitude, longitude, installation_date, station_status, last_seen, sensor_health)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (station_id) DO UPDATE SET
            station_status = EXCLUDED.station_status,
            last_seen = EXCLUDED.last_seen,
            sensor_health = EXCLUDED.sensor_health
    """, stations, page_size=1000)
    conn.commit()
    
    # 2. Observations
    print("[*] Migrating observations to PostgreSQL...")
    src_cur.execute("SELECT observation_id, station_id, timestamp, temperature, relative_humidity, atmospheric_pressure, quality_status, anomaly_status, trust_score FROM observations")
    observations = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO observations (observation_id, station_id, timestamp, temperature, relative_humidity, atmospheric_pressure, quality_status, anomaly_status, trust_score)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (observation_id) DO NOTHING
    """, observations, page_size=2000)
    conn.commit()
    
    # 3. Anomaly Events
    print("[*] Migrating anomaly events...")
    src_cur.execute("SELECT id, observation_id, station_id, anomaly_type, severity, confidence, trust_score, status, created_at FROM anomaly_events")
    anomalies = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO anomaly_events (id, observation_id, station_id, anomaly_type, severity, confidence, trust_score, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
    """, anomalies, page_size=1000)
    conn.commit()
    
    # 4. Anomaly Evidence
    print("[*] Migrating anomaly evidence...")
    src_cur.execute("SELECT anomaly_id, evidence_type, description, score FROM anomaly_evidence")
    evidence = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO anomaly_evidence (anomaly_id, evidence_type, description, score)
        VALUES (%s, %s, %s, %s)
    """, evidence, page_size=1000)
    conn.commit()
    
    # 5. Sensor Health
    print("[*] Migrating sensor health...")
    src_cur.execute("SELECT station_id, health_score, health_status, fault_count, last_fault, maintenance_priority, updated_at FROM sensor_health")
    sensor_health = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO sensor_health (station_id, health_score, health_status, fault_count, last_fault, maintenance_priority, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (station_id) DO UPDATE SET
            health_score = EXCLUDED.health_score,
            health_status = EXCLUDED.health_status,
            fault_count = EXCLUDED.fault_count,
            maintenance_priority = EXCLUDED.maintenance_priority,
            updated_at = EXCLUDED.updated_at
    """, sensor_health, page_size=1000)
    conn.commit()
    
    # 6. Maintenance
    print("[*] Migrating maintenance tasks...")
    src_cur.execute("SELECT id, station_id, sensor_type, problem, priority, assigned_engineer, status, created_at, resolved_at FROM maintenance")
    maintenance = src_cur.fetchall()
    execute_batch(cur, """
        INSERT INTO maintenance (id, station_id, sensor_type, problem, priority, assigned_engineer, status, created_at, resolved_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            assigned_engineer = EXCLUDED.assigned_engineer,
            resolved_at = EXCLUDED.resolved_at
    """, maintenance, page_size=1000)
    conn.commit()
    
    src_conn.close()
    conn.close()
    print("[OK] PostgreSQL migration completed successfully!")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AEROGUARD PostgreSQL Data Loader")
    parser.add_argument("--db-url", type=str, default=None, help="PostgreSQL connection URL")
    args = parser.parse_args()
    load_to_postgres(args.db_url)
