/**
 * flController.js - Controller for Federated Learning endpoints.
 * Orchestrates Python FL service communication, in-memory background training jobs,
 * strict input validation, job ownership enforcement, and secure blockchain verification & notarization.
 */

const crypto = require("crypto");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const flService = require("../services/flService");
const { recordEcho, getEchoHistory } = require("../services/blockchainService");

// In-Memory Background Job Store
// Map<jobId, { id, status: 'QUEUED'|'RUNNING'|'COMPLETED'|'FAILED', rounds, requestedBy, createdAt, startedAt, completedAt, result, error }>
const jobs = new Map();

// Independent In-Flight Notarization Locks to prevent concurrent duplicate submissions
const activeRoundLocks = new Set();
const activeHashLocks = new Set();

/**
 * Diagnostic helper: verifies the blockchain provider, RPC connectivity,
 * chain ID matching against configured expected chain ID, deployed bytecode at contract address,
 * and required ABI methods.
 */
async function verifyBlockchainState() {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const contractAddress = process.env.ECHO_CHAIN_CONTRACT_ADDRESS;
    // Explicitly require EXPECTED_CHAIN_ID from environment. No silent default.
    const expectedChainId = process.env.EXPECTED_CHAIN_ID ? process.env.EXPECTED_CHAIN_ID.trim() : "";

    if (!rpcUrl || !contractAddress) {
        return {
            configured: false,
            online: false,
            chainIdMatch: false,
            bytecodePresent: false,
            message: "Missing BLOCKCHAIN_RPC_URL or ECHO_CHAIN_CONTRACT_ADDRESS in environment."
        };
    }

    if (!expectedChainId) {
        return {
            configured: false,
            online: false,
            chainIdMatch: false,
            bytecodePresent: false,
            message: "Missing expected chain ID configuration (EXPECTED_CHAIN_ID is unset or empty)."
        };
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await Promise.race([
            provider.getNetwork(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("RPC ping timeout")), 3000))
        ]);

        const connectedChainId = network.chainId.toString();
        const chainIdMatch = connectedChainId === String(expectedChainId);

        if (!chainIdMatch) {
            return {
                configured: true,
                online: true,
                chainId: connectedChainId,
                expectedChainId: String(expectedChainId),
                chainIdMatch: false,
                contractAddress,
                bytecodePresent: false,
                message: `Chain ID mismatch: connected to chain ID ${connectedChainId}, but expected chain ID is ${expectedChainId}.`
            };
        }

        const code = await provider.getCode(contractAddress);
        const hasBytecode = code && code !== "0x" && code.length > 2;

        return {
            configured: true,
            online: true,
            chainId: connectedChainId,
            expectedChainId: String(expectedChainId),
            chainIdMatch: true,
            contractAddress,
            bytecodePresent: hasBytecode,
            bytecodeLength: hasBytecode ? (code.length - 2) / 2 : 0,
            message: hasBytecode
                ? `Blockchain provider online, chain ID ${connectedChainId} verified, and contract verified.`
                : `Connected to RPC (chain ID ${connectedChainId}), but NO contract bytecode is deployed at ${contractAddress}.`
        };
    } catch (err) {
        return {
            configured: true,
            online: false,
            expectedChainId: String(expectedChainId),
            chainIdMatch: false,
            contractAddress,
            bytecodePresent: false,
            error: err.shortMessage || err.message,
            message: `Blockchain RPC node at ${rpcUrl} is offline or unreachable.`
        };
    }
}

/**
 * GET /api/fl/status
 */
