const { ObjectId } = require("mongodb");

async function createCase(req, res) {
    try {
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                message: "Title and description are required"
            });
        }

        if (req.user.role !== "Lawyer") {
            return res.status(403).json({
                message: "Only lawyers can create cases"
            });
        }

        const cases = req.app.locals.db.collection("cases");

        const newCase = {
            title,
            description,
            createdBy: req.user.userId,
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await cases.insertOne(newCase);

        res.status(201).json({
            message: "Case created successfully",
            case: {
                id: result.insertedId,
                title,
                description,
                createdBy: req.user.userId,
                status: "Active",
                createdAt: newCase.createdAt
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create case"
        });
    }
}

async function getCases(req, res) {
    try {
        const cases = req.app.locals.db.collection("cases");

        const userCases = await cases
            .find({
                createdBy: req.user.userId
            })
            .sort({
                createdAt: -1
            })
            .toArray();

        res.json({
            message: "Cases retrieved successfully",
            cases: userCases
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve cases"
        });
    }
}

async function getCaseById(req, res) {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid case ID"
            });
        }

        const cases = req.app.locals.db.collection("cases");

        const caseData = await cases.findOne({
            _id: new ObjectId(id)
        });

        if (!caseData) {
            return res.status(404).json({
                message: "Case not found"
            });
        }

        if (
            req.user.role === "Lawyer" &&
            caseData.createdBy !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You do not have access to this case"
            });
        }

        res.json({
            message: "Case retrieved successfully",
            case: caseData
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve case"
        });
    }
}

module.exports = {
    createCase,
    getCases,
    getCaseById
};