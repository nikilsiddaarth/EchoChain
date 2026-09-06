import { useEffect, useState } from "react";

function Cases() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        let cancelled = false;

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

                if (!cancelled) {
                    setCases(data.cases || []);
                    setError("");
                }
            } catch (error) {
                if (!cancelled) {
                    setError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchCases();

        return () => {
            cancelled = true;
        };
    }, []);

    async function refreshCases() {
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
                    data.message ||
                        "Failed to create case"
                );
            }

            setTitle("");
            setDescription("");
            setShowModal(false);

            await refreshCases();
        } catch (error) {
            setError(error.message);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="page-content">
            <div className="page-heading">
                <div>
                    <span className="eyebrow">
                        CASE MANAGEMENT
                    </span>

                    <h1>Cases</h1>

                    <p>
                        Manage and review your secure legal
                        cases.
                    </p>
                </div>

                <button
                    className="primary-action"
                    onClick={() =>
                        setShowModal(true)
                    }
                >
                    + New Case
                </button>
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    Loading secure cases...
                </div>
            )}

            {!loading &&
                !error &&
                cases.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">
                            ▣
                        </div>

                        <h2>No cases found</h2>

                        <p>
                            Create your first case to begin
                            managing evidence securely.
                        </p>
                    </div>
                )}

            {!loading &&
                cases.length > 0 && (
                    <div className="cases-grid">
                        {cases.map((caseItem) => (
                            <div
                                className="case-card"
                                key={caseItem._id}
                            >
                                <div className="case-card-top">
                                    <div className="case-card-icon">
                                        ▣
                                    </div>

                                    <span className="badge">
                                        ACTIVE
                                    </span>
                                </div>

                                <span className="case-number">
                                    CASE
                                </span>

                                <h2>
                                    {caseItem.title}
                                </h2>

                                <p>
                                    {caseItem.description}
                                </p>

                                <div className="case-card-footer">
                                    <div>
                                        <span>
                                            CASE ID
                                        </span>

                                        <strong>
                                            {caseItem._id}
                                        </strong>
                                    </div>

                                    <button className="view-case">
                                        View Case →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                                    Description
                                </label>

                                <textarea
                                    placeholder="Brief description of the case..."
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