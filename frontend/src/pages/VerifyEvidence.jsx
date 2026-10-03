import { useEffect, useState } from "react";

function VerifyEvidence() {
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] = useState("");
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");

    async function fetchEvidence() {
        try {
            const token = localStorage.getItem("echoChainToken");
            const response = await fetch("http://localhost:5000/api/evidence", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load evidence");
            }

            setEvidence(data.evidence || []);

            if (data.evidence?.length > 0) {
                setSelectedEvidence(data.evidence[0]._id);
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

    async function handleVerify() {
        if (!selectedEvidence) {
            setError("Please select evidence to verify.");
            return;
        }

        setVerifying(true);
        setVerification(null);
        setError("");

        try {
            const token = localStorage.getItem("echoChainToken");
            const response = await fetch(
                `http://localhost:5000/api/evidence/${selectedEvidence}/verify`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Verification failed");
            }

            setVerification(data);
        } catch (error) {
            setVerification({
                status: "ERROR",
                message: error.message
            });
        } finally {
            setVerifying(false);
        }
    }

    const selectedItem = evidence.find(
        (item) => item._id === selectedEvidence
    );

    return (
        <div className="page-content">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">INTEGRITY VERIFICATION</span>
                    <h1>Verify Evidence</h1>
                    <p>
                        Confirm that stored evidence still matches its
                        blockchain integrity record.
                    </p>
                </div>
            </div>

            {error && <div className="page-error">{error}</div>}

            {loading ? (
                <div className="loading-state">
                    Loading protected evidence...
                </div>
            ) : evidence.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h2>No evidence available</h2>
                    <p>
                        Upload or receive authorized evidence before
                        running an integrity verification.
                    </p>
                </div>
            ) : (
                <div className="verification-page">
                    <div className="panel verification-select-panel">
                        <div className="panel-header">
                            <div>
                                <span className="eyebrow">
                                    BLOCKCHAIN INTEGRITY
                                </span>
                                <h2>Select Evidence</h2>
                            </div>
                            <span className="badge">SHA-256</span>
                        </div>

                        <div className="modal-input-group">
                            <label>Evidence record</label>
                            <select
                                value={selectedEvidence}
                                onChange={(event) => {
                                    setSelectedEvidence(event.target.value);
                                    setVerification(null);
                                }}
                            >
                                {evidence.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.fileName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedItem && (
                            <div className="verification-selected">
                                <div>
                                    <span>FILE</span>
                                    <strong>{selectedItem.fileName}</strong>
                                </div>
                                <div>
                                    <span>CASE ID</span>
                                    <strong>{selectedItem.caseId}</strong>
                                </div>
                                <div className="verification-hash-preview">
                                    <span>RECORDED HASH</span>
                                    <code>{selectedItem.hash}</code>
                                </div>
                            </div>
                        )}

                        <button
                            className="primary-action verification-button"
                            onClick={handleVerify}
                            disabled={verifying || !selectedEvidence}
                        >
                            {verifying
                                ? "Verifying..."
                                : "Verify Evidence Integrity"}
                        </button>
                    </div>

                    {verifying && (
                        <div className="panel verification-result-panel">
                            <div className="verification-loading">
                                <div className="verification-icon">◌</div>
                                <span className="eyebrow">INTEGRITY CHECK</span>
                                <h2>Verifying Evidence</h2>
                                <p>
                                    Comparing the current evidence fingerprint
                                    against the blockchain record.
                                </p>
                            </div>
                        </div>
                    )}

                    {!verifying && verification && (
                        <div className="panel verification-result-panel">
                            <div
                                className={
                                    verification.status === "VERIFIED"
                                        ? "verification-icon verified"
                                        : "verification-icon failed"
                                }
                            >
                                {verification.status === "VERIFIED" ? "✓" : "!"}
                            </div>

                            <span className="eyebrow">INTEGRITY RESULT</span>

                            <h2>
                                {verification.status === "VERIFIED"
                                    ? "Evidence Verified"
                                    : verification.status ===
                                      "TAMPERING_DETECTED"
                                    ? "Tampering Detected"
                                    : "Verification Error"}
                            </h2>

                            <p className="verification-message">
                                {verification.message}
                            </p>

                            {verification.blockchainHash && (
                                <div className="verification-hashes">
                                    <div>
                                        <span>BLOCKCHAIN HASH</span>
                                        <code>
                                            {verification.blockchainHash}
                                        </code>
                                    </div>
                                    <div>
                                        <span>CURRENT HASH</span>
                                        <code>
                                            {verification.currentHash}
                                        </code>
                                    </div>
                                </div>
                            )}

                            {verification.originalHash && (
                                <div className="verification-hashes">
                                    <div>
                                        <span>STORED ORIGINAL HASH</span>
                                        <code>
                                            {verification.originalHash}
                                        </code>
                                    </div>
                                </div>
                            )}

                            <div
                                className={
                                    verification.status === "VERIFIED"
                                        ? "verification-status verified-status"
                                        : "verification-status failed-status"
                                }
                            >
                                {verification.status === "VERIFIED"
                                    ? "✓ INTEGRITY VERIFIED"
                                    : verification.status ===
                                      "TAMPERING_DETECTED"
                                    ? "⚠ TAMPERING DETECTED"
                                    : "⚠ VERIFICATION FAILED"}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default VerifyEvidence;
