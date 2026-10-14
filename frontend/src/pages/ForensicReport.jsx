import { useEffect, useState } from "react";

function ForensicReport({
    evidence,
    onBack
}) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadReport() {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${evidence._id}/report`,
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
                        "Failed to load forensic report"
                );
            }

            setReport(data.report);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReport();
    }, [evidence]);

    if (loading) {
        return (
            <div className="page-content">
                <div className="loading-state">
                    Loading forensic report...
                </div>
            </div>
        );
    }

    return (
        <div className="page-content report-page">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        FORENSIC ANALYSIS
                    </span>

                    <h1>
                        Forensic Report
                    </h1>

                    <p>
                        Examination record associated
                        with the protected evidence.
                    </p>
                </div>

                <button
                    className="secondary-action"
                    onClick={onBack}
                >
                    ← Back
                </button>
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {!error && report && (
                <>
                    <section className="report-header-card">
                        <div className="report-icon">
                            ⚖
                        </div>

                        <div>
                            <span className="eyebrow">
                                VERIFIED CASE RECORD
                            </span>

                            <h2>
                                {report.reportTitle}
                            </h2>

                            <p>
                                Evidence:{" "}
                                {evidence.fileName}
                            </p>
                        </div>

                        <span className="badge">
                            REPORT ADDED
                        </span>
                    </section>

                    <section className="report-grid">
                        <div className="report-section">
                            <span className="eyebrow">
                                FINDINGS
                            </span>

                            <h2>
                                Examination Findings
                            </h2>

                            <p>
                                {report.findings}
                            </p>
                        </div>

                        <div className="report-section">
                            <span className="eyebrow">
                                CONCLUSION
                            </span>

                            <h2>
                                Forensic Conclusion
                            </h2>

                            <p>
                                {report.conclusion}
                            </p>
                        </div>
                    </section>

                    <section className="report-metadata">
                        <div>
                            <span>
                                EVIDENCE ID
                            </span>

                            <strong>
                                {evidence._id}
                            </strong>
                        </div>

                        <div>
                            <span>
                                CASE ID
                            </span>

                            <strong>
                                {evidence.caseId}
                            </strong>
                        </div>

                        <div>
                            <span>
                                REPORT DATE
                            </span>

                            <strong>
                                {report.createdAt
                                    ? new Date(
                                          report.createdAt
                                      ).toLocaleString()
                                    : "Recorded"}
                            </strong>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default ForensicReport;