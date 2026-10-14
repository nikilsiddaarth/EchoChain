
require("dotenv").config();

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const rpc = process.env.BLOCKCHAIN_RPC_URL;
    const address = process.env.ECHO_CHAIN_CONTRACT_ADDRESS;

    console.log("RPC configured:", Boolean(rpc));
    console.log("Contract address configured:", Boolean(address));

    if (!rpc || !address) {
        console.log("Missing blockchain configuration.");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const network = await provider.getNetwork();
    const code = await provider.getCode(address);

    console.log("Chain ID:", network.chainId.toString());
    console.log("Contract address:", address);
    console.log(
        "Bytecode length:",
        code === "0x" ? 0 : (code.length - 2) / 2
    );

    const artifactPath = path.join(
        __dirname,
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

    const hasHistoryFunction = artifact.abi.some(
        item =>
            item.type === "function" &&
            item.name === "getEchoHistory"
    );

    console.log(
        "ABI has getEchoHistory:",
        hasHistoryFunction
    );

    await provider.destroy();
}

main().catch(error => {
    console.error(
        "Diagnostic failed:",
        error.shortMessage || error.message
    );
    process.exitCode = 1;
});
