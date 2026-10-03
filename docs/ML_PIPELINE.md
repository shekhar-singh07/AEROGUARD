# AEROGUARD — ML Pipeline Technical Specification

## Multi-Signal Evidence Fusion & Decision Engine

---

## 1. Problem Definition

Meteorological AWS networks generate ~4 observations/hour × 1,248 stations = **~119,000 observations per day**. Each observation may contain sensor faults indistinguishable from genuine extreme weather events using traditional threshold-based quality control.

**The Critical Challenge:** A coastal cyclonic gust front causing simultaneous:
- 7°C temperature drop
- 95% humidity surge  
- 4 hPa barometric collapse

...across 25 neighboring stations produces signals **identical** to a multi-sensor failure cascade under rule-based systems.

AEROGUARD's ML pipeline **disambiguates** these scenarios through multi-dimensional evidence fusion.

---

## 2. Pipeline Stages

### Stage 1: Rule-Based Quality Control (`rules.py`)

**Purpose:** Fast-reject physically impossible values.

| Parameter | Valid Range | Source |
|---|---|---|
| Temperature | -90°C to +60°C | WMO Climatological Standards |
| Relative Humidity | 0% to 100% | Physical bounds |
| Barometric Pressure | 870 to 1084 hPa | WMO extremes |
| Wind Speed | 0 to 408 km/h | Record: 408 km/h Barrow Is. |
| Rainfall | 0 to 305 mm/15min | Record: 305mm/hr Réunion |

**Stuck Sensor Detection:**
- Rolling window: 4 hours (16 observations)
- Variance threshold: < 0.01
- If all values constant within window → STUCK flag

**Output:** `rules_score ∈ [0, 1]`, list of triggered flags.

---

### Stage 2: Temporal Dynamics Analysis (`temporal.py`)

**Purpose:** Detect anomalous rate-of-change relative to the station's own recent history.

**Three Sub-Signals:**

1. **Rate of Change (15-min delta)**
   ```
   δ(t) = |value(t) - value(t-1)|
   Anomaly if: δ_temp > 5°C/15min, δ_RH > 20%/15min, δ_P > 3 hPa/15min
   ```

2. **Rolling Z-Score**
   ```
   Z = (value - μ_rolling) / σ_rolling
   Window: 24 hours (96 observations)
   Anomaly if: |Z| > 3.0
   ```

3. **Diurnal Baseline Deviation**
   ```
   Expected = monthly_mean_for_hour ± seasonal_σ
   Anomaly if: deviation > 4σ from climatological norm
   ```

**Output:** `temporal_score ∈ [0, 1]`, rate_of_change, z_score values.

---

### Stage 3: Multivariate Coupling Analysis (`multivariate.py`)

**Purpose:** Verify physical consistency between co-located sensors.

**Three Coupling Tests:**

1. **Psychrometric T↔RH Inverse Coupling**
   ```
   Normal physics: Temperature ↑ → Relative Humidity ↓ (and vice versa)
   If both increase or both decrease simultaneously → coupling violation
   Violation implies sensor fault (not weather)
   ```

2. **Hypsometric T↔P Altitude Consistency**
   ```
   Standard lapse rate: -6.5°C / 1000m
   If temperature and pressure disagree with altitude → sensor issue
   ```

3. **Convective Squall Detection**
   ```
   Genuine squall signature: P_drop + RH_spike + T_drop simultaneously
   If only one parameter anomalous → likely sensor fault
   If all three present → likely genuine convective event
   ```

**Output:** `multivariate_score ∈ [0, 1]`, coupling violation flags.

---

### Stage 4: Spatial Peer Validation (`spatial.py`)

**Purpose:** Compare the station's readings against its geographic neighbors.

**Algorithm:**
```python
# 1. Find k=5 nearest peers using Haversine distance
peers = find_nearest_k(station.lat, station.lon, k=5, max_radius_km=150)

# 2. Compute spatial deviation
for param in [temp, rh, pressure]:
    peer_mean = mean([peer.value for peer in peers])
    peer_std = std([peer.value for peer in peers])
    station_deviation = |station.value - peer_mean| / max(peer_std, 0.1)

# 3. Spatial Coherence Ratio
agreeing_peers = count(peers where deviation < 2σ)
SCR = agreeing_peers / total_peers

# 4. Classification signal
if SCR > 0.6 → peers ALSO anomalous → likely GENUINE WEATHER EVENT
if SCR < 0.3 → station alone is anomalous → likely SENSOR FAULT
```

