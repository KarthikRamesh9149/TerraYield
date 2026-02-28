/**
 * PolicySimulator Panel (Feature 3)
 * Upload CSV/XLSX → validate → red flags → arbitrage → roadmap → brief → PDF
 */

import { useState, useRef, useCallback } from 'react';
import { parseAndValidatePolicyFile } from '../../utils/policyParser';
import { detectRedFlags } from '../../domain/policyRedFlags';
import { calculateArbitrage } from '../../domain/policyArbitrage';
import {
    generate3YearRoadmap,
    calculatePoliticalFeasibility,
} from '../../domain/policyRoadmap';

const USE_REAL_API = false;

function PolicySimulator({ districtId }) {
    const fileInputRef = useRef(null);

    // State
    const [fileName, setFileName] = useState(null);
    const [validRows, setValidRows] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [redFlags, setRedFlags] = useState([]);
    const [arbitrage, setArbitrage] = useState([]);
    const [roadmap, setRoadmap] = useState(null);
    const [feasibility, setFeasibility] = useState(null);
    const [cabinetBrief, setCabinetBrief] = useState('');
    const [briefLoading, setBriefLoading] = useState(false);
    const [polishLoading, setPolishLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pdfExporting, setPdfExporting] = useState(false);

    // Cached data
    const [cropsDb, setCropsDb] = useState(null);
    const [districtsMap, setDistrictsMap] = useState(null);

    /**
     * Load crops database and district data
     */
    const loadReferenceData = useCallback(async () => {
        if (cropsDb && districtsMap) return { cropsDb, districtsMap };

        const [cropsRes, ...districtResArr] = await Promise.all([
            fetch('/data/crops_database.json'),
            fetch('/districts/ahmednagar_mh.json'),
            fetch('/districts/yavatmal_mh.json'),
            fetch('/districts/bathinda_pb.json'),
            fetch('/districts/mandya_ka.json'),
        ]);

        const crops = await cropsRes.json();
        const districts = await Promise.all(districtResArr.map((r) => r.json()));
        const distMap = {
            ahmednagar_mh: districts[0],
            yavatmal_mh: districts[1],
            bathinda_pb: districts[2],
            mandya_ka: districts[3],
        };

        setCropsDb(crops);
        setDistrictsMap(distMap);
        return { cropsDb: crops, districtsMap: distMap };
    }, [cropsDb, districtsMap]);

    /**
     * Handle file upload
     */
    const handleFileUpload = async (file) => {
        if (!file) return;
        setFileName(file.name);
        setProcessing(true);
        setCabinetBrief('');

        try {
            const { valid, errors } = await parseAndValidatePolicyFile(file);
            setValidRows(valid);
            setValidationErrors(errors);

            if (valid.length === 0) {
                setRedFlags([]);
                setArbitrage([]);
                setRoadmap(null);
                setFeasibility(null);
                setProcessing(false);
                return;
            }

            // Load reference data
            const refData = await loadReferenceData();

            // Run analysis
            const flags = detectRedFlags(valid, refData.cropsDb, refData.districtsMap);
            setRedFlags(flags);

            const arb = calculateArbitrage(valid, refData.cropsDb, refData.districtsMap);
            setArbitrage(arb);

            const rm = generate3YearRoadmap(valid);
            setRoadmap(rm);

            const shiftedBudget = arb.reduce((sum, a) => sum + a.budget_inr_lakh, 0);
            const totalBudget = valid.reduce((sum, r) => sum + r.budget_amount_inr_lakh, 0);
            const hasCriticalNoAlt =
                flags.some((f) => f.severity === 'CRITICAL') &&
                arb.some((a) => a.feasibility === 'low');

            const feas = calculatePoliticalFeasibility(
                valid,
                flags,
                shiftedBudget,
                totalBudget,
                hasCriticalNoAlt
            );
            setFeasibility(feas);
        } catch (err) {
            console.error('Policy analysis error:', err);
            setValidationErrors([{ row: 0, message: `File processing error: ${err.message}` }]);
        } finally {
            setProcessing(false);
        }
    };

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    /**
     * Generate cabinet brief from LLM
     */
    const generateBrief = async () => {
        const targetDistrict = districtId || validRows[0]?.district_id;
        if (!targetDistrict) return;

        setBriefLoading(true);
        try {
            if (USE_REAL_API) {
                const res = await fetch('/api/llm/feature3-brief', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ district_id: targetDistrict }),
                });
                const data = await res.json();
                setCabinetBrief(data.brief || data.narrative || '');
            } else {
                // Stub brief
                setCabinetBrief(generateStubBrief(targetDistrict));
            }
        } catch (err) {
            console.error('Brief generation error:', err);
            setCabinetBrief('Error generating brief. Please try again.');
        } finally {
            setBriefLoading(false);
        }
    };

    /**
     * Polish cabinet brief via LLM
     */
    const polishBrief = async () => {
        const targetDistrict = districtId || validRows[0]?.district_id;
        if (!targetDistrict || !cabinetBrief) return;

        setPolishLoading(true);
        try {
            if (USE_REAL_API) {
                const res = await fetch('/api/llm/feature3-polish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ district_id: targetDistrict }),
                });
                const data = await res.json();
                setCabinetBrief(data.brief || data.narrative || cabinetBrief);
            } else {
                setCabinetBrief(
                    cabinetBrief + '\n\n[Polished version — language refined for ministerial audience]'
                );
            }
        } catch (err) {
            console.error('Polish error:', err);
        } finally {
            setPolishLoading(false);
        }
    };

    /**
     * Export to PDF
     */
    const exportPdf = async () => {
        setPdfExporting(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = document.getElementById('policy-brief-export');
            if (!element) return;

            const targetDistrict = districtId || validRows[0]?.district_id || 'district';
            const date = new Date().toISOString().split('T')[0];

            await html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `cabinet-brief-${targetDistrict}-${date}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                })
                .from(element)
                .save();
        } catch (err) {
            console.error('PDF export error:', err);
        } finally {
            setPdfExporting(false);
        }
    };

    const severityClass = (severity) =>
        severity === 'CRITICAL' ? 'flag-critical' : severity === 'HIGH' ? 'flag-high' : 'flag-medium';

    const feasibilityClass = (score) =>
        score >= 70 ? 'feas-high' : score >= 40 ? 'feas-medium' : 'feas-low';

    return (
        <div className="policy-simulator-panel">
            {/* Upload Section */}
            <div className="panel-section">
                <h4 className="section-title">Upload Policy Sheet</h4>
                <div className="upload-zone" onDrop={onDrop} onDragOver={onDragOver}>
                    <div className="upload-icon">📄</div>
                    <p className="upload-text">
                        {fileName ? fileName : 'Drag & drop CSV/XLSX or click to browse'}
                    </p>
                    <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : 'Browse Files'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={onFileChange}
                        style={{ display: 'none' }}
                    />
                    <p className="upload-hint">
                        Required: district_id, crop, budget_amount_inr_lakh, subsidy_type,
                        target_area_hectares
                    </p>
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="panel-section">
                    <h4 className="section-title">⚠️ Validation Errors</h4>
                    <div className="validation-errors">
                        {validationErrors.map((err, i) => (
                            <div key={i} className="validation-error">
                                <span className="error-row">Row {err.row}</span>
                                <span className="error-msg">{err.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Analysis results (only show after successful parse) */}
            {validRows.length > 0 && !processing && (
                <>
                    {/* Parsed Summary */}
                    <div className="panel-section">
                        <h4 className="section-title">
                            ✅ {validRows.length} Policy Rows Loaded
                        </h4>
                        <div className="parsed-summary">
                            <div className="summary-stat">
                                <span className="stat-value">
                                    ₹{validRows.reduce((s, r) => s + r.budget_amount_inr_lakh, 0).toLocaleString()}L
                                </span>
                                <span className="stat-label">Total Budget</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-value">
                                    {validRows
                                        .reduce((s, r) => s + r.target_area_hectares, 0)
                                        .toLocaleString()}{' '}
                                    ha
                                </span>
                                <span className="stat-label">Total Area</span>
                            </div>
                            <div className="summary-stat">
                                <span className="stat-value">
                                    {new Set(validRows.map((r) => r.district_id)).size}
                                </span>
                                <span className="stat-label">Districts</span>
                            </div>
                        </div>
                    </div>

                    {/* Red Flags */}
                    {redFlags.length > 0 && (
                        <div className="panel-section">
                            <h4 className="section-title">🚩 Red Flags ({redFlags.length})</h4>
                            <div className="red-flags-list">
                                {redFlags.map((flag, i) => (
                                    <div key={i} className={`red-flag-item ${severityClass(flag.severity)}`}>
                                        <div className="flag-header">
                                            <span className={`flag-badge ${severityClass(flag.severity)}`}>
                                                {flag.severity}
                                            </span>
                                            <span className="flag-crop">{flag.crop}</span>
                                            <span className="flag-district">{flag.district_id}</span>
                                        </div>
                                        <p className="flag-reason">{flag.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Arbitrage Table */}
                    {arbitrage.length > 0 && (
                        <div className="panel-section">
                            <h4 className="section-title">🔄 Crop Arbitrage Opportunities</h4>
                            <div className="arbitrage-table">
                                <div className="arb-header">
                                    <span>From</span>
                                    <span>To</span>
                                    <span>Water ↓</span>
                                    <span>Feasibility</span>
                                </div>
                                {arbitrage.map((row, i) => (
                                    <div key={i} className="arb-row">
                                        <span className="arb-from">{row.from_crop}</span>
                                        <span className="arb-to">{row.to_crop}</span>
                                        <span className="arb-water">-{row.water_reduction_pct}%</span>
                                        <span className={`arb-feas feas-${row.feasibility}`}>
                                            {row.feasibility}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3-Year Roadmap */}
                    {roadmap && (
                        <div className="panel-section">
                            <h4 className="section-title">📅 3-Year Transition Roadmap</h4>
                            <div className="roadmap-timeline">
                                {roadmap.years.map((yr) => (
                                    <div key={yr.year} className="roadmap-year">
                                        <div className="year-marker">
                                            <span className="year-number">Year {yr.year}</span>
                                            <span className="year-shift">{yr.cumulative_shift_pct}% shifted</span>
                                        </div>
                                        <div className="year-details">
                                            <span className="year-area">{yr.area_transitioned_ha.toLocaleString()} ha</span>
                                            <span className="year-budget">₹{yr.budget_allocated_lakh.toLocaleString()}L</span>
                                        </div>
                                        <div className="year-progress">
                                            <div
                                                className="year-progress-fill"
                                                style={{ width: `${yr.cumulative_shift_pct}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Political Feasibility */}
                    {feasibility && (
                        <div className="panel-section">
                            <h4 className="section-title">🏛️ Political Feasibility</h4>
                            <div className={`feasibility-gauge ${feasibilityClass(feasibility.score)}`}>
                                <div className="feas-score-display">
                                    <span className="feas-score-value">{feasibility.score}</span>
                                    <span className="feas-score-label">/100</span>
                                </div>
                                <div className="feas-bar">
                                    <div
                                        className="feas-bar-fill"
                                        style={{ width: `${feasibility.score}%` }}
                                    />
                                </div>
                                <div className="feas-breakdown">
                                    <div className="feas-factor">
                                        <span className="feas-factor-label">Farmers Affected</span>
                                        <span className="feas-factor-value">
                                            {(feasibility.breakdown.farmers_affected_ratio * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="feas-factor">
                                        <span className="feas-factor-label">Budget Shift</span>
                                        <span className="feas-factor-value">
                                            {(feasibility.breakdown.budget_shift_percent * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="feas-factor">
                                        <span className="feas-factor-label">No-Alt Penalty</span>
                                        <span className="feas-factor-value">
                                            {feasibility.breakdown.no_alternative_penalty ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cabinet Brief */}
                    <div className="panel-section">
                        <div className="section-header">
                            <h4 className="section-title">📋 Cabinet Brief</h4>
                            <div className="brief-actions">
                                <button
                                    className="brief-btn generate"
                                    onClick={generateBrief}
                                    disabled={briefLoading}
                                >
                                    {briefLoading ? '...' : '✨ Generate'}
                                </button>
                                {cabinetBrief && (
                                    <button
                                        className="brief-btn polish"
                                        onClick={polishBrief}
                                        disabled={polishLoading}
                                    >
                                        {polishLoading ? '...' : '💎 Polish'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {cabinetBrief ? (
                            <div className="brief-content">
                                <p className="brief-text">{cabinetBrief}</p>
                            </div>
                        ) : (
                            <p className="placeholder-text">
                                Click "Generate" for an AI-powered policy brief
                            </p>
                        )}
                    </div>

                    {/* PDF Export */}
                    <div className="panel-section">
                        <button
                            className="pdf-export-btn"
                            onClick={exportPdf}
                            disabled={pdfExporting}
                        >
                            {pdfExporting ? 'Exporting...' : '📥 Export Cabinet Brief as PDF'}
                        </button>
                    </div>

                    {/* Hidden element for PDF export */}
                    <div id="policy-brief-export" className="pdf-export-container">
                        <h1 style={{ color: '#1a1a1a', marginBottom: '16px' }}>
                            Agricultural Policy Cabinet Brief
                        </h1>
                        <p style={{ color: '#666', marginBottom: '24px' }}>
                            District: {districtId || validRows[0]?.district_id} | Generated:{' '}
                            {new Date().toLocaleDateString()}
                        </p>

                        {redFlags.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ color: '#1a1a1a', fontSize: '18px' }}>Red Flags</h2>
                                {redFlags.map((f, i) => (
                                    <p key={i} style={{ color: '#333', margin: '4px 0' }}>
                                        <strong>[{f.severity}]</strong> {f.crop} ({f.district_id}): {f.reason}
                                    </p>
                                ))}
                            </div>
                        )}

                        {arbitrage.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ color: '#1a1a1a', fontSize: '18px' }}>
                                    Arbitrage Opportunities
                                </h2>
                                <table
                                    style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        color: '#333',
                                    }}
                                >
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #ccc' }}>
                                            <th style={{ textAlign: 'left', padding: '8px' }}>From</th>
                                            <th style={{ textAlign: 'left', padding: '8px' }}>To</th>
                                            <th style={{ textAlign: 'left', padding: '8px' }}>Water ↓</th>
                                            <th style={{ textAlign: 'left', padding: '8px' }}>Feasibility</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {arbitrage.map((r, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px' }}>{r.from_crop}</td>
                                                <td style={{ padding: '8px' }}>{r.to_crop}</td>
                                                <td style={{ padding: '8px' }}>-{r.water_reduction_pct}%</td>
                                                <td style={{ padding: '8px' }}>{r.feasibility}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {roadmap && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ color: '#1a1a1a', fontSize: '18px' }}>3-Year Roadmap</h2>
                                {roadmap.years.map((yr) => (
                                    <p key={yr.year} style={{ color: '#333', margin: '4px 0' }}>
                                        <strong>Year {yr.year}:</strong> {yr.area_transitioned_ha.toLocaleString()}{' '}
                                        ha transitioned, ₹{yr.budget_allocated_lakh.toLocaleString()}L budget,{' '}
                                        {yr.cumulative_shift_pct}% cumulative shift
                                    </p>
                                ))}
                            </div>
                        )}

                        {cabinetBrief && (
                            <div>
                                <h2 style={{ color: '#1a1a1a', fontSize: '18px' }}>AI Analysis</h2>
                                <p style={{ color: '#333', whiteSpace: 'pre-line' }}>{cabinetBrief}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Generate a stub cabinet brief for offline mode
 */
function generateStubBrief(districtId) {
    return `CABINET BRIEF — ${districtId.replace('_', ' ').toUpperCase()}

EXECUTIVE SUMMARY:
Based on analysis of uploaded policy allocations, this district shows significant opportunities for agricultural transition. Current subsidy patterns favor water-intensive crops in water-stressed regions, creating a sustainability gap.

KEY FINDINGS:
• Red flag analysis reveals misaligned subsidies that accelerate aquifer depletion
• Crop arbitrage opportunities exist with 50-90% water reduction potential
• A phased 3-year transition (15% per year) minimizes farmer disruption

RECOMMENDATIONS:
1. Redirect power subsidies toward drip-irrigation adoption incentives
2. Establish MSP floor guarantees for recommended alternative crops during transition
3. Implement farmer income protection via 2-year risk insurance during crop switch
4. Monitor groundwater recovery as primary KPI for policy success

RISK ASSESSMENT:
Political feasibility is moderate — farmer income protection mechanisms are essential for stakeholder acceptance. Budget reallocation should be phased to avoid abrupt subsidy withdrawal.

This brief is generated for policy analysis purposes and should be reviewed by agricultural experts before implementation.`;
}

export default PolicySimulator;
