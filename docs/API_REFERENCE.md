# AEROGUARD — API Reference

**Base URLs:**
- Backend API: `http://localhost:5000/api`
- ML Service: `http://127.0.0.1:8000`

---

## Backend REST API (Express)

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "service": "aeroguard-api",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2026-10-03T03:30:00Z"
}
```

---

### Dashboard
```http
GET /api/dashboard
```
**Response:**
```json
{
  "success": true,
  "kpis": {
    "total_stations": 1248,
    "online_stations": 1173,
    "offline_stations": 75,
    "observations_processed": 118983,
    "active_anomalies": 25,
    "critical_alerts": 11,
    "average_trust_score": 95.2,
    "sensors_requiring_attention": 100
  },
  "hourly_trend": [
    { "hour": "00:00", "count": 2 },
    { "hour": "04:00", "count": 3 }
  ],
  "recent_alerts": [
    {
      "id": 50,
      "station_id": "AWS-IND-1084",
      "station_name": "Sambalpur Met-Obs-09",
      "state": "Odisha",
      "anomaly_type": "WEATHER_EVENT",
      "severity": "MEDIUM",
      "confidence": 0.95,
      "trust_score": 87.7,
      "status": "CONFIRMED_WEATHER_EVENT"
    }
  ]
}
```

---

### Network Map
```http
GET /api/network/map
```
Returns all 1,248 stations with coordinates and status for map rendering.

---

### Stations

#### List Stations
```http
GET /api/stations?page=1&limit=25&search=pune&state=Maharashtra&status=ONLINE
```
**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 25) |
| `search` | string | Search by station ID, name, district |
| `state` | string | Filter by state |
| `status` | string | Filter by ONLINE/OFFLINE/WARNING/CRITICAL |

#### Station Detail
```http
GET /api/stations/:id
```

#### Station Observations (Time Series)
```http
GET /api/stations/:id/observations?range=24H
```
**Range options:** `1H`, `6H`, `24H`, `7D`

#### Station Peer Cluster
```http
GET /api/stations/:id/peers
```
Returns nearest k=5 stations within 150km with comparative readings.

---

### Anomalies

#### List Anomalies
```http
GET /api/anomalies?page=1&limit=20&severity=CRITICAL&type=SPIKE&status=ACTIVE
```

#### Anomaly Detail
```http
GET /api/anomalies/:id
```
Returns full evidence package including all 6 pipeline stage results.

#### Human Review
```http
POST /api/anomalies/:id/review
Content-Type: application/json

{
  "decision": "CONFIRM_SENSOR_FAULT",
  "reviewer": "Data Quality Expert",
  "comment": "Confirmed sensor drift — dispatching calibration team."
}
```
**Decision options:** `CONFIRM_SENSOR_FAULT`, `CONFIRM_WEATHER_EVENT`, `DISMISS_FALSE_POSITIVE`, `QUARANTINE`, `ESCALATE`

---

### Sensor Health
```http
GET /api/sensor-health
```
Returns fleet-wide sensor degradation data across all stations.

---

### Maintenance

#### List Work Orders
```http
GET /api/maintenance?status=OPEN&priority=CRITICAL
```

#### Create Work Order
```http
POST /api/maintenance
Content-Type: application/json

{
  "station_id": "AWS-IND-0006",
  "order_type": "SENSOR_REPLACEMENT",
  "priority": "HIGH",
  "assigned_to": "Field Team Alpha",
  "description": "Temperature sensor showing 12% drift over 7 days"
}
```

#### Update/Resolve Work Order
```http
PATCH /api/maintenance/:id
Content-Type: application/json

{
  "status": "RESOLVED",
  "resolution_notes": "Sensor replaced and recalibrated"
}
```

---

### Reports
```http
GET /api/reports?format=pdf&type=all
GET /api/reports?format=xlsx&type=anomalies
GET /api/reports?format=csv&type=stations
```
**Format options:** `pdf`, `xlsx`, `csv`  
**Type options:** `all`, `stations`, `anomalies`, `sensor_health`, `maintenance`

---

### Simulation
```http
POST /api/simulation/inject
Content-Type: application/json

{
  "station_id": "AWS-IND-0001",
  "parameter": "temperature",
  "fault_type": "SPIKE",
  "severity": "CRITICAL",
  "magnitude": 18.5
}
```
**Fault types:** `SPIKE`, `DRIFT`, `BIAS`, `STUCK`, `DROPOUT`, `WEATHER_FRONT`

---

### Audit Logs
```http
GET /api/audit-logs?limit=100
```

---

## ML Service API (FastAPI)

### Health
```http
GET /health
```

### Evaluate Observation
```http
POST /evaluate
Content-Type: application/json

{
  "station_id": "AWS-IND-0001",
  "observation": {
    "temperature": 45.2,
    "relative_humidity": 32.0,
    "pressure_hpa": 1008.5,
    "wind_speed_kmh": 12.0,
    "rainfall_mm": 0.0
  },
  "historical": [...],
  "peers": [...]
}
```
**Response:**
```json
{
  "anomaly_score": 0.87,
  "trust_score": 13,
  "classification": "PROBABLE_SENSOR_FAULT",
  "evidence": {
    "rules": { "score": 0.90, "flags": ["EXCEEDS_MAX_TEMP_THRESHOLD"] },
    "temporal": { "score": 0.92, "rate_of_change": 18.5, "z_score": 4.2 },
    "multivariate": { "score": 0.88, "psychrometric_violation": true },
    "spatial": { "score": 0.94, "coherence_ratio": 0.0, "peer_count": 5 },
    "isolation_forest": { "score": 0.85, "anomaly_label": -1 }
  },
  "operational_guidance": {
    "what": "Temperature spike of +18.5°C detected",
    "why": "Single-station anomaly; all 5 peers report normal; psychrometric inverse coupling violated",
    "confidence": "94.0% multi-signal fusion consensus",
    "action": "QUARANTINE observation from NWP assimilation; dispatch field calibration team"
  }
}
```

### Simulate Fault
```http
POST /simulate
Content-Type: application/json

{
  "station_id": "AWS-IND-0001",
  "parameter": "temperature",
  "fault_type": "SPIKE",
  "severity": "CRITICAL"
}
```

### Swagger UI
```
http://127.0.0.1:8000/docs
```

---

*AEROGUARD — Observe. Validate. Trust. Act.*
