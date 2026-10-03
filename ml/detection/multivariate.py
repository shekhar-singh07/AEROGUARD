"""
AEROGUARD Multivariate Analysis Engine
Analyzes physical meteorological inter-variable coupling:
- Temperature <-> Relative Humidity (Psychrometric inverse correlation)
- Temperature <-> Pressure (Thermal hypsometric relations)
- Relative Humidity <-> Pressure (Frontal & convective indicators)
"""

import math
from typing import Dict, Any, List

class MultivariateAnalyzer:
    def __init__(self):
        pass

    def calculate_dew_point(self, temp_c: float, rh_pct: float) -> float:
        """Magnus-Tetens approximation for dew point temperature."""
        a = 17.27
        b = 237.7
        alpha = ((a * temp_c) / (b + temp_c)) + math.log(max(1.0, min(100.0, rh_pct)) / 100.0)
        return round((b * alpha) / (a - alpha), 2)

    def analyze(self, current: Dict[str, Any], delta_history: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Evaluates physical consistency among cross-parameters.
        Returns:
            - multivariate_score: float (0-100)
            - is_physically_consistent: bool
            - dew_point: float
            - evidences: List of multivariate evidence items
        """
        temp = current.get("temperature")
        rh = current.get("relative_humidity")
        press = current.get("atmospheric_pressure")

        evidences = []
        deductions = 0.0

        if temp is None or rh is None:
            return {
                "multivariate_score": 50.0,
                "is_physically_consistent": False,
                "dew_point": None,
                "evidences": [{"type": "MULTIVARIATE", "description": "Insufficient parameter vector for multivariate coupling analysis", "score": 60.0}]
            }

        dew_point = self.calculate_dew_point(temp, rh)
        
        # Physical law: Dew point cannot exceed dry bulb temperature
        if dew_point > temp + 0.5:
            deductions += 60.0
            evidences.append({
                "type": "MULTIVARIATE",
                "description": f"Physically impossible thermodynamic state: Calculated Dew Point ({dew_point}°C) exceeds Dry Bulb Temperature ({temp}°C)",
                "score": 98.0
            })

        # Psychrometric inverse correlation check if rate of change is available
        if delta_history:
            d_temp = delta_history.get("delta_temp", 0.0)
            d_rh = delta_history.get("delta_rh", 0.0)
            d_press = delta_history.get("delta_press", 0.0)

            # If temperature increases sharply (+4°C), relative humidity MUST decrease unless moisture advection is occurring
            if d_temp > 3.0 and d_rh > 10.0 and abs(d_press) < 1.0:
                deductions += 35.0
                evidences.append({
                    "type": "MULTIVARIATE",
                    "description": f"Inconsistent psychrometric response: Temperature surged (+{d_temp:.1f}°C) simultaneously with RH surge (+{d_rh:.1f}%) in absence of barometric frontal activity",
                    "score": 88.0
                })

            # Severe convective storm signature check (genuine weather indicator):
            # Sharp temp drop + sharp RH rise + sharp pressure drop
            if d_temp < -4.0 and d_rh > 15.0 and d_press < -2.0:
                evidences.append({
                    "type": "MULTIVARIATE",
                    "description": f"Thermodynamically consistent convective squall/gust-front signature: delta_T={d_temp:.1f}°C, delta_RH=+{d_rh:.1f}%, delta_P={d_press:.1f} hPa",
                    "score": 94.0
                })

        # Pressure sanity check vs standard barometric range
        if press is not None:
            if press < 850.0 or press > 1050.0:
                deductions += 30.0
                evidences.append({
                    "type": "MULTIVARIATE",
                    "description": f"Atmospheric pressure ({press} hPa) severely outside regional barometric scale",
                    "score": 92.0
                })

        multivariate_score = max(5.0, 100.0 - deductions)
        return {
            "multivariate_score": round(multivariate_score, 1),
            "is_physically_consistent": deductions < 30.0,
            "dew_point": dew_point,
            "evidences": evidences
        }
