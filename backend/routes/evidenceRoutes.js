const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    uploadEvidence,
    getEvidence,
    getEchoHistory,
    grantEvidenceAccess,
    accessEvidence,
    verifyEvidence,
    addForensicReport,
    getForensicReport,
    submitEvidenceToCourt
} = require("../controllers/evidenceController");   

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const router = express.Router();

const upload = multer({
    dest: path.join(__dirname, "..", "storage")
});

router.get(
    "/",
    authenticateToken,
    getEvidence
);

router.post(
    "/upload",
    authenticateToken,
    upload.single("evidence"),
    uploadEvidence
);

router.get(
    "/:evidenceId/access",
    authenticateToken,
    accessEvidence
);

router.get(
    "/:evidenceId/history",
    authenticateToken,
    getEchoHistory
);

router.post(
    "/:evidenceId/grant-access",
    authenticateToken,
    grantEvidenceAccess
);

router.post(
    "/:evidenceId/report",
    authenticateToken,
    addForensicReport
);

router.post(
    "/:evidenceId/submit",
    authenticateToken,
    submitEvidenceToCourt
);

router.get(
    "/:evidenceId/verify",
    authenticateToken,
    verifyEvidence
);

router.post(
    "/:evidenceId/report",
    authenticateToken,
    addForensicReport
);

router.get(
    "/:evidenceId/report",
    authenticateToken,
    getForensicReport
);

module.exports = router;