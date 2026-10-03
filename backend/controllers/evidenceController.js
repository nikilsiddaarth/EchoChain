const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const {
    recordEcho,
    getEchoHistory: getEchoHistoryFromBlockchain
} = require("../services/blockchainService");

const ENCRYPTION_KEY = crypto
    .createHash("sha256")
    .update(process.env.ENCRYPTION_SECRET)
    .digest();

function encryptFile(inputPath, outputPath) {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        ENCRYPTION_KEY,
        iv
    );

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    output.write(iv);

    input.pipe(cipher).pipe(output);

    return new Promise((resolve, reject) => {
        output.on("finish", resolve);
        output.on("error", reject);
        input.on("error", reject);
    });
}

async function uploadEvidence(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Evidence file is required"
            });
        }

        const { caseId } = req.body;

        if (!caseId) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Case ID is required"
            });
        }

        if (!ObjectId.isValid(caseId)) {
            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                message: "Invalid case ID"
            });
        }

        const cases = req.app.locals.db.collection("cases");

        const caseData = await cases.findOne({
            _id: new ObjectId(caseId)
        });

        if (!caseData) {
            fs.unlinkSync(req.file.path);

            return res.status(404).json({
                message: "Case not found"
            });
        }

        if (
            req.user.role === "Lawyer" &&
            caseData.createdBy !== req.user.userId
        ) {
            fs.unlinkSync(req.file.path);

            return res.status(403).json({
                message: "You do not have access to this case"
            });
        }

        const fileBuffer = fs.readFileSync(req.file.path);

        const hash = crypto
            .createHash("sha256")
            .update(fileBuffer)
            .digest("hex");

        const evidenceId = new ObjectId();

        const encryptedFileName =
            `${evidenceId.toString()}.enc`;

        const encryptedPath = path.join(
            __dirname,
            "..",
            "storage",
            encryptedFileName
        );

        await encryptFile(
            req.file.path,
            encryptedPath
        );

        fs.unlinkSync(req.file.path);

        const evidence = {
            _id: evidenceId,
            caseId: new ObjectId(caseId),
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            encryptedFile: encryptedFileName,
            hash,
            uploadedBy: req.user.userId,
            uploadedByRole: req.user.role,
            uploadedAt: new Date()
        };

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        await evidenceCollection.insertOne(evidence);


        const blockchainRecord = await recordEcho(
            evidenceId.toString(),
            caseId,
            "CREATED",
            req.user.name,
            hash
        );

        res.status(201).json({
            message: "Evidence uploaded successfully",
            evidence: {
                id: evidenceId,
                caseId: evidence.caseId,
                fileName: evidence.fileName,
                fileType: evidence.fileType,
                hash: evidence.hash,
                uploadedBy: evidence.uploadedBy,
                uploadedAt: evidence.uploadedAt,
                blockchain: blockchainRecord
            }
        });
    } catch (error) {
        console.error(error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            message: "Evidence upload failed"
        });
    }
}

async function getEchoHistory(req, res) {
    try {
        const { evidenceId } = req.params;

        if (!evidenceId) {
            return res.status(400).json({
                message: "Evidence ID is required"
            });
        }

        const history = await getEchoHistoryFromBlockchain(
            evidenceId
        );

        const formattedHistory = history.map((echo) => ({
            evidenceId: echo.evidenceId,
            caseId: echo.caseId,
            action: echo.action,
            actor: echo.actor,
            evidenceHash: echo.evidenceHash,
            timestamp: echo.timestamp.toString(),
            previousEcho: echo.previousEcho,
            echoHash: echo.echoHash
        }));

        res.json({
            message: "Echo history retrieved successfully",
            evidenceId,
            history: formattedHistory
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve Echo history"
        });
    }
}

