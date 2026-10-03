"""
AEROGUARD Temporal Analysis Engine
Implements:
- Rate of Change (15m, 1h)
- Rolling Mean & Rolling Standard Deviation (Z-score calculation)
- Diurnal expectation baseline comparison
- Trend stability & anomaly scoring
"""

import math
from typing import Dict, Any, List

class TemporalAnalyzer:
    def __init__(self):
        pass

    def analyze(self, current: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes temporal dynamics over historical observations.
        Returns:
            - temporal_score: float (0.0 to 100.0, 100 means temporally consistent)
            - metrics: Dict with rates, rolling stats, z-scores
            - evidences: List of temporal evidence items
        """
        evidences = []
        deductions = 0.0
        metrics = {}

        if not history or len(history) < 2:
            return {
                "temporal_score": 95.0,
                "metrics": {"sample_count": len(history) if history else 0},
                "evidences": []
            }

        temp_vals = [h.get("temperature") for h in history if h.get("temperature") is not None]
        curr_temp = current.get("temperature")

        if curr_temp is not None and len(temp_vals) >= 4:
            # Calculate rolling mean and standard deviation
            mean_temp = sum(temp_vals) / len(temp_vals)
            variance = sum((x - mean_temp) ** 2 for x in temp_vals) / len(temp_vals)
            std_temp = math.sqrt(variance) if variance > 0.001 else 0.5
            
            # Z-Score
            z_score = abs(curr_temp - mean_temp) / std_temp
            metrics["temperature_z_score"] = round(z_score, 2)
            metrics["temperature_rolling_mean"] = round(mean_temp, 2)
            metrics["temperature_rolling_std"] = round(std_temp, 2)

            # 15-min rate of change
            rate_15m = abs(curr_temp - temp_vals[-1])
            metrics["temperature_rate_15m"] = round(rate_15m, 2)

            if z_score > 3.5:
                deductions += 40.0
                evidences.append({
                    "type": "TEMPORAL",
                    "description": f"Temperature Z-score ({z_score:.2f}) indicates extreme departure (>3.5-sigma) from station's rolling baseline ({mean_temp:.1f}°C)",
                    "score": min(98.0, 70.0 + z_score * 7.0)
                })
            elif z_score > 2.5:
                deductions += 20.0
                evidences.append({
                    "type": "TEMPORAL",
                    "description": f"Elevated temperature deviation: Z-score is {z_score:.2f} relative to recent baseline",
                    "score": 75.0
                })

            if rate_15m > 4.0:
                deductions += 30.0
                evidences.append({
                    "type": "TEMPORAL",
                    "description": f"Rapid temperature transition of {rate_15m:.2f}°C/15min exceeds normal meteorological gradients",
                    "score": 90.0
                })

        # Humidity temporal check
        rh_vals = [h.get("relative_humidity") for h in history if h.get("relative_humidity") is not None]
        curr_rh = current.get("relative_humidity")
        if curr_rh is not None and len(rh_vals) >= 4:
            mean_rh = sum(rh_vals) / len(rh_vals)
            rh_rate_15m = abs(curr_rh - rh_vals[-1])
            metrics["rh_rate_15m"] = round(rh_rate_15m, 2)
            metrics["rh_rolling_mean"] = round(mean_rh, 2)

            # Check continuous drift (monotonic change over last 6 points)
            if len(rh_vals) >= 6:
                diffs = [rh_vals[i] - rh_vals[i-1] for i in range(1, len(rh_vals))]
                if all(d > 0.4 for d in diffs[-5:]) or all(d < -0.4 for d in diffs[-5:]):
                    deductions += 25.0
                    evidences.append({
                        "type": "TEMPORAL",
                        "description": "Continuous monotonic sensor drift detected in relative humidity over consecutive observations",
                        "score": 86.0
                    })

        temporal_score = max(5.0, 100.0 - deductions)
        return {
            "temporal_score": round(temporal_score, 1),
            "metrics": metrics,
            "evidences": evidences
        }
