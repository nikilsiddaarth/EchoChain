/**
 * FederatedLearning.jsx - Full-Featured Federated Learning Lab for EchoChain.
 * Integrates:
 * 1. Overview & Architectural Topology
 * 2. Federated Forensic Client Nodes
 * 3. Background Training Center & SVG Accuracy Progression
 * 4. Forensic Evidence Tampering Predictor
 * 5. Cryptographic Audit Trail Ledger
 * 6. Blockchain Verification & Notarization Console
 */

import React, { useState, useEffect } from "react";
import { getStoredUser } from "../services/authService";
import {
    getFLStatus,
    getFLClients,
    getFLAuditLog,
    getFLBlockchainStatus,
    predictFLEvidence,
    startFLTraining,
    getFLJobStatus,
    notarizeFLRound
} from "../services/flService";
import FLAccuracyChart from "../components/FLAccuracyChart";

export default function FederatedLearning() {
    const user = getStoredUser();
    const isAuthorizedRole = user && (user.role === "Forensic Expert" || user.role === "Lawyer");

    // Sub-navigation tab
    const [activeTab, setActiveTab] = useState("overview");

    // Data states
    const [statusData, setStatusData] = useState(null);
    const [clientsData, setClientsData] = useState(null);
    const [auditRecords, setAuditRecords] = useState([]);
    const [blockchainData, setBlockchainData] = useState(null);

    // Global loading and error states
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [copyNotice, setCopyNotice] = useState("");

    // Training Center states
    const [trainRounds, setTrainRounds] = useState(10);
    const [activeJobId, setActiveJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null); // 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    const [jobDetails, setJobDetails] = useState(null);
    const [trainingError, setTrainingError] = useState("");

    // Prediction Form states
    const [predInputs, setPredInputs] = useState({
        metadata_changed: 1,
        hash_matches: 0,
        size_change_ratio: 0.8,
        unusual_access: 1
    });
    const [predResult, setPredResult] = useState(null);
    const [predicting, setPredicting] = useState(false);
    const [predError, setPredError] = useState("");

    // Notarization Modal states
    const [selectedRoundForNotarize, setSelectedRoundForNotarize] = useState(null);
    const [notarizeModalOpen, setNotarizeModalOpen] = useState(false);
    const [notarizing, setNotarizing] = useState(false);
    const [notarizeResult, setNotarizeResult] = useState(null);
    const [notarizeError, setNotarizeError] = useState("");

    // Initial load
    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        setLoading(true);
        setPageError("");
        try {
            const [statusRes, clientsRes, auditRes, bcRes] = await Promise.all([
                getFLStatus().catch(e => ({ error: e.message })),
                getFLClients().catch(e => ({ error: e.message })),
                getFLAuditLog().catch(e => ({ error: e.message })),
                getFLBlockchainStatus().catch(e => ({ error: e.message }))
            ]);

            if (statusRes.data) setStatusData(statusRes.data);
            if (clientsRes.data) setClientsData(clientsRes.data);
            if (auditRes.records) setAuditRecords(auditRes.records);
            if (bcRes) setBlockchainData(bcRes);

            if (statusRes.error && clientsRes.error && auditRes.error) {
                setPageError("Unable to communicate with the FL service. Verify that the backend and microservice are online.");
            }
        } catch (err) {
            setPageError(err.message || "Failed to load Federated Learning data.");
        } finally {
            setLoading(false);
        }
    }

    // Polling effect for background training job
    useEffect(() => {
        let interval = null;
        if (activeJobId && (jobStatus === "QUEUED" || jobStatus === "RUNNING")) {
            interval = setInterval(async () => {
                try {
                    const res = await getFLJobStatus(activeJobId);
                    if (res.job) {
                        setJobDetails(res.job);
                        setJobStatus(res.job.status);
                        if (res.job.status === "COMPLETED") {
                            clearInterval(interval);
                            // Refresh audit log and status
                            const [newStatus, newAudit] = await Promise.all([
                                getFLStatus(),
                                getFLAuditLog()
                            ]);
                            if (newStatus.data) setStatusData(newStatus.data);
                            if (newAudit.records) setAuditRecords(newAudit.records);
                        } else if (res.job.status === "FAILED") {
                            clearInterval(interval);
                            setTrainingError(res.job.error || "Training execution failed.");
                        }
                    }
                } catch (err) {
                    console.error("Error polling job status:", err);
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeJobId, jobStatus]);

    async function handleStartTraining(e) {
        e.preventDefault();
        setTrainingError("");
        setJobDetails(null);
        try {
            const res = await startFLTraining(trainRounds);
            if (res.jobId) {
                setActiveJobId(res.jobId);
                setJobStatus(res.status || "QUEUED");
            }
        } catch (err) {
            setTrainingError(err.message || "Failed to start training job.");
        }
    }

    async function handlePredict(e) {
        e.preventDefault();
        setPredicting(true);
        setPredError("");
        setPredResult(null);
        try {
            const res = await predictFLEvidence(predInputs);
            if (res.data && res.data.prediction) {
                setPredResult(res.data.prediction);
            }
        } catch (err) {
            setPredError(err.message || "Prediction failed.");
        } finally {
            setPredicting(false);
        }
    }

    function openNotarizeModal(roundObj) {
        setSelectedRoundForNotarize(roundObj);
        setNotarizeResult(null);
        setNotarizeError("");
        setNotarizeModalOpen(true);
    }

    async function handleConfirmNotarize() {
        if (!selectedRoundForNotarize) return;
        setNotarizing(true);
        setNotarizeError("");
        setNotarizeResult(null);

        try {
            const res = await notarizeFLRound(selectedRoundForNotarize.round);
            if (res.notarization) {
                setNotarizeResult(res.notarization);
                // Refresh blockchain status to update confirmed hashes
                const bcRes = await getFLBlockchainStatus();
                if (bcRes) setBlockchainData(bcRes);
            }
        } catch (err) {
            setNotarizeError(err.message || "Blockchain notarization rejected.");
        } finally {
            setNotarizing(false);
        }
    }

    function copyToClipboard(text, label = "Hash") {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopyNotice(`${label} copied to clipboard`);
        setTimeout(() => setCopyNotice(""), 2500);
    }

    // Chart data mapping from genuine audit records
    const chartPoints = auditRecords.map(r => ({
        round: r.round,
        test_accuracy: r.test_accuracy
    }));

    // Blockchain status helper
    const bcVerification = blockchainData?.blockchain_verification;
    const isRpcOnline = Boolean(bcVerification?.online);
    const isChainIdMatch = Boolean(bcVerification?.chainIdMatch);
    const isBytecodePresent = Boolean(bcVerification?.bytecodePresent);
    const expectedChainId = bcVerification?.expectedChainId || "Not specified by backend";
    const connectedChainId = bcVerification?.chainId || "Disconnected";

    return (
        <div className="page-content fl-dashboard-root">
            {/* Header */}
            <div className="page-heading">
                <div>
                    <span className="eyebrow">PRIVACY-PRESERVING AI INFRASTRUCTURE</span>
                    <h1>Federated Learning Forensic Lab</h1>
                    <p>
                        Collaborative evidence anomaly analysis using Federated Averaging (FedAvg) and cryptographic SHA-256 parameter notarization.
                    </p>
                </div>

                <div className="fl-system-badge">
                    <span className={`status-dot ${isRpcOnline && isBytecodePresent ? "" : "dot-amber"}`}></span>
                    <strong>{statusData?.aggregation_algorithm || "FedAvg Core"}</strong>
                </div>
            </div>

            {pageError && <div className="page-error">{pageError}</div>}
            {copyNotice && <div className="fl-toast-notice">{copyNotice}</div>}

            {/* Navigation Tabs */}
            <nav className="fl-tab-nav">
                <button
                    className={`fl-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    <span>▣</span> Overview & Topology
                </button>
                <button
                    className={`fl-tab-btn ${activeTab === "training" ? "active" : ""}`}
                    onClick={() => setActiveTab("training")}
                >
                    <span>⚡</span> Training Center
                </button>
                <button
                    className={`fl-tab-btn ${activeTab === "clients" ? "active" : ""}`}
                    onClick={() => setActiveTab("clients")}
                >
                    <span>◈</span> Forensic Nodes
                </button>
                <button
                    className={`fl-tab-btn ${activeTab === "predict" ? "active" : ""}`}
                    onClick={() => setActiveTab("predict")}
                >
                    <span>⚖</span> Tampering Inspector
                </button>
                <button
                    className={`fl-tab-btn ${activeTab === "audit" ? "active" : ""}`}
                    onClick={() => setActiveTab("audit")}
                >
                    <span>✓</span> Audit & Notarization
                </button>
            </nav>

            {loading ? (
                <div className="loading-state">
                    Loading Federated Learning telemetry...
                </div>
            ) : (
                <div className="fl-tab-content">
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="fl-overview-view">
                            {/* KPI Grid */}
                            <section className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-icon">◈</span>
                                    <span className="stat-label">PARTICIPATING NODES</span>
                                    <strong>{statusData?.clients_count ?? 2} Departments</strong>
                                    <small>Isolated local storage</small>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">⚡</span>
                                    <span className="stat-label">CURRENT ROUND</span>
                                    <strong>Round {statusData?.current_round ?? 0}</strong>
                                    <small>{statusData?.total_training_records ?? 600} sample records</small>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">✓</span>
                                    <span className="stat-label">TEST ACCURACY</span>
                                    <strong className="verified-text">
                                        {statusData?.test_accuracy ? `${(statusData.test_accuracy * 100).toFixed(2)}%` : "N/A"}
                                    </strong>
                                    <small>Hold-out test evaluation</small>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-icon">⛓</span>
                                    <span className="stat-label">GLOBAL MODEL DIGEST</span>
                                    <strong className="fl-hash-mono" title={statusData?.latest_model_hash}>
                                        {statusData?.latest_model_hash
                                            ? `${statusData.latest_model_hash.slice(0, 10)}...${statusData.latest_model_hash.slice(-6)}`
                                            : "Pending"}
                                    </strong>
                                    <small>Cryptographic SHA-256</small>
                                </div>
                            </section>

                            {/* Architecture Topology Diagram */}
                            <section className="panel fl-topology-card">
                                <div className="panel-header">
                                    <div>
                                        <span className="eyebrow">DISTRIBUTED ARCHITECTURE</span>
                                        <h2>Federated Averaging (FedAvg) Flow</h2>
                                    </div>
                                    <span className="badge">PRIVACY PROTOCOL ACTIVE</span>
                                </div>

                                <div className="fl-topology-diagram">
                                    <div className="fl-node-box">
                                        <div className="fl-node-header">
                                            <span className="fl-node-dot"></span>
                                            <strong>Department A</strong>
                                        </div>
                                        <p>Cyber Forensics Lab</p>
                                        <span className="fl-node-tag">300 private records</span>
                                        <div className="fl-node-arrow-down">↓ Weights & Bias (No Raw Data)</div>
                                    </div>

                                    <div className="fl-node-box fl-aggregator-box">
                                        <div className="fl-node-header">
                                            <span className="fl-node-dot dot-cyan"></span>
                                            <strong>EchoChain FedAvg Aggregator</strong>
                                        </div>
                                        <p className="fl-formula">W_global = Σ(W_i * n_i) / Σ(n_i)</p>
                                        <div className="fl-agg-meta">
                                            <span>Accuracy: {statusData?.test_accuracy ? `${(statusData.test_accuracy * 100).toFixed(2)}%` : "N/A"}</span>
                                            <span>SHA-256 Digest Prepared</span>
                                        </div>
                                    </div>

                                    <div className="fl-node-box">
                                        <div className="fl-node-header">
                                            <span className="fl-node-dot"></span>
                                            <strong>Department B</strong>
                                        </div>
                                        <p>Digital Evidence Bureau</p>
                                        <span className="fl-node-tag">300 private records</span>
                                        <div className="fl-node-arrow-down">↓ Weights & Bias (No Raw Data)</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* TAB 2: TRAINING CENTER */}
                    {activeTab === "training" && (
                        <div className="fl-training-view">
                            <div className="fl-split-layout">
                                {/* Training Controls */}
                                <section className="panel fl-control-panel">
                                    <div className="panel-header">
                                        <div>
                                            <span className="eyebrow">MODEL OPTIMIZATION</span>
                                            <h2>Execute Federated Training</h2>
                                        </div>
                                    </div>

                                    <p className="fl-panel-desc">
                                        Launches a background training job across participating forensic departments.
                                        Local gradients are calculated and aggregated via sample-weighted FedAvg.
                                    </p>

                                    <form onSubmit={handleStartTraining}>
                                        <div className="input-group">
                                            <label>Number of Training Rounds (1 to 25):</label>
                                            <div className="fl-rounds-input-wrap">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="25"
                                                    value={trainRounds}
                                                    onChange={e => setTrainRounds(e.target.value)}
                                                    disabled={jobStatus === "QUEUED" || jobStatus === "RUNNING"}
                                                    required
                                                />
                                                <button
                                                    type="submit"
                                                    className="primary-action"
                                                    disabled={jobStatus === "QUEUED" || jobStatus === "RUNNING" || !isAuthorizedRole}
                                                >
                                                    {jobStatus === "QUEUED" || jobStatus === "RUNNING"
                                                        ? "Training in Progress..."
                                                        : "Start Federated Training"}
                                                </button>
                                            </div>
                                            {!isAuthorizedRole && (
                                                <small className="fl-hint-text">
                                                    Review mode: Only Forensic Experts and Lawyers can trigger new training jobs.
                                                </small>
                                            )}
                                        </div>
                                    </form>

                                    {trainingError && <div className="page-error">{trainingError}</div>}

                                    {/* Active Job State */}
                                    {jobStatus && (
                                        <div className={`fl-job-tracker status-${jobStatus.toLowerCase()}`}>
                                            <div className="fl-job-header">
                                                <span className="eyebrow">JOB TELEMETRY</span>
                                                <span className={`fl-status-pill pill-${jobStatus.toLowerCase()}`}>
                                                    {jobStatus}
                                                </span>
                                            </div>
                                            <div className="fl-job-id">
                                                <span>Job ID:</span>
                                                <code>{activeJobId}</code>
                                            </div>
                                            {jobDetails?.result?.data && (
                                                <div className="fl-job-result-metrics">
                                                    <div>
                                                        <span>Final Test Accuracy:</span>
                                                        <strong>{(jobDetails.result.data.final_accuracy * 100).toFixed(2)}%</strong>
                                                    </div>
                                                    <div>
                                                        <span>Latest Model Hash:</span>
                                                        <code className="select-all">{jobDetails.result.data.latest_model_hash.slice(0, 20)}...</code>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Accuracy Progression Chart */}
                                <section className="panel fl-chart-panel">
                                    <div className="panel-header">
                                        <div>
                                            <span className="eyebrow">CONVERGENCE CURVE</span>
                                            <h2>Test Accuracy Progression</h2>
                                        </div>
                                        <span className="badge">GENUINE METRICS</span>
                                    </div>
                                    <FLAccuracyChart
                                        data={chartPoints}
                                        finalAccuracy={statusData?.test_accuracy}
                                        height={260}
                                    />
                                </section>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: FORENSIC CLIENT NODES */}
                    {activeTab === "clients" && (
                        <div className="fl-clients-view">
                            <div className="panel fl-privacy-banner">
                                <div className="fl-privacy-icon">🛡️</div>
                                <div>
                                    <strong>Privacy Guarantee Protocol</strong>
                                    <p>
                                        {clientsData?.privacy_protocol ||
                                            "Raw forensic records are kept strictly on-premises; only gradients and sample counts are transmitted to the server."}
                                    </p>
                                </div>
                            </div>

                            <div className="fl-clients-grid">
                                {(clientsData?.clients || []).map((client, idx) => (
                                    <div key={client.id || idx} className="panel fl-client-card">
                                        <div className="panel-header">
                                            <div>
                                                <span className="eyebrow">NODE {client.id ? client.id.toUpperCase() : `#${idx + 1}`}</span>
                                                <h2>{client.name}</h2>
                                            </div>
                                            <span className="fl-status-pill pill-online">{client.status}</span>
                                        </div>
                                        <p className="fl-client-sub">{client.subdivision}</p>

                                        <div className="fl-client-stats">
                                            <div className="fl-c-stat">
                                                <span>Private Dataset Size</span>
                                                <strong>{client.sample_count} Records</strong>
                                            </div>
                                            <div className="fl-c-stat">
                                                <span>Simulation Seed</span>
                                                <strong>Seed {client.seed}</strong>
                                            </div>
                                        </div>

                                        <div className="fl-data-policy">
                                            <span>Data Isolation:</span>
                                            <p>{client.data_privacy}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: FORENSIC EVIDENCE PREDICTOR */}
                    {activeTab === "predict" && (
                        <div className="fl-predict-view">
                            <div className="fl-split-layout">
                                {/* Input Form */}
                                <section className="panel">
                                    <div className="panel-header">
                                        <div>
                                            <span className="eyebrow">EVALUATION CONSOLE</span>
                                            <h2>Forensic Metadata Classifier</h2>
                                        </div>
                                    </div>
                                    <p className="fl-panel-desc">
                                        Test evidence record attributes against the global federated model parameters to evaluate tampering probability.
                                    </p>

                                    <form onSubmit={handlePredict} className="fl-predict-form">
                                        <div className="fl-form-row">
                                            <label>File Metadata Modified:</label>
                                            <select
                                                value={predInputs.metadata_changed}
                                                onChange={e => setPredInputs({ ...predInputs, metadata_changed: Number(e.target.value) })}
                                            >
                                                <option value={1}>Yes (Metadata altered or mismatched)</option>
                                                <option value={0}>No (Metadata intact)</option>
                                            </select>
                                        </div>

                                        <div className="fl-form-row">
                                            <label>Cryptographic Hash Matches:</label>
                                            <select
                                                value={predInputs.hash_matches}
                                                onChange={e => setPredInputs({ ...predInputs, hash_matches: Number(e.target.value) })}
                                            >
                                                <option value={1}>Yes (Hash verified against original)</option>
                                                <option value={0}>No (Hash mismatch detected)</option>
                                            </select>
                                        </div>

                                        <div className="fl-form-row">
                                            <label>Size Alteration Ratio (0.0 to 2.0):</label>
                                            <div className="fl-slider-wrap">
                                                <input
                                                    type="range"
                                                    min="0.0"
                                                    max="2.0"
                                                    step="0.05"
                                                    value={predInputs.size_change_ratio}
                                                    onChange={e => setPredInputs({ ...predInputs, size_change_ratio: parseFloat(e.target.value) })}
                                                />
                                                <span className="fl-slider-val">{predInputs.size_change_ratio.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="fl-form-row">
                                            <label>Unusual Access / Timestamp Anomaly:</label>
                                            <select
                                                value={predInputs.unusual_access}
                                                onChange={e => setPredInputs({ ...predInputs, unusual_access: Number(e.target.value) })}
                                            >
                                                <option value={1}>Yes (Accessed outside shift / unauthorized custody)</option>
                                                <option value={0}>No (Standard authorized chain of custody)</option>
                                            </select>
                                        </div>

                                        <button type="submit" className="primary-action" disabled={predicting}>
                                            {predicting ? "Classifying..." : "Evaluate Evidence Record"}
                                        </button>
                                    </form>

                                    {predError && <div className="page-error">{predError}</div>}
                                </section>

                                {/* Classification Output */}
                                <section className="panel fl-result-panel">
                                    <div className="panel-header">
                                        <div>
                                            <span className="eyebrow">INFERENCE OUTPUT</span>
                                            <h2>Model Assessment</h2>
                                        </div>
                                    </div>

                                    {predResult ? (
                                        <div className={`fl-inference-card ${predResult.label === "SUSPICIOUS" ? "status-suspicious" : "status-normal"}`}>
                                            <div className="fl-inf-header">
                                                <span className="fl-inf-icon">
                                                    {predResult.label === "SUSPICIOUS" ? "⚠️" : "✓"}
                                                </span>
                                                <div>
                                                    <span className="stat-label">CLASSIFICATION RESULT</span>
                                                    <h3 className={predResult.label === "SUSPICIOUS" ? "text-danger" : "verified-text"}>
                                                        {predResult.label}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="fl-prob-section">
                                                <div className="fl-prob-labels">
                                                    <span>Tampering Likelihood:</span>
                                                    <strong>{predResult.probability_percent}%</strong>
                                                </div>
                                                <div className="fl-prob-bar-track">
                                                    <div
                                                        className={`fl-prob-bar-fill ${predResult.label === "SUSPICIOUS" ? "bg-red" : "bg-green"}`}
                                                        style={{ width: `${predResult.probability_percent}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <p className="fl-academic-note">
                                                Note: Synthetic educational demonstration only. Not a legally validated forensic determination.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="fl-result-empty">
                                            <div className="fl-chart-empty-icon">⚖</div>
                                            <p>Submit metadata parameters on the left to inspect model classification score.</p>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: AUDIT HISTORY & BLOCKCHAIN NOTARIZATION */}
                    {activeTab === "audit" && (
                        <div className="fl-audit-view">
                            {/* Blockchain Verification Card */}
                            <section className="panel fl-bc-verify-panel">
                                <div className="panel-header">
                                    <div>
                                        <span className="eyebrow">SMART CONTRACT TELEMETRY</span>
                                        <h2>Blockchain Integration & Network Verification</h2>
                                    </div>
                                    <span className={`fl-status-pill ${isRpcOnline && isBytecodePresent ? "pill-online" : "pill-amber"}`}>
                                        {isRpcOnline && isBytecodePresent ? "CONTRACT VERIFIED" : "PENDING NOTARIZATION"}
                                    </span>
                                </div>

                                <div className="fl-bc-grid">
                                    <div className="fl-bc-item">
                                        <span>RPC Provider Status</span>
                                        <strong className={isRpcOnline ? "verified-text" : "text-amber"}>
                                            {isRpcOnline ? "ONLINE (127.0.0.1:8545)" : "OFFLINE / UNREACHABLE"}
                                        </strong>
                                    </div>
                                    <div className="fl-bc-item">
                                        <span>Connected Chain ID</span>
                                        <strong>{connectedChainId}</strong>
                                    </div>
                                    <div className="fl-bc-item">
                                        <span>Expected Chain ID</span>
                                        <strong>{expectedChainId}</strong>
                                    </div>
                                    <div className="fl-bc-item">
                                        <span>Contract Address</span>
                                        <code className="select-all">
                                            {bcVerification?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
                                        </code>
                                    </div>
                                    <div className="fl-bc-item">
                                        <span>Contract Bytecode</span>
                                        <strong>
                                            {isBytecodePresent
                                                ? `Verified (${bcVerification?.bytecodeLength} bytes)`
                                                : "No Bytecode Detected"}
                                        </strong>
                                    </div>
                                </div>

                                <p className="fl-bc-msg">
                                    Status Note: {bcVerification?.message || "Verification telemetric received from backend."}
                                </p>
                            </section>

                            {/* Audit Trail Table */}
                            <section className="panel fl-audit-table-panel">
                                <div className="panel-header">
                                    <div>
                                        <span className="eyebrow">IMMUTABLE PARAMETER DIGESTS</span>
                                        <h2>Training Audit Trail & Model Fingerprints</h2>
                                    </div>
                                    <span className="badge">{auditRecords.length} Total Rounds</span>
                                </div>

                                <div className="fl-table-responsive">
                                    <table className="fl-table">
                                        <thead>
                                            <tr>
                                                <th>Round</th>
                                                <th>Source Type</th>
                                                <th>Accuracy</th>
                                                <th>SHA-256 Model Digest</th>
                                                <th>On-Chain Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center p-6">
                                                        No training rounds recorded yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                auditRecords.map(r => (
                                                    <tr key={`round-${r.round}`}>
                                                        <td>
                                                            <strong>Round {String(r.round).padStart(2, "0")}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="fl-source-badge">
                                                                {r.round <= 10 ? "Historical Reference" : "Live Executed"}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-accuracy">
                                                                {(r.test_accuracy * 100).toFixed(2)}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <code className="fl-hash-mono">
                                                                {r.model_hash.slice(0, 16)}...{r.model_hash.slice(-8)}
                                                            </code>
                                                        </td>
                                                        <td>
                                                            <span className="fl-status-pill pill-amber">
                                                                Ready for Notarization
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="fl-action-btns">
                                                                <button
                                                                    className="fl-btn-sm"
                                                                    onClick={() => copyToClipboard(r.model_hash, `Round ${r.round} Hash`)}
                                                                >
                                                                    Copy Hash
                                                                </button>
                                                                <button
                                                                    className="fl-btn-sm fl-btn-notarize"
                                                                    onClick={() => openNotarizeModal(r)}
                                                                    disabled={!isAuthorizedRole}
                                                                    title={!isAuthorizedRole ? "Only Lawyers or Forensic Experts can notarize" : ""}
                                                                >
                                                                    Notarize
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            )}

            {/* NOTARIZATION CONFIRMATION MODAL */}
            {notarizeModalOpen && selectedRoundForNotarize && (
                <div className="modal-backdrop">
                    <div className="modal-card fl-modal">
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">BLOCKCHAIN ANCHORING</span>
                                <h2>Confirm Model Notarization</h2>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => setNotarizeModalOpen(false)}
                                disabled={notarizing}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <p>
                                You are about to record the cryptographic SHA-256 model digest for <strong>Round {selectedRoundForNotarize.round}</strong> into EchoChain’s smart contract.
                            </p>

                            <div className="fl-modal-param-box">
                                <div>
                                    <span>Target Round:</span>
                                    <strong>Round {selectedRoundForNotarize.round}</strong>
                                </div>
                                <div>
                                    <span>Model Accuracy:</span>
                                    <strong>{(selectedRoundForNotarize.test_accuracy * 100).toFixed(2)}%</strong>
                                </div>
                                <div>
                                    <span>Trusted Model Hash:</span>
                                    <code className="select-all">{selectedRoundForNotarize.model_hash}</code>
                                </div>
                                <div>
                                    <span>Target Contract:</span>
                                    <code>{bcVerification?.contractAddress || "EchoChain.sol"}</code>
                                </div>
                            </div>

                            {notarizeError && (
                                <div className="page-error">
                                    {notarizeError}
                                </div>
                            )}

                            {notarizeResult && (
                                <div className="fl-success-banner">
                                    <strong>✓ Notarization Confirmed on Blockchain!</strong>
                                    <div className="fl-tx-details">
                                        <div>
                                            <span>Transaction Hash:</span>
                                            <code className="select-all">{notarizeResult.transactionHash}</code>
                                        </div>
                                        <div>
                                            <span>Block Number:</span>
                                            <strong>{notarizeResult.blockNumber}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="secondary-action"
                                onClick={() => setNotarizeModalOpen(false)}
                                disabled={notarizing}
                            >
                                {notarizeResult ? "Close" : "Cancel"}
                            </button>

                            {!notarizeResult && (
                                <button
                                    className="primary-action"
                                    onClick={handleConfirmNotarize}
                                    disabled={notarizing || !isRpcOnline || !isBytecodePresent}
                                >
                                    {notarizing ? "Transacting with Contract..." : "Confirm & Record On-Chain"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
