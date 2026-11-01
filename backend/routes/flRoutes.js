/**
 * flRoutes.js - Routes for Federated Learning microservice integration.
 * All routes are protected by EchoChain's standard authenticateToken middleware.
 * Notarization and training actions enforce role permissions.
 */

const express = require("express");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");
const {
    getStatus,
    getClients,
    getAuditLog,
    getBlockchainStatus,
    predictEvidence,
    startTraining,
    getJobStatus,
    notarizeModelHash
} = require("../controllers/flController");

const router = express.Router();

// Read-only FL status and inspect endpoints (accessible to all authenticated users)
router.get("/status", authenticateToken, getStatus);
router.get("/clients", authenticateToken, getClients);
router.get("/audit-log", authenticateToken, getAuditLog);
router.get("/blockchain", authenticateToken, getBlockchainStatus);

// Evidence tampering prediction using global model (authenticated users)
router.post("/predict", authenticateToken, predictEvidence);

// Background training job launcher (Forensic Expert or Lawyer)
router.post("/train", authenticateToken, requireRole("Forensic Expert", "Lawyer"), startTraining);

// Background training job status polling (authenticated users)
router.get("/jobs/:jobId", authenticateToken, getJobStatus);

// Blockchain notarization (Forensic Expert or Lawyer)
router.post("/notarize", authenticateToken, requireRole("Forensic Expert", "Lawyer"), notarizeModelHash);

module.exports = router;
