// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EchoChain {
    struct Echo {
        string evidenceId;
        string caseId;
        string action;
        string actor;
        string evidenceHash;
        uint256 timestamp;
        bytes32 previousEcho;
        bytes32 echoHash;
    }

    mapping(string => Echo[]) private evidenceHistory;

    event EchoRecorded(
        string evidenceId,
        string caseId,
        string action,
        string actor,
        string evidenceHash,
        uint256 timestamp,
        bytes32 previousEcho,
        bytes32 echoHash
    );

    function recordEcho(
        string memory evidenceId,
        string memory caseId,
        string memory action,
        string memory actor,
        string memory evidenceHash
    ) public returns (bytes32) {
        bytes32 previousEcho;

        uint256 historyLength = evidenceHistory[evidenceId].length;

        if (historyLength > 0) {
            previousEcho = evidenceHistory[evidenceId][historyLength - 1].echoHash;
        }

        uint256 timestamp = block.timestamp;

        bytes32 echoHash = keccak256(
            abi.encodePacked(
                evidenceId,
                caseId,
                action,
                actor,
                evidenceHash,
                timestamp,
                previousEcho
            )
        );

        Echo memory newEcho = Echo(
            evidenceId,
            caseId,
            action,
            actor,
            evidenceHash,
            timestamp,
            previousEcho,
            echoHash
        );

        evidenceHistory[evidenceId].push(newEcho);

        emit EchoRecorded(
            evidenceId,
            caseId,
            action,
            actor,
            evidenceHash,
            timestamp,
            previousEcho,
            echoHash
        );

        return echoHash;
    }

    function getEchoHistory(
        string memory evidenceId
    ) public view returns (Echo[] memory) {
        return evidenceHistory[evidenceId];
    }

    function getEchoCount(
        string memory evidenceId
    ) public view returns (uint256) {
        return evidenceHistory[evidenceId].length;
    }
}