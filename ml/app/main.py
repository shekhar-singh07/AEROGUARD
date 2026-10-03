"""
AEROGUARD FastAPI Machine Learning & Anomaly Detection Service
Provides:
- Rule-based QC
- Temporal Dynamics & Z-scores
- Multivariate Psychrometrics
- Spatial Peer Validation
- Isolation Forest Outlier Inference
- Evidence Fusion & Trust Scoring
- Anomaly Simulation Pipeline
"""

import os
import sys
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root importability
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from detection.rules import RuleQCDetector
from detection.temporal import TemporalAnalyzer
from detection.multivariate import MultivariateAnalyzer
from detection.spatial import SpatialValidator
from detection.isolation_forest import IsoForestDetector
from detection.fusion import EvidenceFusionEngine

app = FastAPI(
    title="AEROGUARD AI/ML Observation Intelligence Service",
    description="Intelligent Anomaly Detection, Spatial Validation, and Evidence Fusion for AWS Networks",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detection components
rule_detector = RuleQCDetector()
temporal_analyzer = TemporalAnalyzer()
multivariate_analyzer = MultivariateAnalyzer()
spatial_validator = SpatialValidator()
iso_forest = IsoForestDetector()
fusion_engine = EvidenceFusionEngine()

class ObservationModel(BaseModel):
    station_id: str
    temperature: Optional[float] = None
    relative_humidity: Optional[float] = None
    atmospheric_pressure: Optional[float] = None
    timestamp: Optional[str] = None

class EvaluateRequest(BaseModel):
    current: ObservationModel
    target_station: Optional[Dict[str, Any]] = None
    history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    peers: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class SimulateRequest(BaseModel):
    station_id: str
    parameter: str = "temperature"  # temperature | relative_humidity | atmospheric_pressure
    fault_type: str = "SPIKE"       # SPIKE | DRIFT | BIAS | STUCK | DROPOUT | MISSING | WEATHER_EVENT
    severity: str = "HIGH"          # LOW | MEDIUM | HIGH | CRITICAL
    duration_intervals: int = 4
    magnitude: Optional[float] = None

@app.get("/health")
def health():
    return {
        "service": "AEROGUARD ML Service",
        "status": "ONLINE",
        "models": {
            "isolation_forest": "LOADED_ACTIVE",
            "rule_qc": "ACTIVE",
            "spatial_validator": "ACTIVE",
            "evidence_fusion": "ACTIVE"
        },
        "cadence": "15-minute standard synoptic"
    }

@app.post("/evaluate")
def evaluate_observation(payload: EvaluateRequest):
    curr_dict = payload.current.model_dump()
    hist_list = payload.history or []
    peers_list = payload.peers or []

    # 1. Rule QC
    rule_res = rule_detector.evaluate(curr_dict, hist_list)

    # 2. Temporal Analysis
    temp_res = temporal_analyzer.analyze(curr_dict, hist_list)

    # Calculate 15m deltas for multivariate and ML inference
    delta_temp = 0.0
    delta_rh = 0.0
    delta_press = 0.0
    if hist_list:
        last = hist_list[-1]
        if curr_dict.get("temperature") is not None and last.get("temperature") is not None:
            delta_temp = curr_dict["temperature"] - last["temperature"]
        if curr_dict.get("relative_humidity") is not None and last.get("relative_humidity") is not None:
            delta_rh = curr_dict["relative_humidity"] - last["relative_humidity"]
        if curr_dict.get("atmospheric_pressure") is not None and last.get("atmospheric_pressure") is not None:
            delta_press = curr_dict["atmospheric_pressure"] - last["atmospheric_pressure"]

    delta_dict = {"delta_temp": delta_temp, "delta_rh": delta_rh, "delta_press": delta_press}

    # 3. Multivariate Analysis
    multi_res = multivariate_analyzer.analyze(curr_dict, delta_dict)

    # 4. Spatial Validation
    spatial_res = spatial_validator.validate(curr_dict, peers_list)

    # 5. Isolation Forest Inference
    ml_res = iso_forest.predict(curr_dict, delta_temp, delta_rh)

    # 6. Evidence Fusion & Trust Scoring
    fusion_res = fusion_engine.fuse(
        current_obs=curr_dict,
        rule_result=rule_res,
        temporal_result=temp_res,
        multivariate_result=multi_res,
        spatial_result=spatial_res,
        ml_result=ml_res
    )

    return {
        "observation": curr_dict,
        "classification": fusion_res["classification"],
        "trust_score": fusion_res["trust_score"],
        "trust_level": fusion_res["trust_level"],
        "confidence": fusion_res["confidence"],
        "four_questions": {
            "what": fusion_res["what_happened"],
            "why": fusion_res["why_happened"],
            "confidence": fusion_res["how_confident"],
            "action": fusion_res["what_to_do"]
        },
        "evidence_strengths": fusion_res["evidence_strengths"],
        "evidences": fusion_res["evidence"],
        "component_scores": fusion_res["component_scores"]
    }

@app.post("/simulate")
def simulate_fault(req: SimulateRequest):
    """
    Executes an anomaly injection pipeline for live demonstration:
    Synthesizes observation, runs full 6-stage ML pipeline,
    and returns complete operational response.
    """
    base_t = 28.5
    base_rh = 65.0
    base_press = 1008.0

    mag = req.magnitude
    if mag is None:
        severity_mult = {"LOW": 1.0, "MEDIUM": 2.0, "HIGH": 3.5, "CRITICAL": 5.0}.get(req.severity, 2.5)
        mag = 4.0 * severity_mult

    sim_t = base_t
    sim_rh = base_rh
    sim_press = base_press
    peers_data = []

    # Configure baseline peer stations
    for i in range(4):
        peers_data.append({
            "station_id": f"PEER-0{i+1}",
            "temperature": round(base_t + (i - 1.5) * 0.4, 2),
            "relative_humidity": round(base_rh + (i - 1.5) * 1.0, 2),
            "atmospheric_pressure": round(base_press + (i - 1.5) * 0.2, 2)
        })

    # Historical observations
    history = [
        {"temperature": round(base_t - 0.2, 2), "relative_humidity": round(base_rh + 0.5, 2), "atmospheric_pressure": base_press},
        {"temperature": round(base_t - 0.1, 2), "relative_humidity": round(base_rh + 0.2, 2), "atmospheric_pressure": base_press},
        {"temperature": round(base_t, 2), "relative_humidity": round(base_rh, 2), "atmospheric_pressure": base_press}
    ]

    ftype = req.fault_type.upper()
    if ftype == "SPIKE":
        if req.parameter == "temperature":
            sim_t += mag
        elif req.parameter == "relative_humidity":
            sim_rh = min(100.0, sim_rh + mag * 3)
        else:
            sim_press += mag * 2

    elif ftype == "DRIFT":
        if req.parameter == "relative_humidity":
            sim_rh = min(100.0, sim_rh + mag * 2.0)
        else:
            sim_t += mag * 1.5

    elif ftype == "BIAS":
        if req.parameter == "atmospheric_pressure":
            sim_press -= mag * 3.0
        else:
            sim_t -= mag

    elif ftype == "STUCK":
        sim_t = 29.4
        history = [
            {"temperature": 29.4, "relative_humidity": 60.0, "atmospheric_pressure": 1008.0},
            {"temperature": 29.4, "relative_humidity": 60.0, "atmospheric_pressure": 1008.0},
            {"temperature": 29.4, "relative_humidity": 60.0, "atmospheric_pressure": 1008.0}
        ]

    elif ftype == "DROPOUT":
        sim_t = None
        sim_rh = None
        sim_press = None

    elif ftype == "MISSING":
        if req.parameter == "temperature":
            sim_t = None
        elif req.parameter == "relative_humidity":
            sim_rh = None
        else:
            sim_press = None

    elif ftype == "WEATHER_EVENT":
        # In genuine weather event, both target station AND peers experience coordinated shift!
        sim_t -= 6.5
        sim_rh = min(98.0, sim_rh + 26.0)
        sim_press -= 4.2
        for p in peers_data:
            p["temperature"] = round(sim_t + (peers_data.index(p) - 1.5) * 0.3, 2)
            p["relative_humidity"] = round(sim_rh - 2.0, 2)
            p["atmospheric_pressure"] = round(sim_press + 0.1, 2)

    current_sim = {
        "station_id": req.station_id,
        "temperature": round(sim_t, 2) if sim_t is not None else None,
        "relative_humidity": round(sim_rh, 2) if sim_rh is not None else None,
        "atmospheric_pressure": round(sim_press, 2) if sim_press is not None else None,
        "timestamp": "SIMULATED_NOW"
    }

    eval_req = EvaluateRequest(
        current=ObservationModel(**current_sim),
        history=history,
        peers=peers_data
    )
    result = evaluate_observation(eval_req)
    result["simulation_parameters"] = req.model_dump()
    result["injected_values"] = current_sim
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
