const { ObjectId } = require("mongodb");

function createUserModel(db) {
    return db.collection("users");
}

module.exports = {
    createUserModel,
    ObjectId
};