import { useEffect, useState } from "react";

function CaseDetails({ caseId, onBack, onOpenEvidence }) {
    const [caseData, setCaseData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCase() {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const caseResponse = await fetch(
                `http://localhost:5000/api/cases/${caseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const caseResult =
                await caseResponse.json();

            if (!caseResponse.ok) {
                throw new Error(
                    caseResult.message ||
                        "Failed to load case"
                );
            }

            setCaseData(
                caseResult.case || caseResult
            );

            const evidenceResponse = await fetch(
                "http://localhost:5000/api/evidence",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const evidenceResult =
                await evidenceResponse.json();

            if (!evidenceResponse.ok) {
                throw new Error(
                    evidenceResult.message ||
                        "Failed to load evidence"
                );
            }

            const caseEvidence =
                (evidenceResult.evidence || []).filter(
                    (item) =>
                        String(item.caseId) ===
                        String(caseId)
                );

            setEvidence(caseEvidence);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCase();
    }, [caseId]);

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading-state">
                    Loading case details...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="page-error">
                    {error}
                </div>

                <button
                    className="secondary-action"
                    onClick={onBack}
                >
                    ← Back to Cases
                </button>
            </div>
        );
    }

    return (
        <div className="page-content case-details-page">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        CASE DETAILS
                    </span>

                    <h1>
                        {caseData?.title}
                    </h1>

                    <p>
                        Review the case information and
                        associated protected evidence.
                    </p>
                </div>

                <button
                    className="secondary-action"
                    onClick={onBack}
                >
                    ← Back to Cases
                </button>
            </div>

            <section className="details-hero">
                <div className="details-icon">
                    ▣
                </div>

                <div>
                    <span className="eyebrow">
                        ACTIVE MATTER
                    </span>

                    <h2>
                        {caseData?.title}
                    </h2>

                    <p>
                        {caseData?.description}
                    </p>
                </div>

                <span className="active-status">
                    <span></span>
                    ACTIVE
                </span>
            </section>

            <section className="details-grid">
                <div className="details-panel">
                    <div className="details-panel-header">
                        <div>
                            <span className="eyebrow">
                                CASE RECORD
                            </span>

                            <h2>
                                Case Information
                            </h2>
                        </div>
                    </div>

                    <div className="details-information">
                        <div>
                            <span>CASE ID</span>
                            <strong>
                                {caseData?._id}
                            </strong>
                        </div>

                        <div>
                            <span>STATUS</span>
                            <strong>ACTIVE</strong>
                        </div>

                        <div>
                            <span>CREATED BY</span>
                            <strong>
                                {caseData?.createdBy ||
                                    "Authorized Lawyer"}
                            </strong>
                        </div>

                        <div>
                            <span>EVIDENCE RECORDS</span>
                            <strong>
                                {evidence.length}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="details-panel">
                    <div className="details-panel-header">
                        <div>
                            <span className="eyebrow">
                                SECURITY
                            </span>

                            <h2>
                                Protection Status
                            </h2>
                        </div>
                    </div>

                    <div className="details-status-list">
                        <div>
                            <span>Encryption</span>
                            <strong className="status-success">
                                ✓ Protected
                            </strong>
                        </div>

                        <div>
                            <span>Integrity</span>
                            <strong className="status-success">
                                ✓ SHA-256
                            </strong>
                        </div>

                        <div>
                            <span>Blockchain</span>
                            <strong className="status-success">
                                ✓ Echo Active
                            </strong>
                        </div>

                        <div>
                            <span>Access Control</span>
                            <strong className="status-success">
                                ✓ Role Based
                            </strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="details-panel evidence-record-panel">
                <div className="details-panel-header">
                    <div>
                        <span className="eyebrow">
                            PROTECTED RECORDS
                        </span>

                        <h2>
                            Case Evidence
                        </h2>
                    </div>

                    <span className="case-count">
                        {evidence.length} record
                        {evidence.length !== 1
                            ? "s"
                            : ""}
                    </span>
                </div>

                {evidence.length === 0 ? (
                    <div className="details-empty">
                        <div>
                            ◈
                        </div>

                        <h3>
                            No evidence linked
                        </h3>

                        <p>
                            Evidence uploaded for this
                            case will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="details-evidence-list">
                        {evidence.map((item) => (
                            <div
                                className="details-evidence-row"
                                key={item._id}
                            >
                                <div className="details-evidence-icon">
                                    ◈
                                </div>

                                <div className="details-evidence-main">
                                    <strong>
                                        {item.fileName}
                                    </strong>

                                    <span>
                                        {item.fileType}
                                    </span>
                                </div>

                                <span className="badge">
                                    PROTECTED
                                </span>

                                <button
                                    className="view-case"
                                    onClick={() =>
                                        onOpenEvidence(
                                            item._id
                                        )
                                    }
                                >
                                    Open
                                    <span>→</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default CaseDetails;