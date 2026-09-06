const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { MongoClient } = require("mongodb");
const authRoutes = require("./routes/authRoutes");
const caseRoutes = require("./routes/caseRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");

console.log("Encryption secret loaded:", !!process.env.ENCRYPTION_SECRET);

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

async function startServer() {
    try {
        await client.connect();

        const db = client.db(process.env.DB_NAME);

        app.locals.db = db;

        console.log("MongoDB Atlas connected successfully");
        console.log(`Database: ${process.env.DB_NAME}`);

        app.get("/", (req, res) => {
            res.json({
                message: "Echo Chain Backend is running",
                database: process.env.DB_NAME
            });
        });

        app.use("/api/auth", authRoutes);
        app.use("/api/cases", caseRoutes);
        app.use("/api/evidence", evidenceRoutes);

        const PORT = 5000;

        app.listen(PORT, () => {
            console.log(
                `Echo Chain backend running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("MongoDB connection failed");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();