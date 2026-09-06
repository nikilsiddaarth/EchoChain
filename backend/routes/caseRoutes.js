const express = require("express");

const {
    createCase,
    getCases,
    getCaseById
} = require("../controllers/caseController");

const {
    authenticateToken,
    requireRole
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    requireRole("Lawyer"),
    createCase
);

router.get(
    "/",
    authenticateToken,
    getCases
);

router.get(
    "/:id",
    authenticateToken,
    getCaseById
);

module.exports = router;