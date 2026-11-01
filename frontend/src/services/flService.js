/**
 * flService.js - Frontend API client for Federated Learning endpoints.
 * Communicates with the Node.js Express backend at http://localhost:5000/api/fl.
 * Reuses the existing EchoChain authentication token and formats errors cleanly.
 */

const API_BASE = "http://localhost:5000/api/fl";

function getAuthHeaders() {
    const token = localStorage.getItem("echoChainToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}

async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

/**
 * GET /api/fl/status
 * Returns: { success: true, data: { system_name, clients_count, current_round, test_accuracy, latest_model_hash, ... } }
 */
export async function getFLStatus() {
    return await request("/status");
}

/**
 * GET /api/fl/clients
 * Returns: { success: true, data: { clients: [...], total_clients, privacy_protocol } }
 */
export async function getFLClients() {
    return await request("/clients");
}

/**
 * GET /api/fl/audit-log
 * Returns: { success: true, total_records, records: [ { round, clients, training_records, test_accuracy, model_hash } ] }
 */
export async function getFLAuditLog() {
    return await request("/audit-log");
}

/**
 * GET /api/fl/blockchain
 * Returns: { success: true, blockchain_verification: { online, chainId, expectedChainId, chainIdMatch, bytecodePresent, message, ... }, integration_status, queued_hashes }
 */
export async function getFLBlockchainStatus() {
    return await request("/blockchain");
}

/**
 * POST /api/fl/predict
 * Body: { metadata_changed, hash_matches, size_change_ratio, unusual_access }
 * Returns: { success: true, data: { prediction: { probability, probability_percent, label }, inputs, note } }
 */
export async function predictFLEvidence(predictionData) {
    return await request("/predict", {
        method: "POST",
        body: JSON.stringify(predictionData)
    });
}

/**
 * POST /api/fl/train
 * Body: { rounds }
 * Returns: { success: true, message, jobId, status: "QUEUED", statusUrl }
 */
export async function startFLTraining(rounds = 10) {
    return await request("/train", {
        method: "POST",
        body: JSON.stringify({ rounds: Number(rounds) })
    });
}

/**
 * GET /api/fl/jobs/:jobId
 * Returns: { success: true, job: { id, status, rounds, createdAt, startedAt, completedAt, result, error } }
 */
export async function getFLJobStatus(jobId) {
    return await request(`/jobs/${jobId}`);
}

/**
 * POST /api/fl/notarize
 * Body: { round }
 * Returns: { success: true, message, notarization: { transactionHash, blockNumber, round, modelHash, ... } }
 */
export async function notarizeFLRound(round) {
    return await request("/notarize", {
        method: "POST",
        body: JSON.stringify({ round: Number(round) })
    });
}
