const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const provider = new ethers.JsonRpcProvider(
    process.env.BLOCKCHAIN_RPC_URL
);

const contractAddress =
    process.env.ECHO_CHAIN_CONTRACT_ADDRESS;

const artifactPath = path.join(
    __dirname,
    "..",
    "..",
    "blockchain",
    "artifacts",
    "contracts",
    "EchoChain.sol",
    "EchoChain.json"
);

const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
);

const wallet = new ethers.Wallet(
    process.env.BLOCKCHAIN_PRIVATE_KEY,
    provider
);

const contract = new ethers.Contract(
    contractAddress,
    artifact.abi,
    wallet
);

async function recordEcho(
    evidenceId,
    caseId,
    action,
    actor,
    evidenceHash
) {
    const transaction = await contract.recordEcho(
        evidenceId,
        caseId,
        action,
        actor,
        evidenceHash
    );

    const receipt = await transaction.wait();

    return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
    };
}

async function getEchoHistory(evidenceId) {
    return await contract.getEchoHistory(evidenceId);
}

async function getEchoCount(evidenceId) {
    return await contract.getEchoCount(evidenceId);
}

module.exports = {
    recordEcho,
    getEchoHistory,
    getEchoCount
};