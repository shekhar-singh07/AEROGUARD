# AEROGUARD — System Architecture Document

**Problem Statement:** SIH26073 — AI/ML-Based Intelligent Anomaly Detection for Automatic Weather Stations  
**Theme:** Disaster Management | **Category:** Software  
**Version:** 1.0.0 | **Date:** October 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AEROGUARD PLATFORM                               │
│                                                                         │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────────────┐    │
│  │   REACT UI    │    │  EXPRESS API  │    │   FASTAPI ML SERVICE  │    │
│  │  (Port 3000)  │◄──►│  (Port 5000)  │◄──►│     (Port 8000)       │    │
│  │               │    │               │    │                       │    │
│  │ • Dashboard   │    │ • REST Routes │    │ • 6-Stage Pipeline    │    │
│  │ • Network Map │    │ • DB Adapter  │    │ • Evidence Fusion     │    │
│  │ • Stations    │    │ • Report Gen  │    │ • Trust Scoring       │    │
│  │ • Alerts      │    │ • Audit Logs  │    │ • Isolation Forest    │    │
│  │ • Sim Lab     │    │               │    │                       │    │
│  └───────────────┘    └───────┬───────┘    └───────────────────────┘    │
│                               │                                         │
│                    ┌──────────▼──────────┐                              │
│                    │     DATA LAYER      │                              │
│                    │  PostgreSQL / SQLite │                              │
│                    │  (Auto-fallback)     │                              │
│                    └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend — React/TypeScript Client (`client/`)

| Component | Purpose |
|---|---|
| `App.tsx` | Root router, role context, layout shell |
| `Navbar.tsx` | Brand bar, live telemetry indicator, global search, role switcher |
| `Sidebar.tsx` | Navigation console with active alert badge, AI engine footer |
| `Overview.tsx` | National command center: KPI grid, Leaflet map, trust gauge, trend chart, alert feed |
| `NetworkMap.tsx` | Full-screen Leaflet/OSM interactive map with 1,248 station markers, layer controls |
| `Stations.tsx` | Paginated station directory with search, state/status filters |
| `StationDetail.tsx` | Deep station view: multi-parameter time series, peer cluster map, sensor health |
| `Alerts.tsx` | Anomaly investigation queue with severity/type/status filters |
| `AlertInvestigation.tsx` | 3-column AI investigation: 4 operational questions, evidence bars, trust gauge, human-in-the-loop |
| `SensorHealth.tsx` | Fleet-wide sensor degradation tracker |
| `Maintenance.tsx` | Work order management, technician dispatch |
| `SimulationLab.tsx` | Fault injection console: station/parameter/severity config → live ML pipeline |
| `Reports.tsx` | PDF/XLSX/CSV compliance report generation |
| `AuditLogs.tsx` | Chronological system event log |

**Key Libraries:** React 18, React Router v6, Recharts, Leaflet/React-Leaflet, Lucide Icons, Tailwind CSS

### 2.2 Backend — Express/TypeScript API (`server/`)

| Module | Purpose |
|---|---|
| `index.ts` | Express server, CORS, middleware, route mounting |
| `db.ts` | Universal database adapter: PostgreSQL (`pg`) with auto-fallback to SQLite (`better-sqlite3`) |
| `routes/dashboard.ts` | KPI aggregation, hourly trend, recent alerts |
| `routes/stations.ts` | Station CRUD, search, detail, observations, peer cluster |
| `routes/anomalies.ts` | Anomaly listing, detail, human review actions |
| `routes/sensorHealth.ts` | Fleet-wide sensor degradation data |
| `routes/maintenance.ts` | Work order create/update/resolve |
| `routes/reports.ts` | PDF (jsPDF), XLSX (xlsx), CSV report generation |
| `routes/simulation.ts` | Fault injection → ML pipeline proxy |
| `routes/auditLogs.ts` | Chronological event retrieval |

### 2.3 AI/ML Microservice — FastAPI/Python (`ml/`)

| Module | Purpose |
|---|---|
| `app/main.py` | FastAPI endpoints: `/evaluate`, `/simulate`, `/health` |
| `detection/rules.py` | WMO climatological bounds, impossible value checks |
| `detection/temporal.py` | 15-min rate-of-change, rolling Z-score, diurnal baseline deviation |
| `detection/multivariate.py` | Psychrometric T↔RH coupling, hypsometric T↔P, convective squall detection |
| `detection/spatial.py` | Haversine nearest k-peer lookup, spatial coherence ratio |
| `detection/isolation_forest.py` | Scikit-learn IForest with custom NumPy fallback for restricted environments |
| `detection/fusion.py` | Multi-signal weighted evidence fusion → Trust Score (0–100) → Classification |

### 2.4 Data Layer (`data/`)