async function grantEvidenceAccess(req, res) {  
    try {
        const { evidenceId } = req.params;
        const { userId, permission } = req.body;

        if (req.user.role !== "Lawyer") {
            return res.status(403).json({
                message: "Only lawyers can grant evidence access"
            });
        }

        if (!evidenceId || !userId || !permission) {
            return res.status(400).json({
                message: "Evidence ID, user ID and permission are required"
            });
        }

        if (permission !== "VIEW") {
            return res.status(400).json({
                message: "Invalid permission"
            });
        }

        if (!ObjectId.isValid(evidenceId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid evidence ID or user ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        const cases = req.app.locals.db.collection("cases");

        const caseData = await cases.findOne({
            _id: evidence.caseId
        });

        if (!caseData) {
            return res.status(404).json({
                message: "Associated case not found"
            });
        }

        if (caseData.createdBy !== req.user.userId) {
            return res.status(403).json({
                message: "You do not have access to this case"
            });
        }

        const users =
            req.app.locals.db.collection("users");

        const user = await users.findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (
            user.role !== "Forensic Expert" &&
            user.role !== "Judge"
        ) {
            return res.status(400).json({
                message: "Evidence access can only be granted to authorized case roles"
                });
        }

        const permissions =
            req.app.locals.db.collection("accessPermissions");

        const existingPermission = await permissions.findOne({
            evidenceId: new ObjectId(evidenceId),
            userId: new ObjectId(userId),
            permission: "VIEW"
        });

        if (existingPermission) {
            return res.status(409).json({
                message: "Evidence access already granted to this user"
            });
        }



        const accessRecord = {
            evidenceId: new ObjectId(evidenceId),
            userId: new ObjectId(userId),
            grantedBy: req.user.userId,
            permission,
            grantedAt: new Date()
        };

        await permissions.insertOne(accessRecord);

        const blockchainRecord = await recordEcho(
            evidenceId,
            evidence.caseId.toString(),
            "ACCESS_GRANTED",
            req.user.name,
            evidence.hash
        );

        res.status(201).json({
            message: "Evidence access granted successfully",
            access: {
                evidenceId,
                userId,
                userName: user.name,
                userRole: user.role,
                permission,
                grantedBy: req.user.name,
                grantedAt: accessRecord.grantedAt
            },
            blockchain: blockchainRecord
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to grant evidence access"
        });
    }
}

async function accessEvidence(req, res) {
    try {
        const { evidenceId } = req.params;

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        const permissions =
            req.app.locals.db.collection("accessPermissions");

        const permission = await permissions.findOne({
            evidenceId: new ObjectId(evidenceId),
            userId: new ObjectId(req.user.userId),
            permission: "VIEW"
        });

        const isOwner =
            evidence.uploadedBy === req.user.userId;

        if (!permission && !isOwner) {
            return res.status(403).json({
                message: "You do not have permission to access this evidence"
            });
        }

        const encryptedPath = path.join(
            __dirname,
            "..",
            "storage",
            evidence.encryptedFile
        );

        if (!fs.existsSync(encryptedPath)) {
            return res.status(404).json({
                message: "Encrypted evidence file not found"
            });
        }

        const encryptedData =
            fs.readFileSync(encryptedPath);

        const iv = encryptedData.subarray(0, 16);
        const encryptedContent = encryptedData.subarray(16);

        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            ENCRYPTION_KEY,
            iv
        );

        const decryptedContent = Buffer.concat([
            decipher.update(encryptedContent),
            decipher.final()
        ]);

        await recordEcho(
            evidence._id.toString(),
            evidence.caseId.toString(),
            "ACCESSED",
            req.user.name,
            evidence.hash
        );

        res.setHeader(
            "Content-Type",
            evidence.fileType
        );

        res.setHeader(
            "Content-Disposition",
            `inline; filename="${evidence.fileName}"`
        );

        res.send(decryptedContent);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to access evidence"
        });
    }
}

async function verifyEvidence(req, res) {
    try {
        const { evidenceId } = req.params;

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        const encryptedPath = path.join(
            __dirname,
            "..",
            "storage",
            evidence.encryptedFile
        );

        if (!fs.existsSync(encryptedPath)) {
            return res.status(404).json({
                message: "Evidence file not found"
            });
        }

        const encryptedData =
            fs.readFileSync(encryptedPath);

        const iv = encryptedData.subarray(0, 16);
        const encryptedContent = encryptedData.subarray(16);

        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            ENCRYPTION_KEY,
            iv
        );

        const decryptedContent = Buffer.concat([
            decipher.update(encryptedContent),
            decipher.final()
        ]);

        const currentHash = crypto
            .createHash("sha256")
            .update(decryptedContent)
            .digest("hex");

        const history =
                await getEchoHistoryFromBlockchain(evidenceId);

        const blockchainHash =
            history.length > 0
                ? history[0].evidenceHash
                : null;

        const verified =
            blockchainHash &&
            currentHash === blockchainHash;

        res.json({
            message: verified
                ? "Evidence integrity verified"
                : "Evidence tampering detected",
            evidenceId,
            originalHash: evidence.hash,
            blockchainHash,
            currentHash,
            status: verified
                ? "VERIFIED"
                : "TAMPERING_DETECTED"
            });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Evidence verification failed"
        });
    }
}

