import { useEffect, useState } from "react";

function EvidenceDetails({
    evidenceId,
    onBack,
    onVerify,
    onOpenReport
}) {
    const [evidence, setEvidence] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accessing, setAccessing] = useState(false);

    async function loadEvidence() {
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

            const item =
                (data.evidence || []).find(
                    (entry) =>
                        String(entry._id) ===
                        String(evidenceId)
                );

            if (!item) {
                throw new Error(
                    "Evidence record not found"
                );
            }

            setEvidence(item);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadEvidence();
    }, [evidenceId]);

    async function accessEvidence() {
        setAccessing(true);
        setError("");

        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${evidenceId}/access`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const data =
                    await response.json();

                throw new Error(
                    data.message ||
                        "Unable to access evidence"
                );
            }

            const blob =
                await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            window.open(url, "_blank");
        } catch (error) {
            setError(error.message);
        } finally {
            setAccessing(false);
        }
    }

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading-state">
                    Loading evidence details...
                </div>
            </div>
        );
    }

    if (error && !evidence) {
        return (
            <div className="page-content">
                <div className="page-error">
                    {error}
                </div>

                <button
                    className="secondary-action"
                    onClick={onBack}
                >
                    ← Back to Evidence
                </button>
            </div>
        );
    }

    return (
        <div className="page-content evidence-details-page">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        EVIDENCE DETAILS
                    </span>

                    <h1>
                        {evidence.fileName}
                    </h1>

                    <p>
                        Review the protected evidence
                        record and its integrity information.
                    </p>
                </div>

                <button
                    className="secondary-action"
                    onClick={onBack}
                >
                    ← Back to Evidence
                </button>
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            <section className="details-hero evidence-detail-hero">
                <div className="details-icon evidence-detail-icon">
                    ◈
                </div>

                <div>
                    <span className="eyebrow">
                        PROTECTED EVIDENCE
                    </span>

                    <h2>
                        {evidence.fileName}
                    </h2>

                    <p>
                        This record is encrypted and
                        registered in the Echo Chain.
                    </p>
                </div>

                <span className="badge">
                    PROTECTED
                </span>
            </section>

            <section className="details-grid">
                <div className="details-panel">
                    <div className="details-panel-header">
                        <div>
                            <span className="eyebrow">
                                FILE RECORD
                            </span>

                            <h2>
                                Evidence Information
                            </h2>
                        </div>
                    </div>

                    <div className="details-information">
                        <div>
                            <span>FILE NAME</span>
                            <strong>
                                {evidence.fileName}
                            </strong>
                        </div>

                        <div>
                            <span>FILE TYPE</span>
                            <strong>
                                {evidence.fileType}
                            </strong>
                        </div>

                        <div>
                            <span>CASE ID</span>
                            <strong>
                                {evidence.caseId}
                            </strong>
                        </div>

                        <div>
                            <span>EVIDENCE ID</span>
                            <strong>
                                {evidence._id}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="details-panel">
                    <div className="details-panel-header">
                        <div>
                            <span className="eyebrow">
                                INTEGRITY
                            </span>

                            <h2>
                                SHA-256 Fingerprint
                            </h2>
                        </div>
                    </div>

                    <div className="detail-hash">
                        <code>
                            {evidence.hash}
                        </code>
                    </div>

                    <div className="integrity-note">
                        <span>✓</span>

                        <div>
                            <strong>
                                Blockchain registered
                            </strong>

                            <p>
                                The original evidence
                                fingerprint is recorded
                                in the Echo Chain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="details-panel evidence-actions-panel">
                <div className="details-panel-header">
                    <div>
                        <span className="eyebrow">
                            ACTIONS
                        </span>

                        <h2>
                            Evidence Operations
                        </h2>
                    </div>
                </div>

                <div className="details-action-grid">
                    <button
                        className="primary-action"
                        onClick={accessEvidence}
                        disabled={accessing}
                    >
                        {accessing
                            ? "Opening..."
                            : "Open Evidence →"}
                    </button>

                    <button
                        className="secondary-action"
                        onClick={() =>
                            onVerify(evidence)
                        }
                    >
                        ✓ Verify Integrity
                    </button>

                    <button
                        className="secondary-action"
                        onClick={() =>
                            onOpenReport(evidence)
                        }
                    >
                        View Forensic Report →
                    </button>
                </div>
            </section>
        </div>
    );
}

export default EvidenceDetails;