"""
AEROGUARD Isolation Forest Anomaly Detector
Implements Liu, Ting, Zhou (2008) Isolation Forest algorithm.
Includes dynamic fallback to native NumPy implementation when OS Application Control
blocks external C-extension DLLs.
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional

class IsolationTreeNode:
    def __init__(self, left=None, right=None, split_feature=None, split_value=None, size=1):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size
        self.is_leaf = left is None and right is None

class IsolationTree:
    def __init__(self, max_depth: int):
        self.max_depth = max_depth
        self.root = None

    def fit(self, X: np.ndarray, current_depth: int = 0) -> IsolationTreeNode:
        n_samples, n_features = X.shape
        if current_depth >= self.max_depth or n_samples <= 1:
            return IsolationTreeNode(size=n_samples)

        feat_idx = np.random.randint(0, n_features)
        feat_vals = X[:, feat_idx]
        feat_min, feat_max = feat_vals.min(), feat_vals.max()

        if feat_min == feat_max:
            return IsolationTreeNode(size=n_samples)

        split_val = np.random.uniform(feat_min, feat_max)
        left_mask = feat_vals < split_val
        right_mask = ~left_mask

        if left_mask.sum() == 0 or right_mask.sum() == 0:
            return IsolationTreeNode(size=n_samples)

        left_node = self.fit(X[left_mask], current_depth + 1)
        right_node = self.fit(X[right_mask], current_depth + 1)

        return IsolationTreeNode(
            left=left_node,
            right=right_node,
            split_feature=feat_idx,
            split_value=split_val,
            size=n_samples
        )

    def path_length(self, x: np.ndarray, node: IsolationTreeNode, current_depth: int = 0) -> float:
        if node.is_leaf:
            return current_depth + self._c(node.size)
        feat_val = x[node.split_feature]
        if feat_val < node.split_value:
            return self.path_length(x, node.left, current_depth + 1)
        else:
            return self.path_length(x, node.right, current_depth + 1)

    @staticmethod
    def _c(n: int) -> float:
        if n <= 1:
            return 0.0
        if n == 2:
            return 1.0
        # Euler-Mascheroni constant = 0.5772156649
        return 2.0 * (math.log(n - 1) + 0.5772156649) - (2.0 * (n - 1) / n)

class NumpyIsolationForest:
    def __init__(self, n_estimators: int = 64, max_samples: int = 256, contamination: float = 0.05):
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.contamination = contamination
        self.trees: List[IsolationTree] = []
        self.c_factor = 1.0

    def fit(self, X: np.ndarray):
        n_samples = X.shape[0]
        subsample_size = min(self.max_samples, n_samples)
        max_depth = int(math.ceil(math.log2(max(subsample_size, 2))))
        self.c_factor = IsolationTree._c(subsample_size)
        self.trees = []

        for _ in range(self.n_estimators):
            idx = np.random.choice(n_samples, subsample_size, replace=False)
            tree = IsolationTree(max_depth=max_depth)
            tree.root = tree.fit(X[idx])
            self.trees.append(tree)

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        # Average path length
        path_lengths = np.zeros(X.shape[0])
        for x_idx, x in enumerate(X):
            total_len = sum(t.path_length(x, t.root) for t in self.trees)
            path_lengths[x_idx] = total_len / len(self.trees)
        
        # Anomaly score s = 2^(-E(h)/c)
        # Score ~ 1 is anomaly, ~ 0.5 is normal, < 0.5 is definite inlier
        scores = 2.0 ** (-path_lengths / max(self.c_factor, 0.001))
        # Return centered decision value where negative is anomaly (analogous to sklearn)
        return 0.55 - scores

class IsoForestDetector:
    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = None
        self.using_native_sklearn = False
        self._init_model()

    def _init_model(self):
        try:
            from sklearn.ensemble import IsolationForest
            self.model = IsolationForest(
                n_estimators=100,
                contamination=self.contamination,
                random_state=42
            )
            self.using_native_sklearn = True
        except Exception:
            # Fallback to pure vectorized NumPy implementation
            self.model = NumpyIsolationForest(
                n_estimators=64,
                max_samples=256,
                contamination=self.contamination
            )
            self.using_native_sklearn = False

        self._bootstrap_model()

    def _bootstrap_model(self):
        np.random.seed(42)
        n_samples = 1500
        temps = np.random.normal(29.0, 5.0, n_samples)
        rhs = np.clip(np.random.normal(65.0, 15.0, n_samples), 15.0, 98.0)
        pressures = np.random.normal(1008.0, 6.0, n_samples)
        rates_t = np.random.normal(0.0, 0.6, n_samples)
        rates_rh = np.random.normal(0.0, 2.0, n_samples)

        X = np.column_stack([temps, rhs, pressures, rates_t, rates_rh])
        self.model.fit(X)

    def predict(self, observation: Dict[str, Any], delta_temp: float = 0.0, delta_rh: float = 0.0) -> Dict[str, Any]:
        temp = observation.get("temperature", 28.0) or 28.0
        rh = observation.get("relative_humidity", 65.0) or 65.0
        press = observation.get("atmospheric_pressure", 1008.0) or 1008.0

        vec = np.array([[temp, rh, press, delta_temp, delta_rh]])
        
        raw_score = float(self.model.decision_function(vec)[0])
        # In this scale, negative score means anomalous
        is_anomaly = bool(raw_score < -0.04)
        
        normalized_score = float(np.clip((raw_score + 0.20) / 0.35 * 100.0, 5.0, 99.0))

        evidence = None
        if is_anomaly:
            evidence = {
                "type": "ISOLATION_FOREST",
                "description": f"Isolation Forest decision boundary breached: Anomaly score {raw_score:.3f} indicates isolated multi-dimensional subspace partitioning",
                "score": round(max(70.0, 100.0 - normalized_score), 1)
            }

        return {
            "is_anomaly": is_anomaly,
            "raw_score": round(raw_score, 4),
            "ml_score": round(normalized_score, 1),
            "engine": "Scikit-Learn" if self.using_native_sklearn else "NumPy-Vectorized-IForest",
            "evidence": evidence
        }
