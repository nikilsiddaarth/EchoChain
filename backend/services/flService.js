/**
 * flService.js - HTTP Client Service for Python Federated Learning Microservice.
 * Communicates exclusively with the Python service over HTTP.
 * Contains NO blockchain logic (clean service separation).
 */

const FL_SERVICE_URL = process.env.FL_SERVICE_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}, timeoutMs = 10000) {
    const url = `${FL_SERVICE_URL}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

        clearTimeout(timeout);

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const errorMsg = (typeof data === "object" && data?.detail)
                ? data.detail
                : `Python FL service returned HTTP ${response.status}`;
            const error = new Error(errorMsg);
            error.statusCode = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
            const timeoutError = new Error(`FL service request timed out after ${timeoutMs}ms: ${endpoint}`);
            timeoutError.statusCode = 504;
            throw timeoutError;
        }
        if (err.code === "ECONNREFUSED" || err.message?.includes("fetch failed")) {
            const connError = new Error(`Cannot connect to Python FL service at ${FL_SERVICE_URL}. Is it running on port 8000?`);
            connError.statusCode = 503;
            throw connError;
        }
        throw err;
    }
}

async function fetchStatus() {
    return await request("/api/status", { method: "GET" }, 10000);
}

async function fetchClients() {
    return await request("/api/clients", { method: "GET" }, 10000);
}

async function fetchAuditLog() {
    return await request("/api/audit-log", { method: "GET" }, 10000);
}

async function fetchBlockchainInfo() {
    return await request("/api/blockchain", { method: "GET" }, 10000);
}

async function submitPrediction(predictionData) {
    return await request("/api/predict", {
        method: "POST",
        body: JSON.stringify(predictionData)
    }, 15000);
}

async function executeTraining(rounds = 10) {
    return await request("/api/train", {
        method: "POST",
        body: JSON.stringify({ rounds: Number(rounds) })
    }, 120000);
}

module.exports = {
    FL_SERVICE_URL,
    fetchStatus,
    fetchClients,
    fetchAuditLog,
    fetchBlockchainInfo,
    submitPrediction,
    executeTraining
};
