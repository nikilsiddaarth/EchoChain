import { useState } from "react";
import Cases from "./pages/Cases";
import EchoChain from "./pages/EchoChain";
import Evidence from "./pages/Evidence";
import "./App.css";
import {
    loginUser,
    getStoredUser,
    logoutUser
} from "./services/authService";

function App() {
    const [user, setUser] = useState(getStoredUser());
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleLogin(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await loginUser(email, password);

            setUser(data.user);
            setCurrentPage("dashboard");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        logoutUser();

        setUser(null);
        setEmail("");
        setPassword("");
        setCurrentPage("dashboard");
    }

    function navigateTo(page) {
        setCurrentPage(page);
    }

    function renderPage() {

        if (user?.role === "Judge" && currentPage === "dashboard") {
            return renderJudgeDashboard();
        }
        
        if (currentPage === "cases") {
            return <Cases />;
        }

        if (currentPage === "evidence") {
            return <Evidence />;
        }

        if (currentPage === "echo") {
            return <EchoChain />;
        }

        return (
            <>
                <header className="dashboard-header">
                    <div>
                        <span className="eyebrow">
                            SECURE WORKSPACE
                        </span>

                        <h1>
                            Welcome back, {user.name}
                        </h1>

                        <p>
                            Your evidence infrastructure is ready.
                        </p>
                    </div>

                    <div className="user-badge">
                        <div className="avatar">
                            {user.name
                                ?.charAt(0)
                                .toUpperCase()}
                        </div>

                        <div>
                            <strong>{user.name}</strong>
                            <span>{user.role}</span>
                        </div>
                    </div>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <span className="stat-icon">
                            ▣
                        </span>

                        <span className="stat-label">
                            ACTIVE CASES
                        </span>

                        <strong>01</strong>

                        <small>
                            Currently assigned
                        </small>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            ◈
                        </span>

                        <span className="stat-label">
                            EVIDENCE
                        </span>

                        <strong>01</strong>

                        <small>
                            Protected records
                        </small>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            ⛓
                        </span>

                        <span className="stat-label">
                            ECHO EVENTS
                        </span>

                        <strong>05</strong>

                        <small>
                            Blockchain records
                        </small>
                    </div>

                    <div className="stat-card">
                        <span className="stat-icon">
                            ✓
                        </span>

                        <span className="stat-label">
                            INTEGRITY
                        </span>

                        <strong className="verified-text">
                            VERIFIED
                        </strong>

                        <small>
                            Latest verification
                        </small>
                    </div>
                </section>

                <section className="content-grid">
                    <div className="panel case-panel">
                        <div className="panel-header">
                            <div>
                                <span className="eyebrow">
                                    CASE OVERVIEW
                                </span>

                                <h2>
                                    State vs Alex Carter
                                </h2>
                            </div>

                            <span className="badge">
                                ACTIVE
                            </span>
                        </div>

                        <p className="case-description">
                            Fictional criminal case created for
                            Echo Chain demonstration.
                        </p>

                        <div className="case-meta">
                            <div>
                                <span>
                                    CASE ID
                                </span>

                                <strong>
                                    6a9a6c90...3f2e
                                </strong>
                            </div>

                            <div>
                                <span>
                                    YOUR ROLE
                                </span>

                                <strong>
                                    {user.role}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="panel security-panel">
                        <div className="panel-header">
                            <div>
                                <span className="eyebrow">
                                    SECURITY
                                </span>

                                <h2>
                                    System Status
                                </h2>
                            </div>

                            <span className="live-dot"></span>
                        </div>

                        <div className="security-row">
                            <span>
                                Database
                            </span>

                            <strong>
                                Connected
                            </strong>
                        </div>

                        <div className="security-row">
                            <span>
                                Blockchain
                            </span>

                            <strong>
                                Connected
                            </strong>
                        </div>

                        <div className="security-row">
                            <span>
                                Encryption
                            </span>

                            <strong>
                                Active
                            </strong>
                        </div>

                        <div className="security-row">
                            <span>
                                Access Control
                            </span>

                            <strong>
                                Enabled
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="panel activity-panel">
                    <div className="panel-header">
                        <div>
                            <span className="eyebrow">
                                RECENT ACTIVITY
                            </span>

                            <h2>
                                Echo Chain
                            </h2>
                        </div>

                        <span className="chain-live">
                            ● LIVE
                        </span>
                    </div>

                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-line">
                                <span className="activity-dot"></span>
                            </div>

                            <div>
                                <strong>
                                    Evidence submitted to court
                                </strong>

                                <p>
                                    SUBMITTED_TO_COURT · Test Lawyer
                                </p>
                            </div>

                            <span>
                                14:10
                            </span>
                        </div>

                        <div className="activity-item">
                            <div className="activity-line">
                                <span className="activity-dot"></span>
                            </div>

                            <div>
                                <strong>
                                    Forensic report added
                                </strong>

                                <p>
                                    REPORT_ADDED · Test Forensic Expert
                                </p>
                            </div>

                            <span>
                                12:30
                            </span>
                        </div>

                        <div className="activity-item">
                            <div className="activity-line">
                                <span className="activity-dot"></span>
                            </div>

                            <div>
                                <strong>
                                    Evidence accessed
                                </strong>

                                <p>
                                    ACCESSED · Test Forensic Expert
                                </p>
                            </div>

                            <span>
                                11:05
                            </span>
                        </div>
                    </div>
                </section>
            </>
        );
    }

    function renderJudgeDashboard() {
    return (
        <div className="judge-dashboard">
            <div className="page-header">
                <div>
                    <div className="eyebrow">JUDICIAL REVIEW</div>
                    <h1>Judge Dashboard</h1>
                    <p>Review case evidence, verify integrity, and inspect the Echo Chain.</p>
                </div>
            </div>

            <div className="judge-banner">
                <div className="judge-banner-icon">⚖</div>
                <div>
                    <strong>Evidence Review Mode</strong>
                    <span>
                        Evidence access is controlled by case-level permissions.
                        Blockchain history provides a tamper-evident audit trail.
                    </span>
                </div>
            </div>

            <div className="judge-actions">
                <button onClick={() => navigateTo("cases")}>
                    View Cases
                </button>

                <button onClick={() => navigateTo("evidence")}>
                    Review Evidence
                </button>

                <button onClick={() => navigateTo("echo")}>
                    View Echo Chain
                </button>
            </div>
        </div>
    );
}

    if (!user) {
        return (
            <div className="app">
                <div className="background-grid"></div>

                <div className="glow glow-one"></div>
                <div className="glow glow-two"></div>

                <main className="login-container">
                    <section className="brand-section">
                        <div className="brand-mark">
                            <span>⛓</span>
                        </div>

                        <h1>
                            Echo Chain
                        </h1>

                        <p className="tagline">
                            Secure Evidence Infrastructure
                        </p>

                        <p className="description">
                            A tamper-evident platform for secure court
                            evidence, legal information and chain of custody.
                        </p>

                        <div className="security-points">
                            <div>
                                <span className="status-dot"></span>
                                Blockchain Verified
                            </div>

                            <div>
                                <span className="status-dot"></span>
                                End-to-End Protected
                            </div>

                            <div>
                                <span className="status-dot"></span>
                                Role-Based Access
                            </div>
                        </div>
                    </section>

                    <section className="login-card">
                        <div className="card-header">
                            <span className="eyebrow">
                                SECURE ACCESS
                            </span>

                            <h2>
                                Welcome back
                            </h2>

                            <p>
                                Sign in to access your secure case workspace.
                            </p>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label>
                                    Email address
                                </label>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ✉
                                    </span>

                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>
                                    Password
                                </label>

                                <div className="input-wrapper">
                                    <span className="input-icon">
                                        ◈
                                    </span>

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                    >
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="login-error">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >
                                <span>
                                    {loading
                                        ? "Authenticating..."
                                        : "Sign in securely"}
                                </span>

                                <span className="arrow">
                                    →
                                </span>
                            </button>
                        </form>

                        <div className="login-footer">
                            <span className="lock-icon">
                                ◆
                            </span>

                            Protected access

                            <span className="footer-divider">
                                •
                            </span>

                            Echo Chain Network
                        </div>
                    </section>
                </main>

                <footer className="page-footer">
                    <span>
                        ECHØ CHAIN
                    </span>

                    <span>
                        PRIVATE LEGAL INFRASTRUCTURE
                    </span>

                    <span>
                        v1.0
                    </span>
                </footer>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="small-brand-mark">
                        ⛓
                    </div>

                    <div>
                        <strong>
                            Echo Chain
                        </strong>

                        <span>
                            LEGAL INFRASTRUCTURE
                        </span>
                    </div>
                </div>

                <nav>
                    <div
                        className={`nav-item ${
                            currentPage === "dashboard"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            navigateTo("dashboard")
                        }
                    >
                        <span>⌂</span>
                        Dashboard
                    </div>

                    <div
    className={`nav-item ${
        currentPage === "cases" ? "active" : ""
    }`}
    onClick={() => navigateTo("cases")}
>
    <span>▣</span>
    <span>Cases</span>
</div>
                    <div
                        className={`nav-item ${
                            currentPage === "evidence"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            navigateTo("evidence")
                        }
                    >
                        <span>◈</span>
                        Evidence
                    </div>

                    <div
    className={`nav-item ${
        currentPage === "echo"
            ? "active"
            : ""
    }`}
    onClick={() =>
        navigateTo("echo")
    }
>
    <span>⛓</span>
    Echo Chain
</div>

                    <div className="nav-item">
                        <span>✓</span>
                        Verify Evidence
                    </div>
                </nav>

                <div className="sidebar-bottom">
                    <div className="network-status">
                        <span className="status-dot"></span>
                        Network Online
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                {renderPage()}
            </main>
        </div>
    );
}

export default App;