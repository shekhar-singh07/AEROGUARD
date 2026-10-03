"""
AEROGUARD Rule-Based Quality Control (Rule QC) Engine
Detects:
- Missing parameters / Null values
- Impossible physical bounds (WMO limits)
- Stuck sensor (repeated constant values)
- Rapid impossible spikes
- Sudden dropouts / zero transitions
"""

from typing import Dict, Any, List, Optional

class RuleQCDetector:
    def __init__(self):
        # Physical limits for Indian meteorological context
        self.limits = {
            "temperature": {"min": -25.0, "max": 56.0, "max_rate_15m": 4.5},
            "relative_humidity": {"min": 1.0, "max": 100.0, "max_rate_15m": 25.0},
            "atmospheric_pressure": {"min": 750.0, "max": 1060.0, "max_rate_15m": 4.0}
        }

    def evaluate(self, current: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates current observation against physical and behavioral rules.
        Returns:
            - is_breached: bool
            - score: float (0.0 to 100.0, 100 means fully valid)
            - flags: List[str]
            - evidences: List[Dict[str, Any]]
        """
        flags = []
        evidences = []
        deductions = 0.0

        temp = current.get("temperature")
        rh = current.get("relative_humidity")
        press = current.get("atmospheric_pressure")

        # 1. Missing Value / Dropout Check
        if temp is None and rh is None and press is None:
            return {
                "is_breached": True,
                "score": 0.0,
                "flags": ["COMPLETE_DROPOUT"],
                "evidences": [{"type": "RULE_QC", "description": "Complete telemetry loss: all meteorological parameters missing", "score": 99.0}]
            }

        for param_name, val in [("temperature", temp), ("relative_humidity", rh), ("atmospheric_pressure", press)]:
            if val is None:
                deductions += 30.0
                flags.append(f"MISSING_{param_name.upper()}")
                evidences.append({
                    "type": "RULE_QC",
                    "description": f"Missing value for parameter '{param_name}' in transmitted telemetry frame",
                    "score": 85.0
                })
            else:
                p_limits = self.limits[param_name]
                # Range check
                if val < p_limits["min"] or val > p_limits["max"]:
                    deductions += 45.0
                    flags.append(f"OUT_OF_BOUNDS_{param_name.upper()}")
                    evidences.append({
                        "type": "RULE_QC",
                        "description": f"{param_name.capitalize()} value ({val}) violates physical bounds [{p_limits['min']}, {p_limits['max']}]",
                        "score": 98.0
                    })

        # 2. Stuck Sensor Check (check if last 4+ readings are identical)
        if history and len(history) >= 3:
            for param_name, current_val in [("temperature", temp), ("relative_humidity", rh), ("atmospheric_pressure", press)]:
                if current_val is not None:
                    prev_vals = [h.get(param_name) for h in history[-3:] if h.get(param_name) is not None]
                    if len(prev_vals) == 3 and all(abs(pv - current_val) < 0.0001 for pv in prev_vals):
                        deductions += 40.0
                        flags.append(f"STUCK_SENSOR_{param_name.upper()}")
                        evidences.append({
                            "type": "RULE_QC",
                            "description": f"{param_name.capitalize()} sensor stuck at {current_val} with zero natural turbulent variance over 4 intervals",
                            "score": 94.0
                        })

        # 3. Sudden Step / Spike Check vs immediate previous reading
        if history and len(history) >= 1:
            prev = history[-1]
            for param_name, current_val in [("temperature", temp), ("relative_humidity", rh), ("atmospheric_pressure", press)]:
                prev_val = prev.get(param_name)
                if current_val is not None and prev_val is not None:
                    delta = abs(current_val - prev_val)
                    max_rate = self.limits[param_name]["max_rate_15m"]
                    if delta > max_rate:
                        deductions += 35.0
                        flags.append(f"STEP_SPIKE_{param_name.upper()}")
                        evidences.append({
                            "type": "RULE_QC",
                            "description": f"Instantaneous 15-min change of {delta:.2f} in {param_name} exceeded threshold of {max_rate}",
                            "score": 92.0
                        })

        final_score = max(0.0, 100.0 - deductions)
        return {
            "is_breached": len(flags) > 0,
            "score": round(final_score, 1),
            "flags": flags,
            "evidences": evidences
        }
