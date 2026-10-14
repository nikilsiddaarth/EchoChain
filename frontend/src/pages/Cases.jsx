import { useEffect, useState } from "react";

function Cases({ onOpenCase }) {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    async function loadCases() {
        try {
            const token = localStorage.getItem("echoChainToken");

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
                    data.message || "Failed to load cases"
                );
            }

            setCases(data.cases || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCases();
    }, []);

    async function handleCreateCase(event) {
        event.preventDefault();

        setError("");
        setCreating(true);

        try {
            const token =
                localStorage.getItem("echoChainToken");

            const response = await fetch(
                "http://localhost:5000/api/cases",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        description
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to create case"
                );
            }

            setTitle("");
            setDescription("");
            setShowModal(false);

            await loadCases();
        } catch (error) {
            setError(error.message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <span className="eyebrow">
                        CASE MANAGEMENT
                    </span>

                    <h1>Cases</h1>

                    <p>
                        Manage secure legal cases and their
                        associated evidence.
                    </p>
                </div>

                <button
                    className="case-create-button"
                    onClick={() => setShowModal(true)}
                >
                    <span>+</span>
                    New Case
                </button>
            </div>

            <div className="case-overview">
                <div className="overview-card">
                    <div className="overview-icon">
                        ▣
                    </div>

                    <div>
                        <span>ACTIVE CASES</span>
                        <strong>{cases.length}</strong>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon blue">
                        ◈
                    </div>

                    <div>
                        <span>SECURITY</span>
                        <strong>PROTECTED</strong>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon green">
                        ✓
                    </div>

                    <div>
                        <span>ACCESS CONTROL</span>
                        <strong>ENABLED</strong>
                    </div>
                </div>
            </div>

            {error && (
                <div className="page-error">
                    <strong>Something went wrong</strong>
                    <span>{error}</span>
                </div>
            )}

            {loading && (
                <div className="cases-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading secure cases...</span>
                </div>
            )}

            {!loading &&
                !error &&
                cases.length === 0 && (
                    <div className="cases-empty">
                        <div className="empty-icon">
                            ▣
                        </div>

                        <h2>No cases yet</h2>

                        <p>
                            Create your first case to begin
                            managing evidence securely.
                        </p>

                        <button
                            className="case-create-button"
                            onClick={() =>
                                setShowModal(true)
                            }
                        >
                            + Create First Case
                        </button>
                    </div>
                )}

            {!loading && cases.length > 0 && (
                <section className="cases-section">
                    <div className="section-heading">
                        <div>
                            <span className="eyebrow">
                                YOUR CASES
                            </span>

                            <h2>
                                Active legal matters
                            </h2>
                        </div>

                        <span className="case-count">
                            {cases.length} case
                            {cases.length !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                    <div className="cases-grid">
                        {cases.map((caseItem) => (
                            <article
                                className="case-card"
                                key={caseItem._id}
                            >
                                <div className="case-card-top">
                                    <div className="case-card-icon">
                                        ▣
                                    </div>

                                    <span className="active-status">
                                        <span></span>
                                        ACTIVE
                                    </span>
                                </div>

                                <span className="case-number">
                                    CASE RECORD
                                </span>

                                <h2>
                                    {caseItem.title}
                                </h2>

                                <p>
                                    {caseItem.description}
                                </p>

                                <div className="case-card-divider"></div>

                                <div className="case-card-footer">
                                    <div className="case-id-block">
                                        <span>
                                            CASE ID
                                        </span>

                                        <strong>
                                            {caseItem._id}
                                        </strong>
                                    </div>

                                    <button
                                        className="view-case"
                                        onClick={() =>
                                            onOpenCase(caseItem._id)
                                        }
                                    >
                                        Open
                                        <span>→</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() =>
                        !creating &&
                        setShowModal(false)
                    }
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
                                    NEW CASE
                                </span>

                                <h2>
                                    Create a secure case
                                </h2>

                                <p>
                                    Add the basic information
                                    for this legal case.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowModal(false)
                                }
                                disabled={creating}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleCreateCase}
                        >
                            <div className="modal-input-group">
                                <label>
                                    Case title
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. State vs Alex Carter"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="modal-input-group">
                                <label>
                                    Case description
                                </label>

                                <textarea
                                    placeholder="Enter a short description of the case..."
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    rows="5"
                                    required
                                />
                            </div>

                            <div className="secure-notice">
                                <span>◆</span>

                                <div>
                                    <strong>
                                        Secure case record
                                    </strong>

                                    <p>
                                        Case information is
                                        protected by Echo Chain
                                        access controls.
                                    </p>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() =>
                                        setShowModal(false)
                                    }
                                    disabled={creating}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-action"
                                    disabled={creating}
                                >
                                    {creating
                                        ? "Creating..."
                                        : "Create Case"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Cases;