| File | Purpose |
|---|---|
| `schema.sql` | PostgreSQL DDL: stations, observations, anomalies, sensor_health, maintenance_orders, audit_logs |
| `generate.py` | Synthetic data generator: 1,248 stations, 17 regional groups, controlled fault injection |
| `loader.py` | Bulk data loader for PostgreSQL |

---

## 3. AI/ML Pipeline — 6-Stage Evidence Fusion

```
 ┌─────────────────────┐
 │  RAW OBSERVATION     │  Temperature, Humidity, Pressure, Wind, Rainfall
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 1: RULES QC  │  WMO bounds [-90,60]°C, [0,100]%, [870,1084] hPa
 │  (rules.py)          │  Stuck sensor detection (variance < 0.01 over 4h)
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 2: TEMPORAL   │  Rate-of-change thresholds (>5°C/15min = anomaly)
 │  (temporal.py)       │  Rolling Z-score (|Z| > 3.0)
 │                      │  Diurnal baseline deviation (>4σ from monthly norm)
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 3: MULTI-     │  Psychrometric: temp ↑ must → RH ↓ (inverse coupling)
 │  VARIATE COUPLING    │  Hypsometric: temp-pressure altitude consistency
 │  (multivariate.py)   │  Convective: simultaneous P-drop + RH-spike + T-drop
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 4: SPATIAL    │  Haversine nearest k=5 peers within 150km radius
 │  PEER VALIDATION     │  Spatial coherence ratio = peer_agreement / total_peers
 │  (spatial.py)        │  If SCR > 0.6 → likely genuine weather event
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 5: ISOLATION  │  Unsupervised anomaly detection in latent feature space
 │  FOREST (sklearn)    │  Features: [value, delta, z_score, spatial_deviation]
 │  (isolation_forest.py)│  Contamination: 0.05, n_estimators: 100
 └──────────┬──────────┘
            ▼
 ┌─────────────────────┐
 │  STAGE 6: EVIDENCE   │  Weighted signal fusion:
 │  FUSION ENGINE       │    rules(0.20) + temporal(0.25) + multivariate(0.20)
 │  (fusion.py)         │    + spatial(0.20) + iforest(0.15) = anomaly_score
 │                      │
 │  Trust Score = 100 - (anomaly_score × 100)
 │                      │
 │  Classification:     │
 │    ├─ Trust ≥ 90 → NORMAL (assimilate)
 │    ├─ Trust 39-89 + spatial_coherence → GENUINE_WEATHER_EVENT (validate)
 │    └─ Trust < 39 → PROBABLE_SENSOR_FAULT (quarantine + dispatch)
 └─────────────────────┘
```

---

## 4. Database Schema (ERD)

```
┌──────────────────────┐       ┌──────────────────────┐
│      stations        │       │    observations       │
├──────────────────────┤       ├──────────────────────┤
│ station_id (PK)      │──1:N─►│ id (PK)              │
│ station_name         │       │ station_id (FK)       │
│ state, district      │       │ timestamp             │
│ latitude, longitude  │       │ temperature           │
│ elevation_m          │       │ relative_humidity     │
│ station_status       │       │ pressure_hpa          │
│ sensor_health        │       │ wind_speed_kmh        │
│ trust_score          │       │ wind_direction_deg    │
│ commissioned_date    │       │ rainfall_mm           │
│ regional_group       │       │ solar_radiation_wm2   │
│ last_observation_at  │       │ trust_score           │
└──────────────────────┘       │ anomaly_flag          │
                               └──────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│     anomalies        │       │   sensor_health      │
├──────────────────────┤       ├──────────────────────┤
│ id (PK)              │       │ id (PK)              │
│ station_id (FK)      │       │ station_id (FK)      │
│ anomaly_type         │       │ sensor_type          │
│ severity             │       │ health_pct           │
│ confidence           │       │ drift_rate           │
│ trust_score          │       │ last_calibration     │
│ classification       │       │ status               │
│ evidence_json        │       │ failure_mode         │
│ status               │       └──────────────────────┘
│ reviewed_by          │
│ review_decision      │       ┌──────────────────────┐
│ review_comment       │       │  maintenance_orders  │
│ created_at           │       ├──────────────────────┤
└──────────────────────┘       │ id (PK)              │
                               │ station_id (FK)      │
┌──────────────────────┐       │ order_type           │
│     audit_logs       │       │ priority             │
├──────────────────────┤       │ assigned_to          │
│ id (PK)              │       │ status               │
│ event_type           │       │ description          │
│ station_id           │       │ created_at           │
│ description          │       │ resolved_at          │
│ user_role            │       └──────────────────────┘
│ metadata_json        │
│ created_at           │
└──────────────────────┘
```

---

## 5. API Routes