async function addForensicReport(req, res) {
    try {
        const { evidenceId } = req.params;
        const { reportTitle, findings, conclusion } = req.body;

        if (req.user.role !== "Forensic Expert") {
            return res.status(403).json({
                message: "Only forensic experts can add forensic reports"
            });
        }

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        if (!reportTitle || !findings || !conclusion) {
            return res.status(400).json({
                message: "Report title, findings and conclusion are required"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        const permissions =
            req.app.locals.db.collection("accessPermissions");

        const permission = await permissions.findOne({
            evidenceId: new ObjectId(evidenceId),
            userId: new ObjectId(req.user.userId),
            permission: "VIEW"
        });

        if (!permission) {
            return res.status(403).json({
                message: "You do not have access to this evidence"
            });
        }

        const reports =
            req.app.locals.db.collection("forensicReports");

        const report = {
            evidenceId: new ObjectId(evidenceId),
            caseId: evidence.caseId,
            reportTitle,
            findings,
            conclusion,
            createdBy: req.user.userId,
            createdByName: req.user.name,
            createdAt: new Date()
        };

        const result = await reports.insertOne(report);

        const blockchainRecord = await recordEcho(
            evidenceId,
            evidence.caseId.toString(),
            "REPORT_ADDED",
            req.user.name,
            evidence.hash
        );

        res.status(201).json({
            message: "Forensic report added successfully",
            report: {
                reportId: result.insertedId,
                evidenceId,
                caseId: evidence.caseId,
                reportTitle,
                findings,
                conclusion,
                createdBy: req.user.name,
                createdAt: report.createdAt
            },
            blockchain: blockchainRecord
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add forensic report"
        });
    }
}

async function getForensicReport(req, res) {
    try {
        const { evidenceId } = req.params;

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const reports =
            req.app.locals.db.collection("forensicReports");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        console.log("LOOKING FOR EVIDENCE ID:", evidenceId);

const allReports = await reports.find({}).toArray();

console.log("FORENSIC REPORTS IN DATABASE:");
console.log(allReports);

        const report = await reports.findOne({
            $or: [
        {
            evidenceId: new ObjectId(evidenceId)
        },
        {
            evidenceId: evidenceId
        }
                ]
        });
         

        if (!report) {
            return res.status(404).json({
                message: "No forensic report found"
            });
        }

        res.json({
            report
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve forensic report"
        });
    }
}

async function submitEvidenceToCourt(req, res) {
    try {
        const { evidenceId } = req.params;

        if (req.user.role !== "Lawyer") {
            return res.status(403).json({
                message: "Only lawyers can submit evidence to court"
            });
        }

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        const cases = req.app.locals.db.collection("cases");

        const caseData = await cases.findOne({
            _id: evidence.caseId
        });

        if (!caseData) {
            return res.status(404).json({
                message: "Associated case not found"
            });
        }

        if (caseData.createdBy !== req.user.userId) {
            return res.status(403).json({
                message: "You do not have access to this case"
            });
        }

        const reports =
            req.app.locals.db.collection("forensicReports");

        const report = await reports.findOne({
            evidenceId: new ObjectId(evidenceId)
        });

        if (!report) {
            return res.status(400).json({
                message: "Forensic report is required before court submission"
            });
        }

        const blockchainRecord = await recordEcho(
            evidenceId,
            evidence.caseId.toString(),
            "SUBMITTED_TO_COURT",
            req.user.name,
            evidence.hash
        );

        res.json({
            message: "Evidence submitted to court successfully",
            evidenceId,
            submittedBy: req.user.name,
            submittedAt: new Date(),
            blockchain: blockchainRecord
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to submit evidence to court"
        });
    }
}

async function getEvidence(req, res) {
    try {
        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const permissionsCollection =
            req.app.locals.db.collection("accessPermissions");

        let evidence;

        if (req.user.role === "Lawyer") {
            evidence = await evidenceCollection
                .find({
                    uploadedBy: req.user.userId
                })
                .sort({ uploadedAt: -1 })
                .toArray();
        } else {
            const permissions =
                await permissionsCollection
                    .find({
                        userId: new ObjectId(req.user.userId),
                        permission: "VIEW"
                    })
                    .toArray();

            const evidenceIds =
                permissions.map(
                    (permission) => permission.evidenceId
                );

            evidence = await evidenceCollection
                .find({
                    _id: {
                        $in: evidenceIds
                    }
                })
                .sort({ uploadedAt: -1 })
                .toArray();
        }

        res.json({
            message: "Evidence retrieved successfully",
            evidence
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve evidence"
        });
    }
}

async function submitEvidenceToCourt(req, res) {
    try {
        const { evidenceId } = req.params;

        if (req.user.role !== "Lawyer") {
            return res.status(403).json({
                message: "Only lawyers can submit evidence to court"
            });
        }

        if (!ObjectId.isValid(evidenceId)) {
            return res.status(400).json({
                message: "Invalid evidence ID"
            });
        }

        const evidenceCollection =
            req.app.locals.db.collection("evidence");

        const evidence = await evidenceCollection.findOne({
            _id: new ObjectId(evidenceId)
        });

        if (!evidence) {
            return res.status(404).json({
                message: "Evidence not found"
            });
        }

        if (evidence.uploadedBy !== req.user.userId) {
            return res.status(403).json({
                message: "You do not have access to this evidence"
            });
        }

        const blockchainRecord = await recordEcho(
            evidenceId,
            evidence.caseId.toString(),
            "SUBMITTED_TO_COURT",
            req.user.name,
            evidence.hash
        );

        res.json({
            message: "Evidence submitted to court successfully",
            evidenceId,
            submittedBy: req.user.name,
            blockchain: blockchainRecord
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to submit evidence to court"
        });
    }
}

module.exports = {
    uploadEvidence,
    getEvidence,
    getEchoHistory,
    grantEvidenceAccess,
    accessEvidence,
    verifyEvidence,
    addForensicReport,
    getForensicReport,
    submitEvidenceToCourt
};