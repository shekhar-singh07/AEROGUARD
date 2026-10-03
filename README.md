# AEROGUARD

### AI-Powered AWS Observation Quality & Sensor Intelligence Platform
**Smart India Hackathon 2026** &bull; **Problem Statement ID:** SIH26073  
**Theme:** Disaster Management &bull; **Category:** Software  

> **Tagline:** Turning raw AWS observations into trusted, explainable and actionable weather intelligence.  
> **Final Product Message:** AEROGUARD — Observe. Validate. Trust. Act.

---

## 1. Executive Summary & Problem Context

Meteorological observation networks like India's Automatic Weather Station (AWS) grid provide critical synoptic input for disaster early warning (cyclones, heatwaves, cloudbursts, severe thunderstorms). However, raw AWS observations frequently suffer from sensor failure modes:
- **Instantaneous spikes** (electromagnetic interference, analog-to-digital converter errors)
- **Continuous sensor drift** (sensor contamination, calibration decay)
- **Calibration bias** (pressure transducer offset)
- **Stuck sensors** (frozen mechanical transducers, software deadlocks)
- **Telemetry dropouts / missing values** (solar power drops, RF transmission packet loss)

A catastrophic failure in existing rule-based thresholds is the inability to distinguish an **isolated sensor fault** from a **genuine, severe regional weather event** (e.g., a coastal cyclonic gust front causing a simultaneous 7°C drop, 95% humidity surge, and 4 hPa barometric collapse across 25 neighboring stations). 

**AEROGUARD** solves this with a **Multi-Signal Evidence Fusion & Decision Engine** combining Rule-based QC, Temporal Dynamics, Psychrometric Multivariate Analysis, Geodesic Spatial Validation across peer networks, and Unsupervised Isolation Forest, outputting an explainable **0–100 Observation Trust Score**.

---

## 2. Core Operational Pipeline

```text
               AWS STATIONS (1,248 Stations Across India)
                                   ↓
                            DATA INGESTION
                                   ↓
                         RULE-BASED QUALITY CONTROL
       (WMO climatological bounds, impossible ranges, stuck sensor checks)
                                   ↓
                            TEMPORAL DYNAMICS
        (15-min rate of change, rolling Z-score, diurnal baseline deviation)
                                   ↓
                          MULTIVARIATE COUPLING
         (Psychrometric T vs RH, Hypsometric T vs P, Convective squall)
                                   ↓
                         SPATIAL PEER VALIDATION
             (Haversine nearest k-peers, spatial coherence ratio)
                                   ↓
                        UNSUPERVISED ISOLATION FOREST
                 (Latent feature tree subspace partition anomaly)
                                   ↓
                         EVIDENCE FUSION ENGINE
                                   ↓
                  DECISION ENGINE & TRUST SCORING (0–100)
    ┌──────────────────────────────┬──────────────────────────────┐
    ↓                              ↓                              ↓
[NORMAL]                 [GENUINE WEATHER EVENT]        [PROBABLE SENSOR FAULT]
(Trust 90-100)               (Trust 80-95)                   (Trust 0-38)
Direct Assimilation      Validate Radar Track            Quarantine & Dispatch
```

The system answers four operational questions for every observation:
1. **WHAT happened?**
2. **WHY did it happen?**
3. **HOW confident is the system?**
4. **WHAT should the operator do?**

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Leaflet, React-Leaflet, OpenStreetMap, Lucide React.
- **Backend:** Node.js, Express, TypeScript, REST APIs, PostgreSQL client (`pg`), embedded resilient SQLite fallback (`sqlite3`), `jspdf`, `jspdf-autotable`, `xlsx`.
- **AI/ML Service:** Python 3.11, FastAPI, Uvicorn, NumPy, Scikit-learn (Isolation Forest), Pandas, Scipy.
- **Database:** PostgreSQL 12+ (with zero-configuration resilient embedded fallback to `data/aeroguard.db`).

---

## 4. Large Realistic Dataset Architecture

AEROGUARD is pre-configured with a large, mathematically consistent Indian AWS network:
- **1,248 AWS Stations** distributed across 17 state/regional groups (North, South, East, West, Central, and Northeast India) with realistic geographic coordinates.
- **Operational Availability:** 1,173 Online (94.0%), 75 Offline (6.0%).
- **Observation Cadence:** 15-minute standard synoptic cadence producing **118,983 observations** in active memory.
- **Controlled Fault Injections:** Pre-seeded spikes, drift, bias, stuck transducers, dropouts, and a **25-station Genuine Regional Weather Front** along the Odisha/Andhra coast demonstrating spatial coherence differentiation.

---

## 5. Quick Start & Execution

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Single-Command Start (Windows)
Double-click `start.bat` or run:
```bash
node scripts/start_all.js
```
This concurrently starts:
1. **ML Service:** `http://127.0.0.1:8000` (FastAPI Swagger: `http://127.0.0.1:8000/docs`)
2. **Backend API:** `http://localhost:5000` (Health: `http://localhost:5000/api/health`)
3. **Operational UI:** `http://localhost:3000`

