/**
 * FLAccuracyChart.jsx - Responsive SVG Line Chart for Federated Learning Accuracy.
 * Zero external dependencies. Uses only genuine accuracy data returned by the backend.
 * Renders an empty state if no round-by-round points are available.
 */

import React from "react";

export default function FLAccuracyChart({ data = [], finalAccuracy = null, height = 240 }) {
    // data is expected to be an array of: { round: number, test_accuracy: number }
    const validPoints = Array.isArray(data)
        ? data.filter(d => typeof d.round === "number" && typeof d.test_accuracy === "number")
        : [];

    if (validPoints.length === 0) {
        return (
            <div className="fl-chart-empty-state">
                <div className="fl-chart-empty-icon">📈</div>
                <h4>No Round-by-Round Data Available</h4>
                <p>
                    {finalAccuracy !== null
                        ? `Final Model Accuracy: ${(finalAccuracy * 100).toFixed(2)}%`
                        : "Execute a federated training run to generate accuracy progression points."}
                </p>
            </div>
        );
    }

    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const svgWidth = 600;
    const svgHeight = height;

    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    // Determine scale bounds
    const minRound = Math.min(...validPoints.map(p => p.round));
    const maxRound = Math.max(...validPoints.map(p => p.round));
    const roundSpan = Math.max(maxRound - minRound, 1);

    // Y scale: 50% to 100% or min to max with breathing room
    const rawMinAcc = Math.min(...validPoints.map(p => p.test_accuracy));
    const rawMaxAcc = Math.max(...validPoints.map(p => p.test_accuracy));
    const minY = Math.max(0, Math.floor(rawMinAcc * 10) / 10 - 0.05);
    const maxY = Math.min(1.0, Math.ceil(rawMaxAcc * 10) / 10 + 0.05);
    const ySpan = Math.max(maxY - minY, 0.1);

    const getX = (round) => padding.left + ((round - minRound) / roundSpan) * chartWidth;
    const getY = (acc) => padding.top + chartHeight - ((acc - minY) / ySpan) * chartHeight;

    // Generate path points
    const pointsStr = validPoints.map(p => `${getX(p.round)},${getY(p.test_accuracy)}`).join(" ");

    // Generate area fill path
    const firstPoint = validPoints[0];
    const lastPoint = validPoints[validPoints.length - 1];
    const areaPath = `M ${getX(firstPoint.round)},${padding.top + chartHeight} L ${validPoints.map(p => `${getX(p.round)},${getY(p.test_accuracy)}`).join(" L ")} L ${getX(lastPoint.round)},${padding.top + chartHeight} Z`;

    // Horizontal grid lines (4 lines)
    const gridTicks = [minY, minY + ySpan * 0.33, minY + ySpan * 0.66, maxY];

    return (
        <div className="fl-svg-chart-container">
            <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="fl-accuracy-svg"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="flChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0891b2" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Grid lines and Y labels */}
                {gridTicks.map((val, idx) => {
                    const yPos = getY(val);
                    return (
                        <g key={`grid-${idx}`}>
                            <line
                                x1={padding.left}
                                y1={yPos}
                                x2={padding.left + chartWidth}
                                y2={yPos}
                                stroke="#e2e8f0"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={padding.left - 10}
                                y={yPos + 4}
                                textAnchor="end"
                                className="fl-chart-axis-label"
                            >
                                {(val * 100).toFixed(0)}%
                            </text>
                        </g>
                    );
                })}

                {/* Area under curve */}
                <path d={areaPath} fill="url(#flChartGradient)" />

                {/* Main line */}
                <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsStr}
                />

                {/* Point dots and X labels */}
                {validPoints.map((p, idx) => {
                    const cx = getX(p.round);
                    const cy = getY(p.test_accuracy);
                    return (
                        <g key={`point-${idx}`}>
                            <circle
                                cx={cx}
                                cy={cy}
                                r="4.5"
                                fill="#0369a1"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                            <text
                                x={cx}
                                y={padding.top + chartHeight + 18}
                                textAnchor="middle"
                                className="fl-chart-axis-label"
                            >
                                R{p.round}
                            </text>
                        </g>
                    );
                })}

                {/* Axis Titles */}
                <text
                    x={padding.left + chartWidth / 2}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className="fl-chart-axis-title"
                >
                    Training Rounds
                </text>
                <text
                    x={-svgHeight / 2}
                    y="14"
                    transform="rotate(-90)"
                    textAnchor="middle"
                    className="fl-chart-axis-title"
                >
                    Test Accuracy (%)
                </text>
            </svg>
        </div>
    );
}
