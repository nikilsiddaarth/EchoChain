import { useEffect, useState } from "react";
import { getStoredUser } from "../services/authService";

function Evidence() {
    const user = getStoredUser();
    const [evidence, setEvidence] = useState([]);
    const [cases, setCases] = useState([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [showVerification, setShowVerification] = useState(false);

    const [verification, setVerification] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const [selectedCase, setSelectedCase] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    const [showGrantModal, setShowGrantModal] = useState(false);
    const [grantEvidence, setGrantEvidence] = useState(null);
    const [grantUserId, setGrantUserId] = useState("");
    const [grantMessage, setGrantMessage] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportEvidence, setReportEvidence] = useState(null);
    const [reportTitle, setReportTitle] = useState("");
    const [findings, setFindings] = useState("");
    const [conclusion, setConclusion] = useState("");
    const [reportMessage, setReportMessage] = useState("");

    async function fetchEvidence() {
        try {
                
            const token = localStorage.getItem("echoChainToken");

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

            setEvidence(data.evidence || []);
        } catch (error) {
            setError(error.message);
        }
    }

    async function fetchCases() {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                "http://localhost:5000/api/cases",
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
                        "Failed to load cases"
                );
            }

            setCases(data.cases || []);
        } catch (error) {
            setError(error.message);
        }
    }

    useEffect(() => {
        async function loadPage() {
            await Promise.all([
                fetchEvidence(),
                fetchCases()
            ]);

            setLoading(false);
        }

        loadPage();
    }, []);

    async function handleUpload(event) {
        event.preventDefault();

        if (!selectedCase || !selectedFile) {
            setError(
                "Please select a case and evidence file."
            );
            return;
        }

        setUploading(true);
        setError("");

        try {
            const token =
                localStorage.getItem("echoChainToken");

            const formData = new FormData();

            formData.append(
                "caseId",
                selectedCase
            );

            formData.append(
                "evidence",
                selectedFile
            );

            const response = await fetch(
                "http://localhost:5000/api/evidence/upload",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Evidence upload failed"
                );
            }

            setShowModal(false);
            setSelectedCase("");
            setSelectedFile(null);

            await fetchEvidence();
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    }

    async function viewEvidence(item) {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${item._id}/access`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const data = await response.json();

                throw new Error(
                    data.message ||
                        "Unable to access evidence"
                );
            }

            const blob = await response.blob();

            const url =
                window.URL.createObjectURL(blob);

            window.open(url, "_blank");
        } catch (error) {
            setError(error.message);
        }
    }

    async function verifyEvidence(item) {
        setVerifying(true);
        setVerification(null);
        setShowVerification(true);
        setError("");

        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${item._id}/verify`,
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
                        "Verification failed"
                );
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

    function closeModal() {
        if (uploading) {
            return;
        }

        setShowModal(false);
        setSelectedCase("");
        setSelectedFile(null);
    }

    async function handleGrantAccess() {
    try {
        const token = localStorage.getItem("echoChainToken");

        const response = await fetch(
            `http://localhost:5000/api/evidence/${grantEvidence._id}/grant-access`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: grantUserId,
                    permission: "VIEW"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setGrantMessage(data.message || "Failed to grant access");
            return;
        }

        setGrantMessage("Evidence access granted successfully");
        setGrantUserId("");
    } catch {
        setGrantMessage("Failed to grant evidence access");
    }

}

    async function handleSubmitReport() {
        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                `http://localhost:5000/api/evidence/${reportEvidence._id}/report`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        reportTitle,
                        findings,
                        conclusion
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setReportMessage(
                    data.message ||
                        "Failed to add forensic report"
                );
                return;
            }

            setReportMessage(
                "Forensic report added successfully"
            );

            setReportTitle("");
            setFindings("");
            setConclusion("");
        } catch {
            setReportMessage(
                "Failed to add forensic report"
            );
        }
    }

    return (
        <div className="page-content">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        EVIDENCE MANAGEMENT
                    </span>

                    <h1>Evidence</h1>

                    <p>
                        Securely manage and verify case evidence.
                    </p>
                </div>

                {user?.role === "Lawyer" && (
                    <button
                        className="primary-action"
                        onClick={() =>
                            setShowModal(true)
                        }
                    >
                        + Upload Evidence
                    </button>
                )}
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    Loading protected evidence...
                </div>
            )}

            {!loading &&
                evidence.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">
                            ◈
                        </div>

                        <h2>
                            No evidence found
                        </h2>

                        <p>
                            Upload evidence to begin
                            building its secure chain
                            of custody.
                        </p>
                    </div>
                )}

            {!loading &&
                evidence.length > 0 && (
                    <div className="evidence-grid">
                        {evidence.map((item) => (
                            <div
                                className="evidence-card"
                                key={item._id}
                            >
                                <div className="evidence-card-top">
                                    <div className="evidence-icon">
                                        ◈
                                    </div>

                                    <span className="badge">
                                        PROTECTED
                                    </span>
                                </div>

                                <span className="case-number">
                                    DIGITAL EVIDENCE
                                </span>

                                <h2>
                                    {item.fileName}
                                </h2>

                                <div className="evidence-info">
                                    <div>
                                        <span>
                                            FILE TYPE
                                        </span>

                                        <strong>
                                            {item.fileType}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            CASE ID
                                        </span>

                                        <strong>
                                            {item.caseId}
                                        </strong>
                                    </div>
                                </div>

                                <div className="hash-box">
                                    <span>
                                        SHA-256 INTEGRITY HASH
                                    </span>

                                    <code>
                                        {item.hash}
                                    </code>
                                </div>

                                <div className="evidence-actions">
                                    <button
                                        onClick={() =>
                                            viewEvidence(item)
                                        }
                                    >
                                        View Evidence
                                    </button>

                                    <button
                                        onClick={() =>
                                            verifyEvidence(item)
                                        }
                                    >
                                        Verify Integrity
                                    </button>

                                    {user?.role === "Lawyer" && (
                                        <button
                                            onClick={() => {
                                                setGrantEvidence(item);
                                                setShowGrantModal(true);
                                                setGrantMessage("");
                                            }}
                                        >
                                            Grant Access
                                        </button>
                                    )}

                                    {user?.role === "Forensic Expert" && (
                                        <button
                                            onClick={() => {
                                                setReportEvidence(item);
                                                setShowReportModal(true);
                                                setReportMessage("");
                                            }}
                                        >
                                            Add Report
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="case-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">
                                    SECURE UPLOAD
                                </span>

                                <h2>
                                    Upload Evidence
                                </h2>

                                <p>
                                    Evidence will be encrypted,
                                    hashed and registered on
                                    Echo Chain.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={uploading}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleUpload}
                        >
                            <div className="modal-input-group">
                                <label>
                                    Select case
                                </label>

                                <select
                                    value={selectedCase}
                                    onChange={(event) =>
                                        setSelectedCase(
                                            event.target.value
                                        )
                                    }
                                    required
                                >
                                    <option value="">
                                        Choose a case
                                    </option>

                                    {cases.map(
                                        (caseItem) => (
                                            <option
                                                key={
                                                    caseItem._id
                                                }
                                                value={
                                                    caseItem._id
                                                }
                                            >
                                                {
                                                    caseItem.title
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="modal-input-group">
                                <label>
                                    Evidence file
                                </label>

                                <input
                                    type="file"
                                    onChange={(event) =>
                                        setSelectedFile(
                                            event.target
                                                .files?.[0] ||
                                                null
                                        )
                                    }
                                    required
                                />

                                {selectedFile && (
                                    <span className="file-selected">
                                        Selected:{" "}
                                        {
                                            selectedFile.name
                                        }
                                    </span>
                                )}
                            </div>

                            <div className="upload-security-box">
                                <div>
                                    <span>01</span>
                                    AES ENCRYPTION
                                </div>

                                <div>
                                    <span>02</span>
                                    SHA-256 HASH
                                </div>

                                <div>
                                    <span>03</span>
                                    BLOCKCHAIN ECHO
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeModal}
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-action"
                                    disabled={uploading}
                                >
                                    {uploading
                                        ? "Securing..."
                                        : "Secure Evidence"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showGrantModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowGrantModal(false)}
                >
                    <div
                        className="case-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">
                                    ACCESS CONTROL
                                </span>

                                <h2>
                                    Grant Evidence Access
                                </h2>

                                <p>
                                    Authorize a Judge or Forensic Expert to view this evidence.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowGrantModal(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-input-group">
                            <label>
                                Authorized User ID
                            </label>

                            <input
                                type="text"
                                value={grantUserId}
                                onChange={(event) =>
                                    setGrantUserId(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter user ID"
                            />
                        </div>

                        <div className="upload-security-box">
                            <div>
                                <span>01</span>
                                AUTHENTICATED USER
                            </div>

                            <div>
                                <span>02</span>
                                VIEW PERMISSION
                            </div>

                            <div>
                                <span>03</span>
                                BLOCKCHAIN ECHO
                            </div>
                        </div>

                        {grantMessage && (
                            <div className="page-error">
                                {grantMessage}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowGrantModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-action"
                                disabled={!grantUserId || !grantEvidence}
                                onClick={handleGrantAccess}
                            >
                                Grant VIEW Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowReportModal(false)}
                >
                    <div
                        className="case-modal report-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">
                                    FORENSIC ANALYSIS
                                </span>

                                <h2>
                                    Add Forensic Report
                                </h2>

                                <p>
                                    Record the forensic examination for this evidence.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowReportModal(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-input-group">
                            <label>
                                Report Title
                            </label>

                            <input
                                type="text"
                                value={reportTitle}
                                onChange={(event) =>
                                    setReportTitle(
                                        event.target.value
                                    )
                                }
                                placeholder="Digital Evidence Examination"
                            />
                        </div>

                        <div className="modal-input-group">
                            <label>
                                Findings
                            </label>

                            <textarea
                                value={findings}
                                onChange={(event) =>
                                    setFindings(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter forensic findings"
                            />
                        </div>

                        <div className="modal-input-group">
                            <label>
                                Conclusion
                            </label>

                            <textarea
                                value={conclusion}
                                onChange={(event) =>
                                    setConclusion(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter examination conclusion"
                            />
                        </div>

                        {reportMessage && (
                            <div className="page-error">
                                {reportMessage}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() =>
                                    setShowReportModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="primary-action"
                                disabled={
                                    !reportTitle ||
                                    !findings ||
                                    !conclusion ||
                                    !reportEvidence
                                }
                                onClick={handleSubmitReport}
                            >
                                Add Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showVerification && (
                <div
                    className="modal-overlay"
                    onClick={() =>
                        setShowVerification(false)
                    }
                >
                    <div
                        className="verification-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            className="modal-close"
                            onClick={() =>
                                setShowVerification(false)
                            }
                        >
                            ×
                        </button>

                        {verifying ? (
                            <div className="verification-loading">
                                <div className="verification-icon">
                                    ◌
                                </div>

                                <span className="eyebrow">
                                    INTEGRITY CHECK
                                </span>

                                <h2>
                                    Verifying Evidence
                                </h2>

                                <p>
                                    Comparing the current
                                    evidence fingerprint
                                    against the blockchain
                                    record.
                                </p>
                            </div>
                        ) : verification ? (
                            <>
                                <div
                                    className={
                                        verification.status ===
                                        "VERIFIED"
                                            ? "verification-icon verified"
                                            : "verification-icon failed"
                                    }
                                >
                                    {verification.status ===
                                    "VERIFIED"
                                        ? "✓"
                                        : "!"}
                                </div>

                                <span className="eyebrow">
                                    INTEGRITY RESULT
                                </span>

                                <h2>
                                    {verification.status ===
                                    "VERIFIED"
                                        ? "Evidence Verified"
                                        : verification.status ===
                                          "TAMPERING_DETECTED"
                                        ? "Tampering Detected"
                                        : "Verification Error"}
                                </h2>

                                <p className="verification-message">
                                    {verification.message}
                                </p>

                                {verification.originalHash && (
                                    <div className="verification-hashes">
                                        <div>
                                            <span>
                                                ORIGINAL HASH
                                            </span>

                                            <code>
                                                {
                                                    verification.originalHash
                                                }
                                            </code>
                                        </div>

                                        <div>
                                            <span>
                                                CURRENT HASH
                                            </span>

                                            <code>
                                                {
                                                    verification.currentHash
                                                }
                                            </code>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={
                                        verification.status ===
                                        "VERIFIED"
                                            ? "verification-status verified-status"
                                            : "verification-status failed-status"
                                    }
                                >
                                    {verification.status ===
                                    "VERIFIED"
                                        ? "✓ INTEGRITY VERIFIED"
                                        : "⚠ TAMPERING DETECTED"}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Evidence;