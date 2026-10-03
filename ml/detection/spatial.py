"""
AEROGUARD Spatial Validation Engine
- Calculates geodesic Haversine distance to peer AWS stations
- Identifies nearest k-neighbors (within 100 km radius)
- Evaluates spatial coherence ratio
- CRITICAL DIFFERENTIATOR: Distinguishes isolated sensor faults (low peer coherence)
  from genuine regional weather events (high peer coherence across multiple stations).
"""

import math
from typing import Dict, Any, List

class SpatialValidator:
    def __init__(self, max_peer_radius_km: float = 120.0):
        self.max_peer_radius_km = max_peer_radius_km

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Computes great-circle distance in kilometers between two lat/lon coordinates."""
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def find_peers(self, target_station: Dict[str, Any], all_stations: List[Dict[str, Any]], k: int = 5) -> List[Dict[str, Any]]:
        """Finds k nearest peer stations within max radius."""
        t_lat = target_station.get("latitude", 0.0)
        t_lon = target_station.get("longitude", 0.0)
        t_id = target_station.get("station_id")

        candidates = []
        for s in all_stations:
            if s.get("station_id") == t_id or s.get("station_status") == "OFFLINE":
                continue
            dist = self.haversine_distance(t_lat, t_lon, s.get("latitude", 0.0), s.get("longitude", 0.0))
            if dist <= self.max_peer_radius_km:
                candidates.append({**s, "distance_km": round(dist, 1)})

        candidates.sort(key=lambda x: x["distance_km"])
        return candidates[:k]

    def validate(self, current: Dict[str, Any], peers_current: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validates target observation against peer stations.
        Returns:
            - spatial_score: float (0-100)
            - is_coherent: bool
            - peer_count: int
            - peer_mean_temp: float
            - temp_diff: float
            - evidences: List of spatial evidence items
        """
        evidences = []
        if not peers_current:
            return {
                "spatial_score": 75.0,
                "is_coherent": True,
                "peer_count": 0,
                "peer_mean_temp": None,
                "temp_diff": 0.0,
                "evidences": [{"type": "SPATIAL", "description": "No active peer stations within 120km radius for cross-validation", "score": 50.0}]
            }

        curr_temp = current.get("temperature")
        peer_temps = [p.get("temperature") for p in peers_current if p.get("temperature") is not None]

        if curr_temp is None or not peer_temps:
            return {
                "spatial_score": 70.0,
                "is_coherent": True,
                "peer_count": len(peers_current),
                "peer_mean_temp": None,
                "temp_diff": 0.0,
                "evidences": []
            }

        peer_mean = sum(peer_temps) / len(peer_temps)
        diff = abs(curr_temp - peer_mean)
        
        # Check standard deviation of peers
        variance = sum((x - peer_mean) ** 2 for x in peer_temps) / len(peer_temps)
        peer_std = math.sqrt(variance) if variance > 0.01 else 0.8

        z_spatial = diff / peer_std

        # Case 1: Target station severely deviates while peers are tightly clustered -> SENSOR FAULT
        if diff > 6.0 and peer_std < 2.5:
            spatial_score = max(5.0, 100.0 - (diff * 12.0))
            evidences.append({
                "type": "SPATIAL",
                "description": f"Severe spatial anomaly: Target station ({curr_temp:.1f}°C) deviates by {diff:.1f}°C from {len(peer_temps)} peer stations (mean: {peer_mean:.1f}°C, std: +-{peer_std:.1f}°C)",
                "score": min(98.0, 75.0 + diff * 2.5)
            })
            is_coherent = False

        # Case 2: Target station and peers both exhibit extreme or shifted conditions -> GENUINE WEATHER EVENT
        elif diff <= 2.5:
            spatial_score = 96.0
            evidences.append({
                "type": "SPATIAL",
                "description": f"High spatial coherence: Observation aligns closely with {len(peer_temps)} neighboring AWS stations within {self.max_peer_radius_km}km (diff={diff:.1f}°C)",
                "score": 92.0
            })
            is_coherent = True

        else:
            spatial_score = max(40.0, 100.0 - (diff * 7.0))
            evidences.append({
                "type": "SPATIAL",
                "description": f"Moderate spatial gradient observed against local peer network (diff={diff:.1f}°C, local dispersion +-{peer_std:.1f}°C)",
                "score": 70.0
            })
            is_coherent = True

        return {
            "spatial_score": round(spatial_score, 1),
            "is_coherent": is_coherent,
            "peer_count": len(peer_temps),
            "peer_mean_temp": round(peer_mean, 2),
            "peer_std_temp": round(peer_std, 2),
            "temp_diff": round(diff, 2),
            "evidences": evidences
        }
