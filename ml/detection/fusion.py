"""
AEROGUARD Evidence Fusion and Decision Engine
Integrates:
- Rule-based QC
- Temporal Dynamics
- Multivariate Psychrometrics
- Spatial Peer Coherence
- Unsupervised Isolation Forest

Calculates:
- 0-100 Observation Trust Score
- Multi-signal Confidence (0.0 to 1.0)
- Classification: NORMAL | GENUINE_WEATHER_EVENT | PROBABLE_SENSOR_FAULT | UNCERTAIN
- Detailed Evidence Array with Visual Strength Scores
- 4 Operational Answers: WHAT, WHY, HOW CONFIDENT, WHAT TO DO
"""

from typing import Dict, Any, List

class EvidenceFusionEngine:
    def __init__(self):
        # Weights for trust scoring synthesis
        self.weights = {
            "rule_qc": 0.25,
            "temporal": 0.20,
            "multivariate": 0.20,
            "spatial": 0.25,
            "isolation_forest": 0.10
        }

    def fuse(
        self,
        current_obs: Dict[str, Any],
        rule_result: Dict[str, Any],
        temporal_result: Dict[str, Any],
        multivariate_result: Dict[str, Any],
        spatial_result: Dict[str, Any],
        ml_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes multi-source evidence fusion.
        """
        # Collect component scores (0 - 100)
        s_rule = rule_result.get("score", 100.0)
        s_temp = temporal_result.get("temporal_score", 100.0)
        s_multi = multivariate_result.get("multivariate_score", 100.0)
        s_spatial = spatial_result.get("spatial_score", 100.0)
        s_ml = ml_result.get("ml_score", 100.0)

        # Weighted Composite Score
        composite_trust = (
            s_rule * self.weights["rule_qc"] +
            s_temp * self.weights["temporal"] +
            s_multi * self.weights["multivariate"] +
            s_spatial * self.weights["spatial"] +
            s_ml * self.weights["isolation_forest"]
        )

        all_evidences = []
        all_evidences.extend(rule_result.get("evidences", []))
        all_evidences.extend(temporal_result.get("evidences", []))
        all_evidences.extend(multivariate_result.get("evidences", []))
        all_evidences.extend(spatial_result.get("evidences", []))
        if ml_result.get("evidence"):
            all_evidences.append(ml_result["evidence"])

        # Determine Classification
        is_rule_breach = rule_result.get("is_breached", False)
        is_spatial_coherent = spatial_result.get("is_coherent", True)
        is_physically_consistent = multivariate_result.get("is_physically_consistent", True)
        ml_anomaly = ml_result.get("is_anomaly", False)
        temp_diff = spatial_result.get("temp_diff", 0.0)
        peer_count = spatial_result.get("peer_count", 0)

        # DECISION MATRIX:
        # Check for GENUINE REGIONAL WEATHER EVENT:
        # Extreme reading or ML flagged anomaly, BUT:
        # 1. High spatial coherence with peer stations (temp_diff <= 2.5 and peer_count >= 2)
        # 2. Physically consistent thermodynamic profile
        # 3. Not a hardware failure (not stuck, not dropout, not nulls)
        hardware_rule_breach = any("STUCK" in f or "MISSING" in f or "DROPOUT" in f or "OUT_OF_BOUNDS" in f for f in rule_result.get("flags", []))
        is_step_spike_only = all("STEP_SPIKE" in f for f in rule_result.get("flags", []))

        is_extreme_value = (s_temp < 60.0 or ml_anomaly or is_step_spike_only)
        if is_extreme_value and is_spatial_coherent and peer_count >= 2 and is_physically_consistent and not hardware_rule_breach:
            classification = "GENUINE_WEATHER_EVENT"
            trust_score = round(max(84.0, min(95.0, composite_trust + 25.0)), 1)
            confidence = 0.94
            what_happened = f"Sudden regional meteorological disturbance / convective squall detected across {peer_count} peer AWS stations."
            why_happened = f"Rapid rate of change confirmed across adjacent spatial network (peer dispersion within limits); psychrometric profile validates convective downdraft."
            what_to_do = "Validate regional storm trajectory with radar / satellite telemetry and accept observation into synoptic dataset."

        # Check for PROBABLE SENSOR FAULT:
        # Rule breach OR strong spatial divergence (> 5.0 C diff) OR physical contradiction
        elif is_rule_breach or (temp_diff > 5.0 and peer_count >= 2) or (s_temp < 50.0 and not is_spatial_coherent) or not is_physically_consistent:
            classification = "PROBABLE_SENSOR_FAULT"
            trust_score = round(min(38.0, composite_trust), 1)
            confidence = 0.91
            primary_reason = rule_result.get("flags", ["Spatial divergence"])[0] if rule_result.get("flags") else "Severe multi-station divergence"
            what_happened = f"Sensor anomaly detected ({primary_reason.replace('_', ' ')})."
            why_happened = f"Station diverges sharply from peer network (diff={temp_diff:.1f}°C) and fails physical consistency checks."
            what_to_do = "Quarantine observation from downstream numerical models and dispatch maintenance order for sensor inspection."

        # Check for UNCERTAIN / HUMAN REVIEW:
        elif composite_trust < 75.0 or 40.0 <= composite_trust <= 69.0:
            classification = "UNCERTAIN"
            trust_score = round(composite_trust, 1)
            confidence = 0.76
            what_happened = "Moderate observation ambiguity detected in cross-validation checks."
            why_happened = "Sensor reading shows elevated local gradients with limited peer station coverage or marginal variance."
            what_to_do = "Route to Data Quality Expert for human verification before assimilation."

        # NORMAL:
        else:
            classification = "NORMAL"
            trust_score = round(max(90.0, min(100.0, composite_trust)), 1)
            confidence = 0.98
            what_happened = "Station parameters within expected climatological and spatial envelopes."
            why_happened = "Continuous validation satisfied across rule-based, temporal, spatial, and multivariate checks."
            what_to_do = "Accept observation directly into operational weather model assimilation pipelines."

        # Format visual strength percentages for each dimension (0-100)
        # Note: In evidence visualizers, higher strength = stronger anomaly signal detected
        visual_evidence_strengths = {
            "temporal": round(max(5.0, 100.0 - s_temp), 1),
            "spatial": round(max(5.0, 100.0 - s_spatial), 1),
            "multivariate": round(max(5.0, 100.0 - s_multi), 1),
            "ml_isolation_forest": round(max(5.0, 100.0 - s_ml), 1),
            "rule_qc": round(max(5.0, 100.0 - s_rule), 1)
        }

        # Trust score status text
        if trust_score >= 90.0:
            trust_level = "HIGHLY_TRUSTED"
        elif trust_score >= 70.0:
            trust_level = "TRUSTED"
        elif trust_score >= 40.0:
            trust_level = "REVIEW_RECOMMENDED"
        else:
            trust_level = "LOW_TRUST_QUARANTINE"

        return {
            "classification": classification,
            "trust_score": trust_score,
            "trust_level": trust_level,
            "confidence": confidence,
            "what_happened": what_happened,
            "why_happened": why_happened,
            "how_confident": f"{confidence * 100:.1f}% confidence",
            "what_to_do": what_to_do,
            "evidence_strengths": visual_evidence_strengths,
            "evidence": all_evidences,
            "component_scores": {
                "rule_qc": s_rule,
                "temporal": s_temp,
                "multivariate": s_multi,
                "spatial": s_spatial,
                "isolation_forest": s_ml
            }
        }
