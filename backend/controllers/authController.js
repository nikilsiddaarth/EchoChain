const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const allowedRoles = [
            "Lawyer",
            "Judge",
            "Forensic Expert"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        const users = req.app.locals.db.collection("users");

        const existingUser = await users.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role,
            createdAt: new Date()
        };

        const result = await users.insertOne(user);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: result.insertedId,
                name,
                email: user.email,
                role
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Registration failed"
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const users = req.app.locals.db.collection("users");

        const user = await users.findOne({
            email: email.toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                name: user.name,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
}

module.exports = {
    register,
    login
};