"""
server.py - Standalone FastAPI Microservice for Legal Evidence Federated Learning.

Provides REST API endpoints for:
- System overview and health status (/api/status)
- Simulated client node states (/api/clients)
- Federated learning training execution (/api/train)
- Audit log reading from fl_audit_log.json (/api/audit-log)
- Synthetic forensic record prediction (/api/predict)
- Blockchain notarization readiness status (/api/blockchain)
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import fl_engine

app = FastAPI(
    title="EchoChain Federated Learning Microservice",
    description="Federated Learning backend with FedAvg aggregation and SHA-256 model integrity hashing.",
    version="1.0.0"
)

# Enable CORS for local integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOG_PATH = os.path.join(os.path.dirname(__file__), "fl_audit_log.json")


class PredictionRequest(BaseModel):
    metadata_changed: int = Field(..., ge=0, le=1, description="1 if file metadata was modified, else 0")
    hash_matches: int = Field(..., ge=0, le=1, description="1 if file hash matches original evidence, else 0")
    size_change_ratio: float = Field(..., ge=0.0, le=2.0, description="Size alteration ratio (0.0 to 2.0)")
    unusual_access: int = Field(..., ge=0, le=1, description="1 if accessed outside authorized shift, else 0")


class TrainRequest(BaseModel):
    rounds: int = Field(default=10, ge=1, le=25, description="Number of federated learning rounds")


@app.get("/")
def root():
    """Root health-check endpoint."""
    return {
        "service": "EchoChain Federated Learning Microservice",
        "status": "online",
        "port": 8000,
        "binding": "127.0.0.1"
    }


@app.get("/api/status")
def get_status():
    """Returns overview metrics for the dashboard cards."""
    log = fl_engine.load_audit_log(LOG_PATH)
    latest_entry = log[-1] if log else None

    return {
        "system_name": "Legal Evidence FL Management System",
        "clients_count": 2,
        "current_round": latest_entry["round"] if latest_entry else 0,
        "test_accuracy": latest_entry["test_accuracy"] if latest_entry else 0.0,
        "latest_model_hash": latest_entry["model_hash"] if latest_entry else "Not yet generated",
        "total_training_records": 600,
        "aggregation_algorithm": "FedAvg (Weighted Sample Averaging)",
        "blockchain_status": "Ready for Notarization (Integration Pending)",
        "synthetic_data_only": True
    }


@app.get("/api/clients")
def get_clients():
    """Returns metadata for the two simulated forensic department clients."""
    return {
        "clients": fl_engine.get_clients_info(),
        "total_clients": 2,
        "privacy_protocol": "Raw forensic records are kept strictly on-premises; only gradients and sample counts are transmitted to the server."
    }


@app.get("/api/audit-log")
def get_audit_log():
    """Returns training history from fl_audit_log.json."""
    records = fl_engine.load_audit_log(LOG_PATH)
    return {
        "total_records": len(records),
        "records": records
    }


@app.post("/api/train")
def run_training(req: TrainRequest = TrainRequest()):
    """
    Triggers actual Python Federated Learning training across the two clients.
    Updates fl_audit_log.json and returns real round-by-round test accuracy.
    """
    try:
        results = fl_engine.run_federated_training(
            rounds=req.rounds,
            save_to_disk=True,
            audit_filepath=LOG_PATH
        )
        return {
            "success": True,
            "message": f"Successfully executed {req.rounds} rounds of Federated Averaging.",
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


@app.post("/api/predict")
def predict_evidence(req: PredictionRequest):
    """
    Evaluates synthetic evidence metadata using the trained global model.
    """
    log = fl_engine.load_audit_log(LOG_PATH)
    if not log:
        fl_engine.run_federated_training(rounds=10, save_to_disk=True, audit_filepath=LOG_PATH)

    res = fl_engine.run_federated_training(rounds=10, save_to_disk=False)
    weights = res["final_weights"]
    bias = res["final_bias"]

    result = fl_engine.predict_sample(
        weights=weights,
        bias=bias,
        metadata_changed=req.metadata_changed,
        hash_matches=req.hash_matches,
        size_change_ratio=req.size_change_ratio,
        unusual_access=req.unusual_access
    )

    return {
        "inputs": req.model_dump(),
        "prediction": result,
        "note": "Synthetic demonstration only. Not a validated forensic judgment tool."
    }


@app.get("/api/blockchain")
def get_blockchain_status():
    """
    Provides real SHA-256 model hashes and indicates notarization readiness.
    """
    log = fl_engine.load_audit_log(LOG_PATH)
    hashes = [
        {
            "round": entry["round"],
            "model_hash": entry["model_hash"],
            "accuracy": entry["test_accuracy"],
            "on_chain_status": "PENDING (Ready for Notarization)",
            "transaction_hash": None
        }
        for entry in log
    ]

    return {
        "integration_status": "PENDING_ON_CHAIN_NOTARIZATION",
        "description": "Model hashes are generated using cryptographic SHA-256 digests of FedAvg model weights. These fingerprints ensure tamper-evident audit trails when notarized on-chain by the blockchain team.",
        "partner_contract_target": "EchoChain.sol / Polygon / Ethereum Testnet",
        "total_queued_hashes": len(hashes),
        "queued_hashes": hashes,
        "academic_disclosure": "No dummy or fabricated blockchain transactions are generated. Integration with the teammates' smart contract repository will occur during stage 2."
    }


if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