---

## 6. Manual Setup & Individual Services

### Step 1: Generate / Regenerate Synthetic Synoptic Data
```bash
python data/generate.py --days 7
```
*(Outputs `data/stations.json`, `data/stats.json`, and populates `data/aeroguard.db`)*

### Step 2: (Optional) Bulk Load into PostgreSQL
To load the generated data into a PostgreSQL instance:
```bash
python data/loader.py --db-url postgresql://postgres:postgres@localhost:5432/aeroguard
```

### Step 3: Run the AI/ML Microservice
```bash
python -m uvicorn ml.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 4: Run the Express Backend
```bash
cd server
npm install
npm run dev
```

### Step 5: Run the React UI
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 7. SIH Demonstration Walkthrough (17-Step Script)

1. **Open Dashboard (`/`):** View the National AWS Network Command Center with 1,248 stations, 1,173 online, 118k+ observations, live 24h anomaly pulse chart, and national trust index.
2. **Open Network Intelligence (`/network-map`):** Experience the full-screen Leaflet/OpenStreetMap operations console plotting all 1,248 AWS stations across India with status-coded markers and interactive layer toggles.
3. **Click Any Station on Map:** Inspect the real-time drawer showing station ID, current readings, coordinates, and trust score.
4. **Click "OPEN STATION" Button:** Navigates directly to Station Detail (`/stations/:id`).
5. **Inspect Multi-Parameter Synoptic Dynamics:** View synchronized 15-minute time series for Temperature, Relative Humidity, and Barometric Pressure with 1H, 6H, 24H, and 7D filters.
6. **Inspect Geodesic Peer Cluster:** Review the local 5-station peer comparison table and mini-map validating spatial consistency.
7. **Open Alert Center (`/alerts`):** Review active anomaly events filtered by severity (Critical, High, Medium, Low) and failure mode.
8. **Select a Critical Alert:** Click **"INVESTIGATE"** to open the 3-column AI Operational Investigation Console (`/alerts/:id`).
9. **Examine the 4 Operational Questions:**
   - **WHAT:** Anomaly signature & baseline deviation (+18.5°C step spike).
   - **WHY:** Single-station divergence while surrounding peer network remains normal; psychrometric inverse correlation violation.
   - **HOW CONFIDENT:** 94.0% multi-signal fusion consensus.
   - **WHAT TO DO:** Quarantine from numerical weather assimilation and dispatch technician.
10. **Analyze Evidence Breakdown:** Inspect visual strength bars for Temporal (92%), Spatial (94%), Multivariate (88%), and Isolation Forest (85%).
11. **Observe Trust Score Gauge:** Circular radial gauge displaying **23/100 (LOW TRUST / QUARANTINE)**.
12. **Launch Simulation Lab (`/simulation-lab`):** Select station `AWS-IND-0001`, parameter `temperature`, fault type `SPIKE`, severity `CRITICAL`.
13. **Click "INJECT ANOMALY & RUN PIPELINE":** Watch AEROGUARD execute the live 6-stage ML pipeline.
14. **Verify Real-Time Result:** System immediately creates Alert, degrades station sensor health, updates trust score to low trust, and records audit log.
15. **Human-in-the-Loop Validation:** Click **"Confirm Fault"** or **"Quarantine Observation"** to record expert review into the database.
16. **Maintenance Order Workflow (`/maintenance`):** Create or resolve engineering work orders and assign field technicians.
17. **Report Compliance Export (`/reports`):** Click **"GENERATE PDF REPORT"**, **"EXPORT EXCEL (.XLSX)"**, or **"EXPORT RAW CSV"** to download official dossiers.

---

## 8. Report Formats Supported

Per strict synoptic compliance specifications, reports are generated exclusively in:
- **PDF:** Executive summaries, KPI grids, anomaly breakdowns, and maintenance action logs.
- **CSV:** Tabular raw datasets for statistical analysis.
- **XLSX:** Multi-sheet Excel workbook with formatted sheets (`Summary`, `Stations`, `Observations`, `Anomalies`, `Sensor Health`, `Maintenance`).

*(JSON, HTML, and DOCX report formats are intentionally excluded)*.

---

## 9. Environment Variables (`.env.example`)

```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aeroguard
PORT=5000
ML_SERVICE_URL=http://127.0.0.1:8000
JWT_SECRET=aeroguard_meteorological_intelligence_secure_key_2026
```

---

## 10. Detailed Documentation

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, component breakdown, database ERD, data flow diagrams, deployment options |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Complete REST API reference with request/response schemas for all endpoints |
| [`docs/ML_PIPELINE.md`](docs/ML_PIPELINE.md) | 6-stage ML pipeline technical specification with mathematical formulas and performance benchmarks |

---

## 11. License

Developed for the **Smart India Hackathon 2026** (Problem Statement SIH26073).  
Licensed under the MIT License.