**Haversine Distance Formula:**
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
d = 2R × arctan2(√a, √(1-a))    where R = 6371 km
```

**Output:** `spatial_score ∈ [0, 1]`, coherence_ratio, peer_count.

---

### Stage 5: Isolation Forest (`isolation_forest.py`)

**Purpose:** Unsupervised anomaly detection in high-dimensional feature space.

**Feature Vector:**
```python
features = [
    normalized_value,       # Current observation (z-normalized)
    delta_value,            # 15-min rate of change
    z_score,                # Rolling 24h Z-score
    spatial_deviation,      # Distance from peer mean (in σ)
    coupling_violation,     # 0 or 1 (from multivariate stage)
    diurnal_deviation       # Deviation from climatological norm
]
```

**Model Configuration:**
```python
IsolationForest(
    n_estimators=100,
    contamination=0.05,      # Expected 5% anomaly rate
    max_samples='auto',
    random_state=42
)
```

**Resilient Fallback:** When Scikit-learn C-extensions fail (restricted environments), AEROGUARD automatically switches to a custom NumPy-vectorized implementation:
```python
# Custom implementation uses random subspace splitting
# Binary search tree partitioning with expected path length scoring
# anomaly_score = 2^(-E(h(x)) / c(n)) where c(n) is average BST height
```

**Output:** `iforest_score ∈ [0, 1]`, anomaly_label (-1 or 1).

---

### Stage 6: Evidence Fusion Engine (`fusion.py`)

**Purpose:** Combine all 5 signals into a single trust assessment.

**Weighted Fusion Formula:**
```
anomaly_score = Σ(weight_i × stage_score_i)

Weights:
  rules_weight      = 0.20
  temporal_weight    = 0.25
  multivariate_weight = 0.20
  spatial_weight     = 0.20
  iforest_weight     = 0.15
                       ────
  Total              = 1.00
```

**Trust Score:**
```
trust_score = max(0, min(100, 100 - (anomaly_score × 100)))
```

**Classification Decision Tree:**
```
IF trust_score ≥ 90:
    → NORMAL
    → Action: Direct assimilation into NWP models

ELIF trust_score ≥ 39 AND spatial_coherence_ratio > 0.6:
    → GENUINE_WEATHER_EVENT  
    → Action: Validate against radar/satellite; flag for meteorologist review

ELIF trust_score < 39:
    → PROBABLE_SENSOR_FAULT
    → Action: Quarantine from assimilation; dispatch maintenance; alert operator
```

---

## 3. Operational Output — Four Questions

For every flagged observation, AEROGUARD answers:

| Question | Example Answer |
|---|---|
| **WHAT happened?** | Temperature spike of +18.5°C in 15 minutes at AWS-IND-0006 |
| **WHY did it happen?** | Single-station divergence; 5/5 peers normal; psychrometric inverse coupling violated; Isolation Forest anomaly score 0.85 |
| **HOW confident?** | 94.0% multi-signal fusion consensus (temporal: 92%, spatial: 94%, multivariate: 88%, IForest: 85%) |
| **WHAT to do?** | QUARANTINE observation from NWP assimilation; dispatch field calibration team to Kolhapur Met-Obs-06 |

---

## 4. Performance Benchmarks

| Metric | Value |
|---|---|
| Single observation evaluation | ~50ms |
| Full station evaluation (96 obs) | ~200ms |
| Isolation Forest training (1,248 stations) | ~2 seconds |
| Spatial peer lookup (Haversine) | ~5ms |
| Evidence fusion computation | ~1ms |
| End-to-end pipeline (all 6 stages) | < 500ms |

---

## 5. Innovation Highlights

1. **Evidence Fusion over Binary Classification** — Unlike traditional approaches that output "anomaly/normal", AEROGUARD provides a continuous trust score (0–100) with per-signal evidence breakdown.

2. **Weather Event Disambiguation** — Spatial coherence analysis distinguishes genuine regional weather events from sensor faults — the critical gap in existing QC systems.

3. **Resilient ML Execution** — Custom fallback implementations ensure the pipeline runs on any platform, even those blocking native C-extensions.

4. **Human-in-the-Loop** — Expert meteorologists can confirm, dismiss, quarantine, or escalate any AI decision, with full audit trail.

5. **Explainable AI** — Every classification includes natural-language reasoning answering the 4 operational questions, not just a score.

---

*AEROGUARD — Observe. Validate. Trust. Act.*
