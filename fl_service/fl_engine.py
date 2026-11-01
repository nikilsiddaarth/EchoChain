"""
fl_engine.py - Federated Learning Engine for Legal Evidence Management System.

This module provides the core Federated Learning algorithms:
1. Synthetic forensic metadata generation (educational simulation).
2. Local training with gradient descent for individual forensic departments.
3. Central FedAvg (Federated Averaging) aggregation.
4. SHA-256 fingerprinting of global model parameters for blockchain notarization.
"""

import json
import hashlib
import numpy as np


def create_forensic_data(samples: int, seed: int):
    """
    Generate synthetic forensic metadata, not real evidence.

    Features generated:
    - Feature 0: metadata_changed (0 or 1)
    - Feature 1: hash_matches (0 or 1)
    - Feature 2: size_change (float 0.0 to 1.0)
    - Feature 3: unusual_access (0 or 1)
    """
    rng = np.random.default_rng(seed)

    metadata_changed = rng.integers(0, 2, samples)
    hash_matches = rng.integers(0, 2, samples)
    size_change = rng.random(samples)
    unusual_access = rng.integers(0, 2, samples)

    X = np.column_stack([
        metadata_changed,
        hash_matches,
        size_change,
        unusual_access,
    ]).astype(float)

    # Illustrative rule for synthetic labels:
    # Tampering score is higher if metadata changed, hash does NOT match,
    # size ratio is altered, or access time is unusual.
    score = (
        1.7 * metadata_changed
        + 3.2 * (1 - hash_matches)
        + 1.2 * size_change
        + 1.4 * unusual_access
        - 2.5
    )

    y = (score > 0).astype(float)

    # Add 5% noise to make the dataset realistic
    noise = rng.random(samples) < 0.05
    y[noise] = 1 - y[noise]

    return X, y


def sigmoid(z):
    """Numerically stable sigmoid activation."""
    z = np.clip(z, -30, 30)
    return 1 / (1 + np.exp(-z))


def train_locally(X, y, weights, bias, epochs=5, lr=0.5):
    """
    Train a logistic regression model on one client's local data
    without exposing raw records to the central aggregator.
    """
    weights = weights.copy()
    bias = float(bias)

    for _ in range(epochs):
        predictions = sigmoid(X @ weights + bias)
        error = predictions - y

        grad_w = X.T @ error / len(y)
        grad_b = np.mean(error)

        weights -= lr * grad_w
        bias -= lr * grad_b

    return weights, bias


def accuracy(X, y, weights, bias):
    """Compute classification accuracy given model weights and bias."""
    predictions = (sigmoid(X @ weights + bias) >= 0.5).astype(float)
    return float(np.mean(predictions == y))


def compute_model_hash(weights, bias) -> str:
    """
    Generate a SHA-256 cryptographic digest of the global model parameters.
    This hash can be anchored onto a blockchain ledger for tamper-evident auditing.
    """
    model_bytes = (
        np.asarray(weights, dtype=np.float64).tobytes()
        + np.float64(bias).tobytes()
    )
    return hashlib.sha256(model_bytes).hexdigest()


def get_clients_info():
    """
    Return descriptive metadata for the simulated forensic clients.
    """
    return [
        {
            "id": "client_a",
            "name": "Forensic Department A",
            "subdivision": "Cyber Forensics & Mobile Analysis Lab",
            "sample_count": 300,
            "status": "Online / Ready",
            "seed": 10,
            "data_privacy": "Local raw records isolated. Only weights and record counts shared."
        },
        {
            "id": "client_b",
            "name": "Forensic Department B",
            "subdivision": "Digital Evidence Bureau & Cloud Notary",
            "sample_count": 300,
            "status": "Online / Ready",
            "seed": 20,
            "data_privacy": "Local raw records isolated. Only weights and record counts shared."
        }
    ]


def load_audit_log(filepath="fl_audit_log.json"):
    """Read the existing audit log JSON file."""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_audit_log(audit_log, filepath="fl_audit_log.json"):
    """Write audit log entries to the JSON file."""
    with open(filepath, "w") as f:
        json.dump(audit_log, f, indent=4)


def run_federated_training(
    rounds=10,
    client_a_samples=300,
    client_b_samples=300,
    test_samples=300,
    save_to_disk=True,
    audit_filepath="fl_audit_log.json"
):
    """
    Executes actual Federated Learning across the two simulated departments.
    Performs local training on client nodes and FedAvg aggregation on the server.
    """
    # 1. Generate client datasets
    X_a, y_a = create_forensic_data(client_a_samples, seed=10)
    X_b, y_b = create_forensic_data(client_b_samples, seed=20)
    X_test, y_test = create_forensic_data(test_samples, seed=99)

    # 2. Global model initialization
    global_weights = np.zeros(X_a.shape[1], dtype=float)
    global_bias = 0.0

    clients = [(X_a, y_a), (X_b, y_b)]
    rounds_history = []

    for round_num in range(1, rounds + 1):
        client_updates = []

        # Local training step on each department's private data
        for X_client, y_client in clients:
            local_weights, local_bias = train_locally(
                X_client,
                y_client,
                global_weights,
                global_bias
            )
            client_updates.append((local_weights, local_bias, len(y_client)))

        # Server FedAvg aggregation (sample-weighted average)
        total_samples = sum(u[2] for u in client_updates)
        global_weights = sum(w * count for w, _, count in client_updates) / total_samples
        global_bias = sum(b * count for _, b, count in client_updates) / total_samples

        # Evaluate on the hold-out test set
        score = accuracy(X_test, y_test, global_weights, global_bias)
        model_hash = compute_model_hash(global_weights, global_bias)

        round_entry = {
            "round": round_num,
            "clients": len(clients),
            "training_records": len(y_a) + len(y_b),
            "test_accuracy": round(float(score), 4),
            "model_hash": model_hash
        }
        rounds_history.append(round_entry)

    # Persist audit log
    if save_to_disk:
        save_audit_log(rounds_history, audit_filepath)

    final_accuracy = accuracy(X_test, y_test, global_weights, global_bias)

    # Sample test inference
    sample_record = np.array([[1.0, 0.0, 0.8, 1.0]], dtype=float)
    prob = float(sigmoid(sample_record @ global_weights + global_bias)[0])
    label = "SUSPICIOUS" if prob >= 0.5 else "NORMAL"

    return {
        "rounds": rounds_history,
        "final_weights": [round(float(w), 4) for w in global_weights],
        "final_bias": round(float(global_bias), 4),
        "final_accuracy": round(final_accuracy, 4),
        "latest_model_hash": compute_model_hash(global_weights, global_bias),
        "sample_prediction": {
            "inputs": {
                "metadata_changed": 1,
                "hash_matches": 0,
                "size_change_ratio": 0.8,
                "unusual_access": 1
            },
            "probability": round(prob, 4),
            "label": label
        }
    }


def predict_sample(weights, bias, metadata_changed, hash_matches, size_change_ratio, unusual_access):
    """Run inference for a single synthetic forensic record."""
    w = np.array(weights, dtype=float)
    b = float(bias)
    X = np.array([[float(metadata_changed), float(hash_matches), float(size_change_ratio), float(unusual_access)]])
    prob = float(sigmoid(X @ w + b)[0])
    label = "SUSPICIOUS" if prob >= 0.5 else "NORMAL"
    return {
        "probability": round(prob, 4),
        "probability_percent": round(prob * 100, 2),
        "label": label
    }
