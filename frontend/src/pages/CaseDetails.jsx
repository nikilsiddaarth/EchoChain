
import { useEffect, useState } from "react";

function CaseDetails({ caseId, onBack, onOpenEvidence }) {
    const [caseData, setCaseData] = useState(null);
    const [evidence, setEvidence] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadCase() {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("echoChainToken");

            const caseResponse = await fetch(
                `http://localhost:5000/api/cases/${caseId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const caseResult = await caseResponse.json();

            if (!caseResponse.ok) {
                throw new Error(
                    caseResult.message || "Failed to load case"
                );
            }

            setCaseData(caseResult.case || caseResult);

            const evidenceResponse = await fetch(
                "http://localhost:5000/api/evidence",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const evidenceResult = await evidenceResponse.json();

            if (!evidenceResponse.ok) {
                throw new Error(
                    evidenceResult.message || "Failed to load evidence"
                );
            }

            const caseEvidence = (
                evidenceResult.evidence || []
            ).filter(
                item => String(item.caseId) === String(caseId)
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
            <div className="page-content case-details-page">
                <div className="cd-feedback">
                    <div className="cd-spinner"></div>
                    <h2>Loading case details</h2>
                    <p>Retrieving case records and associated evidence.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content case-details-page">
                <div className="cd-feedback">
                    <span className="cd-error-mark">!</span>
                    <h2>Unable to load case</h2>
                    <p>{error}</p>
                    <button className="cd-button" onClick={loadCase}>
                        Try again
                    </button>
                    <button className="cd-button cd-button-light" onClick={onBack}>
                        Back to Cases
                    </button>
                </div>
            </div>
        );
    }

    const caseStatus = caseData?.status || "ACTIVE";
    const createdBy =
        caseData?.createdBy?.name ||
        caseData?.createdBy ||
        "Authorized Lawyer";

    const protectionItems = [
        {
            icon: "✓",
            label: "Encryption",
            value: "Protected",
            detail: "Encrypted evidence storage"
        },
        {
            icon: "#",
            label: "Integrity",
            value: "SHA-256",
            detail: "Evidence hash verification"
        },
        {
            icon: "↗",
            label: "Blockchain",
            value: "Echo Active",
            detail: "Evidence event ledger"
        },
        {
            icon: "⌑",
            label: "Access control",
            value: "Role Based",
            detail: "Controlled access permissions"
        }
    ];

    return (
        <div className="page-content case-details-page">
            <header className="cd-header">
                <div className="cd-heading-copy">
                    <div className="cd-breadcrumb">
                        <button onClick={onBack}>Cases</button>
                        <span>/</span>
                        <span>Case details</span>
                    </div>

                    <span className="cd-kicker">CASE MANAGEMENT</span>

                    <h1>{caseData?.title || "Untitled Case"}</h1>

                    <p>
                        Manage case information and review its associated evidence.
                    </p>
                </div>

                <button className="cd-button cd-button-light" onClick={onBack}>
                    <span>←</span> Back to Cases
                </button>
            </header>

            <section className="cd-case-banner">
                <div className="cd-case-symbol">§</div>

                <div className="cd-case-copy">
                    <span className="cd-overline">CASE OVERVIEW</span>
                    <h2>{caseData?.title || "Untitled Case"}</h2>
                    <p>
                        {caseData?.description ||
                            "No case description has been provided."}
                    </p>
                </div>

                <div className="cd-case-state">
                    <span className="cd-state-dot"></span>
                    {caseStatus}
                </div>
            </section>

            <section className="cd-overview-grid">
                <article className="cd-card">
                    <div className="cd-card-heading">
                        <div className="cd-heading-icon cd-blue">01</div>
                        <div>
                            <span className="cd-overline">CASE RECORD</span>
                            <h2>Case information</h2>
                        </div>
                    </div>

                    <div className="cd-info-list">
                        <div className="cd-info-item">
                            <span>Case ID</span>
                            <strong title={String(caseData?._id || "")}>
                                {caseData?._id || "—"}
                            </strong>
                        </div>

                        <div className="cd-info-item">
                            <span>Current status</span>
                            <strong className="cd-inline-status">
                                <span className="cd-state-dot"></span>
                                {caseStatus}
                            </strong>
                        </div>

                        <div className="cd-info-item">
                            <span>Created by</span>
                            <strong title={String(createdBy)}>
                                {String(createdBy)}
                            </strong>
                        </div>

                        <div className="cd-info-item">
                            <span>Evidence records</span>
                            <strong>{evidence.length}</strong>
                        </div>
                    </div>
                </article>

                <article className="cd-card">
                    <div className="cd-card-heading">
                        <div className="cd-heading-icon cd-green">02</div>
                        <div>
                            <span className="cd-overline">SECURITY OVERVIEW</span>
                            <h2>Protection status</h2>
                        </div>
                    </div>

                    <div className="cd-protection-grid">
                        {protectionItems.map(item => (
                            <div className="cd-protection-item" key={item.label}>
                                <div className="cd-protection-top">
                                    <span className="cd-check">{item.icon}</span>
                                    <strong>{item.label}</strong>
                                </div>
                                <span className="cd-protection-value">
                                    {item.value}
                                </span>
                                <p>{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="cd-evidence-section">
                <div className="cd-evidence-header">
                    <div>
                        <span className="cd-overline">EVIDENCE MANAGEMENT</span>
                        <h2>Case evidence</h2>
                        <p>Protected records associated with this case.</p>
                    </div>

                    <div className="cd-total">
                        <strong>{evidence.length}</strong>
                        <span>
                            {evidence.length === 1 ? "record" : "records"}
                        </span>
                    </div>
                </div>

                {evidence.length === 0 ? (
                    <div className="cd-empty">
                        <div className="cd-empty-symbol">◇</div>
                        <h3>No evidence linked yet</h3>
                        <p>
                            Evidence associated with this case will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="cd-evidence-grid">
                        {evidence.map((item, index) => (
                            <article className="cd-evidence-card" key={item._id}>
                                <div className="cd-file-top">
                                    <div className="cd-file-icon">
                                        {String(item.fileName || "")
                                            .split(".")
                                            .pop()
                                            .toLowerCase() === "pdf"
                                            ? "PDF"
                                            : "FILE"}
                                    </div>

                                    <span className="cd-protected-pill">
                                        <span></span>
                                        Protected
                                    </span>
                                </div>

                                <div className="cd-file-content">
                                    <span className="cd-file-index">
                                        RECORD {String(index + 1).padStart(2, "0")}
                                    </span>

                                    <h3 title={item.fileName || "Untitled file"}>
                                        {item.fileName || "Untitled file"}
                                    </h3>

                                    <p>
                                        {item.fileType || "File type unavailable"}
                                    </p>
                                </div>

                                <div className="cd-file-footer">
                                    <span className="cd-file-status">
                                        <span></span>
                                        Secured record
                                    </span>

                                    <button
                                        className="cd-open-button"
                                        onClick={() => onOpenEvidence(item._id)}
                                    >
                                        Open <span>↗</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default CaseDetails;
