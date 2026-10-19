import { useEffect, useState } from "react";

function EchoChain() {
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] =
        useState("");
    const [history, setHistory] = useState([]);
    
    const [historySource, setHistorySource] = useState("UNAVAILABLE");

    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] =
        useState(false);

    const [error, setError] = useState("");

    async function fetchHistory(evidenceId) {
        if (!evidenceId) {
            return;
        }

        setLoadingHistory(true);
        setError("");

        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${evidenceId}/history`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to load Echo history"
                );
            }
            console.log("ECHO HISTORY API RESPONSE:", data);
            
            setHistory(Array.isArray(data.history) ? data.history : []);
            console.log("HISTORY STATE INPUT:", Array.isArray(data.history), data.history.length);
            setHistorySource(data.source || "UNAVAILABLE");
        } catch (error) {
            setError(error.message);
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    }

    async function fetchEvidence() {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                "http://localhost:5000/api/evidence",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to load evidence"
                );
            }

            const evidenceList = data.evidence || [];

            setEvidence(evidenceList);

            if (evidenceList.length > 0) {
                const firstEvidence =
                    evidenceList[0]._id;

                setSelectedEvidence(
                    firstEvidence
                );

                await fetchHistory(firstEvidence);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    const timer = setTimeout(() => {
        fetchEvidence();
    }, 0);

    return () => clearTimeout(timer);
}, []);

    function handleEvidenceChange(event) {
        const evidenceId = event.target.value;

        setSelectedEvidence(evidenceId);
        fetchHistory(evidenceId);
    }

    function formatTimestamp(timestamp) {
        const date = new Date(
            Number(timestamp) * 1000
        );

        return date.toLocaleString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getActionLabel(action) {
        return action
            .replaceAll("_", " ")
            .toUpperCase();
    }

    return (
        <div className="page-content">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        BLOCKCHAIN PROVENANCE
                    </span>

                    <h1>Echo Chain</h1>

                    <p>
                        A permanent, tamper-evident history
                        of every evidence interaction.
                    </p>
                </div>

                <div className="chain-live">
                    ● BLOCKCHAIN LIVE
                </div>
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading-state">
                    Loading blockchain evidence...
                </div>
            ) : evidence.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        ⛓
                    </div>

                    <h2>
                        No evidence available
                    </h2>

                    <p>
                        Upload evidence to begin creating
                        an Echo Chain.
                    </p>
                </div>
            ) : (
                <>
                    <div className="echo-selector-panel">
                        <div>
                            <span className="eyebrow">
                                SELECT EVIDENCE
                            </span>

                            <h2>
                                Evidence Chain
                            </h2>
                        </div>

                        <select
                            value={selectedEvidence}
                            onChange={
                                handleEvidenceChange
                            }
                        >
                            {evidence.map((item) => (
                                <option
                                    key={item._id}
                                    value={item._id}
                                >
                                    {item.fileName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loadingHistory ? (
                        <div className="loading-state">
                            Reading blockchain history...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                ⛓
                            </div>

                            <h2>
                                No Echo events found
                            </h2>

                            <p>
                                This evidence does not have
                                any recorded blockchain events.
                            </p>
                        </div>
                    ) : (
                        <div className="echo-chain-container">
                            <div className="chain-summary">
                                <div className="chain-summary-card">
                                    <span>
                                        ECHO EVENTS
                                    </span>

                                    <strong>
                                        {history.length}
                                    </strong>
                                </div>

                                <div className="chain-summary-card">
                                    <span>
                                        EVIDENCE
                                    </span>

                                    <strong>
                                        {evidence.find(
                                            (item) =>
                                                item._id ===
                                                selectedEvidence
                                        )?.fileName ||
                                            "Evidence"}
                                    </strong>
                                </div>

                                <div className="chain-summary-card">
                                    <span>
                                        STATUS
                                    </span>

                                    
                                <strong className="verified-text">
                                    {historySource === "BLOCKCHAIN"
                                        ? "BLOCKCHAIN"
                                        : historySource === "MONGODB_BACKUP"
                                        ? "MONGODB BACKUP"
                                        : "UNAVAILABLE"}
                                </strong>

                                </div>
                            </div>

                            <div className="echo-timeline">
                                {history.map(
                                    (echo, index) => (
                                        <div
                                            className="echo-event"
                                            key={`${echo.echoHash}-${index}`}
                                        >
                                            <div className="echo-marker">
                                                <div className="echo-number">
                                                    {String(
                                                        index + 1
                                                    ).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </div>
                                            </div>

                                            <div className="echo-card">
                                                <div className="echo-card-header">
                                                    <div>
                                                        <span className="echo-action">
                                                            {getActionLabel(
                                                                echo.action
                                                            )}
                                                        </span>

                                                        <h2>
                                                            {echo.action ===
                                                            "CREATED"
                                                                ? "Evidence registered"
                                                                : echo.action ===
                                                                  "ACCESS_GRANTED"
                                                                ? "Access permission granted"
                                                                : echo.action ===
                                                                  "ACCESSED"
                                                                ? "Evidence accessed"
                                                                : getActionLabel(
                                                                      echo.action
                                                                  )}
                                                        </h2>
                                                    </div>

                                                    <span className="echo-time">
                                                        {formatTimestamp(
                                                            echo.timestamp
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="echo-details">
                                                    <div>
                                                        <span>
                                                            ACTOR
                                                        </span>

                                                        <strong>
                                                            {
                                                                echo.actor
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            CASE ID
                                                        </span>

                                                        <strong>
                                                            {
                                                                echo.caseId
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            EVIDENCE ID
                                                        </span>

                                                        <strong>
                                                            {
                                                                echo.evidenceId
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="echo-hash-section">
                                                    <div>
                                                        <span>
                                                            EVIDENCE HASH
                                                        </span>

                                                        <code>
                                                            {
                                                                echo.evidenceHash
                                                            }
                                                        </code>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            ECHO HASH
                                                        </span>

                                                        <code>
                                                            {
                                                                echo.echoHash
                                                            }
                                                        </code>
                                                    </div>
                                                </div>

                                                <div className="echo-footer">
                                                    <span>
                                                        {index ===
                                                        0
                                                            ? "GENESIS ECHO"
                                                            : "LINKED TO PREVIOUS ECHO"}
                                                    </span>

                                                    <code>
                                                        {echo.previousEcho ===
                                                        "0x0000000000000000000000000000000000000000000000000000000000000000"
                                                            ? "Initial record"
                                                            : echo.previousEcho}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default EchoChain;