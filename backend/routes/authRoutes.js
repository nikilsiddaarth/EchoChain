const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
    register,
    login
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/me", authenticateToken, (req, res) => {
    res.json({
        message: "Authenticated user",
        user: req.user
    });
});

module.exports = router;