async function getStatus(req, res) {
    try {
        const status = await flService.fetchStatus();
        return res.json({
            success: true,
            data: status
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * GET /api/fl/clients
 */
async function getClients(req, res) {
    try {
        const clients = await flService.fetchClients();
        return res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * GET /api/fl/audit-log
 */
async function getAuditLog(req, res) {
    try {
        const auditLog = await flService.fetchAuditLog();
        return res.json({
            success: true,
            total_records: auditLog.total_records || (auditLog.records ? auditLog.records.length : 0),
            records: auditLog.records || []
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * GET /api/fl/blockchain
 * Combines FL audit log hashes with real-time verification of the configured blockchain network, chain ID, and contract.
 */
async function getBlockchainStatus(req, res) {
    try {
        const [flBlockchain, chainVerify] = await Promise.all([
            flService.fetchBlockchainInfo().catch(e => ({ error: e.message })),
            verifyBlockchainState()
        ]);

        return res.json({
            success: true,
            blockchain_verification: chainVerify,
            integration_status: (chainVerify.bytecodePresent && chainVerify.chainIdMatch)
                ? "READY_FOR_NOTARIZATION"
                : "PENDING_BLOCKCHAIN_NODE",
            total_queued_hashes: flBlockchain.total_queued_hashes || 0,
            queued_hashes: flBlockchain.queued_hashes || []
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * POST /api/fl/predict
 */
async function predictEvidence(req, res) {
    try {
        const { metadata_changed, hash_matches, size_change_ratio, unusual_access } = req.body;

        if (
            (metadata_changed !== 0 && metadata_changed !== 1) ||
            (hash_matches !== 0 && hash_matches !== 1) ||
            typeof size_change_ratio !== "number" ||
            size_change_ratio < 0 ||
            size_change_ratio > 2.0 ||
            (unusual_access !== 0 && unusual_access !== 1)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid prediction input. Expected: metadata_changed (0/1), hash_matches (0/1), size_change_ratio (0.0-2.0), unusual_access (0/1)."
            });
        }

        const prediction = await flService.submitPrediction({
            metadata_changed: Number(metadata_changed),
            hash_matches: Number(hash_matches),
            size_change_ratio: Number(size_change_ratio),
            unusual_access: Number(unusual_access)
        });

        return res.json({
            success: true,
            data: prediction
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * POST /api/fl/train
 * Asynchronous background training launcher.
 * Responds immediately with HTTP 202 Accepted and a unique jobId.
 */
async function startTraining(req, res) {
    try {
        let rounds = req.body.rounds !== undefined ? req.body.rounds : 10;
        rounds = Number(rounds);

        if (!Number.isInteger(rounds) || rounds < 1 || rounds > 25) {
            return res.status(400).json({
                success: false,
                message: "Invalid rounds parameter. Must be an integer between 1 and 25."
            });
        }

        const jobId = crypto.randomUUID();
        const job = {
            id: jobId,
            status: "QUEUED",
            rounds,
            requestedBy: req.user ? {
                id: req.user.id || req.user._id,
                email: req.user.email,
                role: req.user.role
            } : null,
            createdAt: new Date().toISOString(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null
        };

        jobs.set(jobId, job);

        // Run background training asynchronously
        setImmediate(async () => {
            job.status = "RUNNING";
            job.startedAt = new Date().toISOString();

            try {
                const trainingResult = await flService.executeTraining(rounds);
                job.status = "COMPLETED";
                job.completedAt = new Date().toISOString();
                job.result = trainingResult;
            } catch (err) {
                job.status = "FAILED";
                job.completedAt = new Date().toISOString();
                job.error = err.message || "Training job failed";
            }
        });

        return res.status(202).json({
            success: true,
            message: `Federated learning training job queued with ${rounds} rounds.`,
            jobId,
            status: "QUEUED",
            statusUrl: `/api/fl/jobs/${jobId}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

/**
 * GET /api/fl/jobs/:jobId
 * Poll status of background training job.
 * Ownership enforcement:
 * - The job creator can poll their own job.
 * - Users with the existing "Judge" role can poll all jobs.
 * - Other users receive 404 Not Found.
 */
async function getJobStatus(req, res) {
    const { jobId } = req.params;

    if (!jobId || !jobs.has(jobId)) {
        return res.status(404).json({
            success: false,
            message: `Job ID '${jobId}' not found.`
        });
    }

    const job = jobs.get(jobId);
    const currentUser = req.user;

    // Check ownership or Judge role
    const isOwner = currentUser && job.requestedBy && (
        (currentUser.id && currentUser.id === job.requestedBy.id) ||
        (currentUser.email && currentUser.email === job.requestedBy.email)
    );
    const isJudge = currentUser && currentUser.role === "Judge";

    if (!isOwner && !isJudge) {
        return res.status(404).json({
            success: false,
            message: `Job ID '${jobId}' not found.`
        });
    }

    return res.json({
        success: true,
        job: {
            id: job.id,
            status: job.status,
            rounds: job.rounds,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            result: job.result,
            error: job.error
        }
    });
}

/**
 * POST /api/fl/notarize
 * Secure blockchain notarization of a verified FL round hash.
 * 1. Checks user authorization (Lawyer or Forensic Expert via route middleware).
 * 2. Pulls trusted hash from fl_audit_log.json (never accepts client-supplied hashes).
 * 3. Checks dual in-flight locks: independent locks on round number AND model hash.
 * 4. Verifies blockchain RPC connectivity, chain ID match, and deployed bytecode.
 * 5. Checks duplicate on-chain history (by evidenceHash and caseId) before submission.
 * 6. Always releases both locks in a finally block on every success/failure path.
 * 7. Submits via existing blockchainService.recordEcho and waits for transaction confirmation.
 */
async function notarizeModelHash(req, res) {
    const { round } = req.body;
    const roundNumber = Number(round);

    if (!Number.isInteger(roundNumber) || roundNumber < 1) {
        return res.status(400).json({
            success: false,
            message: "Valid round number (integer >= 1) is required for notarization."
        });
    }

    // 1. Fetch trusted audit log and locate exact round record
    let auditData;
    try {
        auditData = await flService.fetchAuditLog();
    } catch (e) {
        return res.status(502).json({
            success: false,
            message: `Failed to fetch trusted FL audit log: ${e.message}`
        });
    }

    const records = Array.isArray(auditData.records) ? auditData.records : [];
    const roundRecord = records.find(r => Number(r.round) === roundNumber);

    if (!roundRecord) {
        return res.status(404).json({
            success: false,
            message: `Round ${roundNumber} does not exist in the trusted FL audit log.`
        });
    }

    const trustedModelHash = roundRecord.model_hash;
    if (!trustedModelHash || typeof trustedModelHash !== "string" || trustedModelHash.length !== 64) {
        return res.status(422).json({
            success: false,
            message: `Round ${roundNumber} has an invalid or ambiguous model hash in the audit log.`
        });
    }

    // 2. Independent in-flight locks for round number AND model hash
    if (activeRoundLocks.has(roundNumber)) {
        return res.status(409).json({
            success: false,
            message: `Notarization for Round ${roundNumber} is currently in progress. Please wait.`
        });
    }

    if (activeHashLocks.has(trustedModelHash)) {
        return res.status(409).json({
            success: false,
            message: `Notarization for model hash ${trustedModelHash.slice(0, 16)}... is currently in progress under another round. Please wait.`
        });
    }

    // Acquire both locks
    activeRoundLocks.add(roundNumber);
    activeHashLocks.add(trustedModelHash);

    try {
        // 3. Verify blockchain network, chain ID match, and bytecode
        const chainStatus = await verifyBlockchainState();
        if (!chainStatus.online) {
            return res.status(503).json({
                success: false,
                message: `Cannot notarize: Blockchain RPC is offline. ${chainStatus.message}`
            });
        }
        if (!chainStatus.chainIdMatch) {
            return res.status(503).json({
                success: false,
                message: `Cannot notarize: ${chainStatus.message}`
            });
        }
        if (!chainStatus.bytecodePresent) {
            return res.status(503).json({
                success: false,
                message: `Cannot notarize: No contract bytecode deployed at ${chainStatus.contractAddress}.`
            });
        }

        // 4. Duplicate protection: query existing on-chain history
        const evidenceId = "FL_MODEL_GLOBAL";
        let onChainHistory = [];
        try {
            onChainHistory = await getEchoHistory(evidenceId);
        } catch (e) {
            return res.status(502).json({
                success: false,
                message: `Failed to verify on-chain history: ${e.message}`
            });
        }

        const isDuplicate = Array.isArray(onChainHistory) && onChainHistory.some(echo =>
            echo.evidenceHash === trustedModelHash || echo.caseId === `ROUND_${String(roundNumber).padStart(3, "0")}`
        );

        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                message: `Round ${roundNumber} (hash: ${trustedModelHash.slice(0, 16)}...) has already been notarized on-chain.`
            });
        }

        // 5. Submit transaction and wait for confirmation
        const caseId = `ROUND_${String(roundNumber).padStart(3, "0")}`;
        const action = "FEDAVG_MODEL_NOTARIZATION";
        const actor = req.user.email || req.user.name || "EchoChain-FL-Service";

        const receipt = await recordEcho(
            evidenceId,
            caseId,
            action,
            actor,
            trustedModelHash
        );

        return res.json({
            success: true,
            message: `Round ${roundNumber} model hash successfully notarized on blockchain.`,
            notarization: {
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
                evidenceId,
                caseId,
                action,
                actor,
                modelHash: trustedModelHash,
                round: roundNumber,
                accuracy: roundRecord.test_accuracy
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Blockchain transaction failed: ${error.shortMessage || error.message}`
        });
    } finally {
        // Release both locks on EVERY success and failure path
        activeRoundLocks.delete(roundNumber);
        activeHashLocks.delete(trustedModelHash);
    }
}

module.exports = {
    getStatus,
    getClients,
    getAuditLog,
    getBlockchainStatus,
    predictEvidence,
    startTraining,
    getJobStatus,
    notarizeModelHash,
    verifyBlockchainState,
    // Exported for testing safeguards
    activeRoundLocks,
    activeHashLocks,
    jobs
};