### Express Backend (Port 5000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | KPIs, hourly trend, recent alerts |
| GET | `/api/network/map` | All station coordinates with status for map |
| GET | `/api/stations` | Paginated station list with search/filter |
| GET | `/api/stations/:id` | Station detail with latest observations |
| GET | `/api/stations/:id/observations` | Time-series observation data |
| GET | `/api/stations/:id/peers` | Geodesic peer cluster |
| GET | `/api/anomalies` | Anomaly queue with filters |
| GET | `/api/anomalies/:id` | Full anomaly investigation payload |
| POST | `/api/anomalies/:id/review` | Human-in-the-loop review action |
| GET | `/api/sensor-health` | Fleet-wide sensor degradation |
| GET | `/api/maintenance` | Maintenance work orders |
| POST | `/api/maintenance` | Create work order |
| PATCH | `/api/maintenance/:id` | Update/resolve work order |
| GET | `/api/reports` | Generate PDF/XLSX/CSV report |
| POST | `/api/simulation/inject` | Fault injection → ML pipeline |
| GET | `/api/audit-logs` | Chronological event log |

### FastAPI ML Service (Port 8000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | ML service health |
| POST | `/evaluate` | Run 6-stage pipeline on observation |
| POST | `/simulate` | Inject synthetic fault and evaluate |
| GET | `/docs` | Swagger/OpenAPI documentation |

---

## 6. Data Flow Diagrams

### 6.1 Real-Time Observation Processing
```
AWS Station → [15-min synoptic cadence] → Data Ingestion
    → Backend API validates → Stores to DB
    → Triggers ML evaluation if anomaly suspected
    → ML returns trust_score + classification + evidence
    → Backend updates anomaly table + sensor health
    → Frontend polls dashboard for live updates
```

### 6.2 Simulation Lab Flow
```
User selects: station + parameter + fault_type + severity
    → Frontend POST /api/simulation/inject
    → Backend proxies to ML POST /simulate
    → ML injects synthetic fault into observation vector
    → ML runs full 6-stage pipeline
    → Returns: anomaly_score, trust_score, classification, evidence
    → Backend creates anomaly record + audit log
    → Frontend displays real-time pipeline results
```

### 6.3 Human-in-the-Loop Review Flow
```
Operator clicks "INVESTIGATE" on alert
    → AlertInvestigation page loads full evidence package
    → Operator reviews: 4 questions, evidence bars, trust gauge
    → Operator selects: CONFIRM_FAULT | DISMISS | QUARANTINE | ESCALATE
    → POST /api/anomalies/:id/review
    → Backend updates anomaly status + creates audit log
    → If CONFIRM_FAULT → auto-creates maintenance work order
```

---

## 7. Resilience & Fallback Strategy

| Component | Primary | Fallback |
|---|---|---|
| Database | PostgreSQL 12+ | SQLite (auto-detected via `db.ts`) |
| Isolation Forest | Scikit-learn C-extensions | Custom NumPy-vectorized implementation |
| Map Tiles | OpenStreetMap CDN | Graceful degradation with dark background |
| ML Service | FastAPI on port 8000 | Backend returns synthetic/cached results |
| Data | PostgreSQL seeded data | Pre-generated `data/aeroguard.db` |

---

## 8. Security & Role-Based Access

| Role | Permissions |
|---|---|
| AWS Network Operator | View dashboard, stations, alerts, map; trigger simulations |
| Maintenance Engineer | All operator permissions + create/resolve work orders |
| Meteorologist / Data Quality Expert | All permissions + human review + quarantine decisions |
| Network Administrator | Full access including audit logs and system configuration |

---

## 9. Deployment Options

### Development (Current)
```bash
node scripts/start_all.js    # Starts all 3 services concurrently
# OR
start.bat                     # Windows batch launcher
```

### Production
```bash
# 1. PostgreSQL with schema
psql -f data/schema.sql

# 2. Generate and load data
python data/generate.py --days 30
python data/loader.py --db-url postgresql://...

# 3. ML service (Gunicorn + Uvicorn workers)
gunicorn ml.app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# 4. Backend (PM2 or systemd)
cd server && npm run build && pm2 start dist/index.js

# 5. Frontend (Nginx static)
cd client && npm run build
# Serve dist/ via Nginx with proxy_pass to :5000
```

---

## 10. Performance Specifications

| Metric | Target |
|---|---|
| Dashboard load time | < 2 seconds |
| ML pipeline evaluation | < 500ms per observation |
| Map rendering (1,248 markers) | < 1 second |
| Report generation (PDF) | < 3 seconds |
| Concurrent API requests | 100+ (Express event loop) |
| Database query response | < 100ms (indexed) |

---

*AEROGUARD — Observe. Validate. Trust. Act.*
