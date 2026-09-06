const { ObjectId } = require("mongodb");

function createCaseModel(db) {
    return db.collection("cases");
}

module.exports = {
    createCaseModel,
    ObjectId
};