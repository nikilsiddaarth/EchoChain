import { network } from "hardhat";

const { ethers } = await network.connect();

const echoChain = await ethers.deployContract("EchoChain");

await echoChain.waitForDeployment();

console.log("EchoChain deployed successfully");
console.log("Contract address:", await echoChain.getAddress());