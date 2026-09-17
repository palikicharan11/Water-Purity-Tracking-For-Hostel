/**
 * Water Purity Tracker for Hostel - Client Logic & AI Suite
 * ==========================================================
 * Integrates IoT Live Telemetry Simulation, Process Flow Inspector,
 * Chemical Knowledge Base Modals, Tank Comparison Matrix, and Lab Certificates.
 */

// BIS IS:10500 Chemistry Standards Table
const STANDARDS = {
    ph: { min: 6.5, max: 8.5, ideal: 7.0, weight: 4, name: "pH", unit: "" },
    tds: { limit: 500, ideal: 100, weight: 5, name: "TDS", unit: "mg/L" },
    turbidity: { limit: 5.0, ideal: 0.5, weight: 3, name: "Turbidity", unit: "NTU" },
    hardness: { limit: 300, ideal: 100, weight: 3, name: "Hardness", unit: "mg/L" },
    chlorine: { min: 0.2, max: 1.0, ideal: 0.4, weight: 2, name: "Chlorine", unit: "mg/L" },
    nitrates: { limit: 45, ideal: 10, weight: 4, name: "Nitrates", unit: "mg/L" },
    fluoride: { min: 0.6, max: 1.5, ideal: 0.8, weight: 4, name: "Fluoride", unit: "mg/L" },
    coliform: { limit: 0, ideal: 0, weight: 5, name: "Coliform", unit: "MPN/100ml" }
};

// Parameter Educational Knowledge Base Details
const CHEM_KNOWLEDGE = {
    ph: {
        title: "pH Level (Hydrogen Ion Concentration)",
        formula: "pH = -log10[H+]",
        limits: "BIS Limit: 6.5 - 8.5 | Ideal: 7.0 (Neutral)",
        impact: "Acidic water (pH < 6.5) corrodes metal pipes & releases toxic lead/copper. Alkaline water (pH > 8.5) causes bitter taste and mineral scale encrustation.",
        treatment: "Dosage with Soda Ash / Calcite Neutralizers for acidic water, or Citric Acid dosing / RO membrane filtration for high alkalinity."
    },
    tds: {
        title: "Total Dissolved Solids (TDS)",
        formula: "TDS (mg/L) = Sum of (Ca2+, Mg2+, Na+, K+, Cl-, SO42-, HCO3-)",
        limits: "Desirable: < 500 mg/L | Max Limit: 2000 mg/L",
        impact: "High TDS leads to salty taste, kidney strain, and rapid scaling of water heating elements.",
        treatment: "Reverse Osmosis (RO) Plants utilizing semi-permeable membranes under high hydraulic pressure."
    },
    turbidity: {
        title: "Turbidity (Water Clarity & Suspended Solids)",
        formula: "Measured in Nephelometric Turbidity Units (NTU)",
        limits: "Desirable: < 1.0 NTU | Limit: 5.0 NTU",
        impact: "Causes cloudiness in water and shields micro-organisms from UV disinfectant penetration.",
        treatment: "Alum Coagulation (Aluminum Sulfate) + Flocculation sedimentation followed by Dual-Media Sand Bed Filters."
    },
    hardness: {
        title: "Total Water Hardness (Calcium & Magnesium)",
        formula: "Total Hardness = 2.497[Ca2+] + 4.118[Mg2+] (mg/L CaCO3 equiv)",
        limits: "Desirable: < 200 mg/L | Permissible: 300 mg/L",
        impact: "Curdling of soap, pipe constriction, and boiler scale deposition.",
        treatment: "Ion-Exchange Resin Softening or Lime-Soda softening process."
    },
    chlorine: {
        title: "Residual Free Chlorine",
        formula: "Cl2 + H2O <-> HOCl + HCl",
        limits: "BIS Standard: 0.2 to 1.0 mg/L",
        impact: "Protects against bacterial regrowth in long hostel distribution pipes.",
        treatment: "Sodium Hypochlorite dosing or Activated Carbon Filtration if chlorine taste exceeds limits."
    },
    nitrates: {
        title: "Nitrates (NO3-)",
        formula: "NO3- (mg/L as N)",
        limits: "Max Limit: 45 mg/L",
        impact: "Causes Methemoglobinemia ('Blue Baby Syndrome') and gastrointestinal irritation.",
        treatment: "Anion Exchange Resins or RO Membrane Filtration."
    },
    fluoride: {
        title: "Fluoride (F-)",
        formula: "F- (mg/L)",
        limits: "Ideal: 0.8 - 1.0 mg/L | Max: 1.5 mg/L",
        impact: "Deficiency (<0.5 mg/L) causes dental caries; excess (>1.5 mg/L) causes crippling skeletal fluorosis.",
        treatment: "Nalgonda Technique (Dosage of Alum + Lime) or Activated Alumina defluoridation filters."
    },
    coliform: {
        title: "Microbial Coliform Bacteria",
        formula: "Most Probable Number (MPN / 100ml)",
        limits: "Mandatory: 0 MPN / 100ml (Zero Tolerance)",
        impact: "Causes severe waterborne outbreaks including Typhoid, Cholera, Dysentery, and Gastroenteritis.",
        treatment: "Immediate Shock Chlorination (1.0 ppm) followed by continuous UV Sterilization Chamber."
    }
};

// State Store
let waterRecords = [
    { Date: "2026-07-20", Location: "Block A - Overhead Tank", pH: 7.2, TDS_mg_L: 280, Turbidity_NTU: 1.2, Hardness_mg_L: 180, Chlorine_mg_L: 0.4, Nitrates_mg_L: 12, Fluoride_mg_L: 0.8, Coliform_MPN: 0, WQI: 91.5, Status: "Excellent" },
    { Date: "2026-07-22", Location: "Mess - RO Dispenser 1", pH: 6.9, TDS_mg_L: 85, Turbidity_NTU: 0.4, Hardness_mg_L: 45, Chlorine_mg_L: 0.2, Nitrates_mg_L: 5, Fluoride_mg_L: 0.5, Coliform_MPN: 0, WQI: 98.2, Status: "Excellent" },
    { Date: "2026-07-24", Location: "Block B - Main Sump", pH: 8.2, TDS_mg_L: 520, Turbidity_NTU: 4.8, Hardness_mg_L: 320, Chlorine_mg_L: 0.1, Nitrates_mg_L: 38, Fluoride_mg_L: 1.4, Coliform_MPN: 12, WQI: 54.2, Status: "Poor" },
    { Date: "2026-07-26", Location: "Block C - Washroom Supply", pH: 6.1, TDS_mg_L: 680, Turbidity_NTU: 6.5, Hardness_mg_L: 410, Chlorine_mg_L: 0.0, Nitrates_mg_L: 55, Fluoride_mg_L: 1.9, Coliform_MPN: 45, WQI: 32.8, Status: "Very Poor" },
    { Date: "2026-07-28", Location: "Mess - Kitchen Tap", pH: 7.5, TDS_mg_L: 310, Turbidity_NTU: 1.8, Hardness_mg_L: 210, Chlorine_mg_L: 0.3, Nitrates_mg_L: 18, Fluoride_mg_L: 0.9, Coliform_MPN: 0, WQI: 88.4, Status: "Good" }
];

// Helper to normalize records from CSV / REST API
function parseRecord(r) {
    return {
        Date: r.Date || r.date || new Date().toISOString().split("T")[0],
        Location: r.Location || r.location || "Hostel Location",
        pH: parseFloat(r.pH || r.ph || 7.0),
        TDS_mg_L: parseFloat(r.TDS_mg_L || r.tds || 0),
        Turbidity_NTU: parseFloat(r.Turbidity_NTU || r.turbidity || 0),
        Hardness_mg_L: parseFloat(r.Hardness_mg_L || r.hardness || 0),
        Chlorine_mg_L: parseFloat(r.Chlorine_mg_L || r.chlorine || 0),
        Nitrates_mg_L: parseFloat(r.Nitrates_mg_L || r.nitrates || 0),
        Fluoride_mg_L: parseFloat(r.Fluoride_mg_L || r.fluoride || 0),
        Coliform_MPN: parseFloat(r.Coliform_MPN || r.coliform || 0),
        WQI: parseFloat(r.WQI || r.wqi || 0),
        Status: r.Status || r.status || "Evaluated"
    };
}

let wqiChartInstance = null;
let iotInterval = null;
let iotActive = false;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sample-date").value = new Date().toISOString().split("T")[0];

    bindInputListeners();
    recalculateAndUpdateUI();
    renderTable();
    initChart();
    
    // Fetch live records from Python backend on localhost
    fetchRecordsFromBackend();

    // Event Bindings
    document.getElementById("btn-save-record").addEventListener("click", handleSaveRecord);
    document.getElementById("btn-export-csv").addEventListener("click", exportToCSV);
    document.getElementById("btn-iot-toggle").addEventListener("click", toggleIoTLiveStream);
    document.getElementById("btn-compare-modal").addEventListener("click", openTankComparisonModal);
    document.getElementById("btn-print-report").addEventListener("click", openCertModal);

    document.getElementById("csv-file-input").addEventListener("change", handleCSVImport);
});

async function fetchRecordsFromBackend() {
    try {
        const res = await fetch("/api/records");
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                waterRecords = data.map(parseRecord);
                renderTable();
                updateChart();
                console.log("[LOCALHOST] Loaded records from server:", waterRecords);
            }
        }
    } catch (e) {
        console.warn("[LOCALHOST] Could not fetch records from server, using default sample data:", e);
    }
}

// Bind sliders
function bindInputListeners() {
    const params = ["ph", "tds", "turbidity", "hardness", "chlorine", "nitrates", "fluoride", "coliform"];
    params.forEach(p => {
        const input = document.getElementById(`input-${p}`);
        const valSpan = document.getElementById(`val-${p}`);
        input.addEventListener("input", (e) => {
            valSpan.textContent = e.target.value;
            recalculateAndUpdateUI();
        });
    });
}

function getCurrentParams() {
    return {
        ph: parseFloat(document.getElementById("input-ph").value),
        tds: parseFloat(document.getElementById("input-tds").value),
        turbidity: parseFloat(document.getElementById("input-turbidity").value),
        hardness: parseFloat(document.getElementById("input-hardness").value),
        chlorine: parseFloat(document.getElementById("input-chlorine").value),
        nitrates: parseFloat(document.getElementById("input-nitrates").value),
        fluoride: parseFloat(document.getElementById("input-fluoride").value),
        coliform: parseFloat(document.getElementById("input-coliform").value)
    };
}

// Calculate Water Quality Index (WQI)
function calculateWQI(p) {
    let totalWiQi = 0;
    let totalWi = 0;

    let q_ph = p.ph < 7.0 ? ((p.ph - 7.0) / (6.5 - 7.0)) * 100 : ((p.ph - 7.0) / (8.5 - 7.0)) * 100;
    totalWiQi += Math.max(0, q_ph) * STANDARDS.ph.weight;
    totalWi += STANDARDS.ph.weight;

    let q_tds = ((p.tds - STANDARDS.tds.ideal) / (STANDARDS.tds.limit - STANDARDS.tds.ideal)) * 100;
    totalWiQi += Math.max(0, q_tds) * STANDARDS.tds.weight;
    totalWi += STANDARDS.tds.weight;

    let q_turb = ((p.turbidity - STANDARDS.turbidity.ideal) / (STANDARDS.turbidity.limit - STANDARDS.turbidity.ideal)) * 100;
    totalWiQi += Math.max(0, q_turb) * STANDARDS.turbidity.weight;
    totalWi += STANDARDS.turbidity.weight;

    let q_hard = ((p.hardness - STANDARDS.hardness.ideal) / (STANDARDS.hardness.limit - STANDARDS.hardness.ideal)) * 100;
    totalWiQi += Math.max(0, q_hard) * STANDARDS.hardness.weight;
    totalWi += STANDARDS.hardness.weight;

    let q_chl = (p.chlorine >= 0.2 && p.chlorine <= 1.0) ? 0 : 80;
    totalWiQi += q_chl * STANDARDS.chlorine.weight;
    totalWi += STANDARDS.chlorine.weight;

    let q_nit = ((p.nitrates - STANDARDS.nitrates.ideal) / (STANDARDS.nitrates.limit - STANDARDS.nitrates.ideal)) * 100;
    totalWiQi += Math.max(0, q_nit) * STANDARDS.nitrates.weight;
    totalWi += STANDARDS.nitrates.weight;

    let q_flu = ((p.fluoride - STANDARDS.fluoride.ideal) / (STANDARDS.fluoride.max - STANDARDS.fluoride.ideal)) * 100;
    totalWiQi += Math.max(0, q_flu) * STANDARDS.fluoride.weight;
    totalWi += STANDARDS.fluoride.weight;

    let q_col = p.coliform === 0 ? 0 : p.coliform * 100;
    totalWiQi += Math.max(0, q_col) * STANDARDS.coliform.weight;
    totalWi += STANDARDS.coliform.weight;

    let subIndex = totalWiQi / totalWi;
    let wqi = Math.max(0, Math.min(100, 100 - (subIndex * 0.45)));
    return parseFloat(wqi.toFixed(1));
}

function recalculateAndUpdateUI() {
    const p = getCurrentParams();
    const wqi = calculateWQI(p);

    document.getElementById("ring-score-text").textContent = wqi;
    document.getElementById("stat-wqi").textContent = wqi;

    const ringBar = document.getElementById("ring-bar");
    const offset = 534 - (534 * (wqi / 100));
    ringBar.style.strokeDashoffset = offset;

    const statusBadge = document.getElementById("status-pill-badge");
    const wqiSub = document.getElementById("stat-wqi-sub");

    let statusText = "";
    let strokeColor = "";

    if (wqi >= 90) {
        statusText = "Safe Drinking Water";
        statusBadge.className = "status-pill safe";
        strokeColor = "#00f2fe";
        wqiSub.className = "stat-sub safe";
        wqiSub.innerHTML = '<i class="fa-solid fa-circle-check"></i> Excellent Grade';
    } else if (wqi >= 75) {
        statusText = "Acceptable Quality";
        statusBadge.className = "status-pill safe";
        strokeColor = "#10b981";
        wqiSub.className = "stat-sub safe";
        wqiSub.innerHTML = '<i class="fa-solid fa-check"></i> Good Quality';
    } else if (wqi >= 50) {
        statusText = "Requires Purification";
        statusBadge.className = "status-pill warning";
        strokeColor = "#f59e0b";
        wqiSub.className = "stat-sub";
        wqiSub.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Moderate Contamination';
    } else {
        statusText = "Unsafe Drinking Water";
        statusBadge.className = "status-pill danger";
        strokeColor = "#ef4444";
        wqiSub.className = "stat-sub";
        wqiSub.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Severe Contamination';
    }

    statusBadge.textContent = statusText;
    ringBar.style.stroke = strokeColor;

    renderParameterBadges(p);
    renderAIAdvice(p);
}

function renderParameterBadges(p) {
    const container = document.getElementById("param-status-tags");
    container.innerHTML = "";

    const checks = [
        { name: "pH", pass: p.ph >= 6.5 && p.ph <= 8.5, val: p.ph },
        { name: "TDS", pass: p.tds <= 500, val: `${p.tds} mg/L` },
        { name: "Turbidity", pass: p.turbidity <= 5.0, val: `${p.turbidity} NTU` },
        { name: "Hardness", pass: p.hardness <= 300, val: `${p.hardness} mg/L` },
        { name: "Chlorine", pass: p.chlorine >= 0.2 && p.chlorine <= 1.0, val: `${p.chlorine} mg/L` },
        { name: "Nitrates", pass: p.nitrates <= 45, val: `${p.nitrates} mg/L` },
        { name: "Fluoride", pass: p.fluoride >= 0.6 && p.fluoride <= 1.5, val: `${p.fluoride} mg/L` },
        { name: "Coliform", pass: p.coliform === 0, val: `${p.coliform} MPN` }
    ];

    let alerts = 0;
    checks.forEach(c => {
        const span = document.createElement("span");
        if (c.pass) {
            span.className = "badge-status pass";
            span.innerHTML = `<i class="fa-solid fa-check"></i> ${c.name}: ${c.val}`;
        } else {
            span.className = "badge-status fail";
            span.innerHTML = `<i class="fa-solid fa-xmark"></i> ${c.name}: ${c.val}`;
            alerts++;
        }
        container.appendChild(span);
    });

    document.getElementById("stat-alerts").textContent = `${alerts} Active`;
    const alertSub = document.getElementById("stat-alerts-sub");
    if (alerts === 0) {
        alertSub.textContent = "BIS IS:10500 Compliant";
        alertSub.style.color = "var(--accent-emerald)";
    } else {
        alertSub.textContent = "Immediate Action Needed";
        alertSub.style.color = "var(--accent-rose)";
    }
}

function renderAIAdvice(p) {
    const container = document.getElementById("ai-advice-container");
    container.innerHTML = "";
    const adviceList = [];

    if (p.ph < 6.5) adviceList.push({ type: "warning", text: "<i class='fa-solid fa-triangle-exclamation'></i> <strong>Acidic Water (pH < 6.5):</strong> Add Calcite/Soda Ash neutralizing filters to raise pH and prevent pipe & boiler corrosion." });
    else if (p.ph > 8.5) adviceList.push({ type: "warning", text: "<i class='fa-solid fa-triangle-exclamation'></i> <strong>High Alkalinity (pH > 8.5):</strong> Dose with food-grade citric acid or RO membrane filtration to lower pH to neutral 7.0-7.5." });

    if (p.tds > 500) adviceList.push({ type: "critical", text: "<i class='fa-solid fa-circle-exclamation'></i> <strong>High Total Dissolved Solids (TDS > 500 mg/L):</strong> Deploy a Commercial Reverse Osmosis (RO) Plant to remove excess sodium, chlorides, and minerals." });
    if (p.turbidity > 5.0) adviceList.push({ type: "warning", text: "<i class='fa-solid fa-cloud-rain'></i> <strong>High Turbidity (> 5 NTU):</strong> Perform Alum (Aluminum Sulfate) Coagulation followed by dual-media Sand Filters before tank distribution." });
    if (p.hardness > 300) adviceList.push({ type: "warning", text: "<i class='fa-solid fa-gem'></i> <strong>Excess Hardness (> 300 mg/L Ca/Mg):</strong> Install an Ion-Exchange Water Softener to prevent severe scale buildup in hostel plumbing." });
    if (p.nitrates > 45) adviceList.push({ type: "critical", text: "<i class='fa-solid fa-skull-crossbones'></i> <strong>High Nitrates (> 45 mg/L):</strong> Requires immediate Anion Exchange Resin or RO treatment to prevent Blue Baby Syndrome health risks." });
    if (p.fluoride > 1.5) adviceList.push({ type: "warning", text: "<i class='fa-solid fa-tooth'></i> <strong>Excess Fluoride (> 1.5 mg/L):</strong> Apply the Nalgonda Defluoridation Technique (Alum + Lime dosage) or Activated Alumina filters." });
    if (p.coliform > 0) adviceList.push({ type: "critical", text: "<i class='fa-solid fa-biohazard'></i> <strong>Pathogenic Coliform Detected (> 0 MPN):</strong> URGENT: Execute Shock Chlorination (0.5 - 1.0 mg/L free chlorine) & continuous UV Disinfection!" });

    if (adviceList.length === 0) {
        adviceList.push({ type: "safe", text: "<i class='fa-solid fa-circle-check'></i> <strong>Ideal Water Quality:</strong> All tested chemical and biological parameters strictly satisfy WHO and Indian Standard (BIS IS:10500) drinking guidelines!" });
    }

    adviceList.forEach(item => {
        const div = document.createElement("div");
        div.className = `advice-item ${item.type}`;
        div.innerHTML = item.text;
        container.appendChild(div);
    });
}

// Preset Quick Apply
function applyPreset(preset) {
    if (preset === 'clean') {
        setInputValue("ph", 7.2); setInputValue("tds", 85); setInputValue("turbidity", 0.4);
        setInputValue("hardness", 40); setInputValue("chlorine", 0.3); setInputValue("nitrates", 6);
        setInputValue("fluoride", 0.7); setInputValue("coliform", 0);
    } else if (preset === 'hard') {
        setInputValue("ph", 8.2); setInputValue("tds", 650); setInputValue("turbidity", 2.1);
        setInputValue("hardness", 450); setInputValue("chlorine", 0.1); setInputValue("nitrates", 25);
        setInputValue("fluoride", 1.2); setInputValue("coliform", 0);
    } else if (preset === 'dirty') {
        setInputValue("ph", 5.8); setInputValue("tds", 920); setInputValue("turbidity", 8.5);
        setInputValue("hardness", 380); setInputValue("chlorine", 0.0); setInputValue("nitrates", 58);
        setInputValue("fluoride", 2.4); setInputValue("coliform", 35);
    }
    recalculateAndUpdateUI();
}

function setInputValue(param, val) {
    document.getElementById(`input-${param}`).value = val;
    document.getElementById(`val-${param}`).textContent = val;
}

// IoT Telemetry Live Streaming Simulation
function toggleIoTLiveStream() {
    const btnText = document.getElementById("iot-status-text");
    if (iotActive) {
        clearInterval(iotInterval);
        iotActive = false;
        btnText.textContent = "OFF";
        btnText.style.color = "var(--text-muted)";
    } else {
        iotActive = true;
        btnText.textContent = "LIVE ACTIVE";
        btnText.style.color = "var(--accent-emerald)";
        iotInterval = setInterval(() => {
            // Simulate random sensor fluctuation
            const randomTDS = Math.min(1000, Math.max(50, Math.round(parseFloat(document.getElementById("input-tds").value) + (Math.random() * 20 - 10))));
            const randomPH = parseFloat((Math.min(9.0, Math.max(6.0, parseFloat(document.getElementById("input-ph").value) + (Math.random() * 0.2 - 0.1)))).toFixed(1));
            setInputValue("tds", randomTDS);
            setInputValue("ph", randomPH);
            recalculateAndUpdateUI();
        }, 3500);
    }
}

// Process Pipeline Flow Inspector
function showStageInfo(stage) {
    const box = document.getElementById("pipeline-detail-box");
    const text = document.getElementById("pipeline-detail-text");
    
    // Highlight step
    document.querySelectorAll(".pipeline-step").forEach(el => el.classList.remove("active"));
    event.currentTarget.classList.add("active");

    const stageDetails = {
        raw: "<strong>Stage 01 - Raw Sump:</strong> Underground hostel collection sump receiving municipal or borewell feed. Typical TDS: 400-700 mg/L.",
        coagulation: "<strong>Stage 02 - Alum Coagulation:</strong> Dosing 10-20 mg/L Alumina Sulfate [Al2(SO4)3] to neutralize negative particle charges and flocculate turbidity.",
        filter: "<strong>Stage 03 - Sand Bed & Carbon:</strong> Multi-grade quartz sand traps suspended solids down to 20 microns; Activated Carbon adsorbs organic taste & odor.",
        ro: "<strong>Stage 04 - RO Membrane:</strong> Semi-permeable polyamide membrane working at 150 PSI operating pressure, removing 95%+ of dissolved inorganic salts.",
        uv: "<strong>Stage 05 - UV Disinfection:</strong> Germicidal 254 nm wavelength UV lamp inactivates bacterial DNA/RNA with zero chemical residual.",
        pure: "<strong>Stage 06 - Hostel Output:</strong> Final pure water delivered to hostel drinking water taps. Guaranteed WQI > 90."
    };

    text.innerHTML = stageDetails[stage] || "Select any stage to inspect operations.";
}

// Open Knowledge Modal for Parameter
function openChemModal(param) {
    const data = CHEM_KNOWLEDGE[param];
    if (!data) return;

    document.getElementById("modal-chem-title").innerHTML = `<i class="fa-solid fa-flask"></i> ${data.title}`;
    document.getElementById("modal-chem-body").innerHTML = `
        <div style="font-size: 0.9rem; line-height: 1.6; color: var(--text-main);">
            <p style="margin-bottom: 0.75rem;"><strong>Chemical Notation / Formula:</strong> <code style="background: rgba(0,242,254,0.1); color: var(--primary-cyan); padding: 0.2rem 0.5rem; border-radius: 4px;">${data.formula}</code></p>
            <p style="margin-bottom: 0.75rem;"><strong>Standard Guidelines:</strong> ${data.limits}</p>
            <p style="margin-bottom: 0.75rem;"><strong>Health & Technical Impact:</strong> ${data.impact}</p>
            <p style="margin-bottom: 0.75rem;"><strong>Engineering Treatment Solution:</strong> ${data.treatment}</p>
        </div>
    `;
    document.getElementById("modal-chem").classList.remove("hidden");
}

// Tank Comparison Modal
function openTankComparisonModal() {
    const container = document.getElementById("compare-container");
    container.innerHTML = "";

    waterRecords.slice(-3).forEach(r => {
        const div = document.createElement("div");
        div.className = "m-card";
        div.innerHTML = `
            <h4 style="color: var(--primary-cyan); margin-bottom: 0.5rem;"><i class="fa-solid fa-building-user"></i> ${r.Location}</h4>
            <p style="font-size: 0.85rem; margin-bottom: 0.25rem;">Date: ${r.Date}</p>
            <p style="font-size: 1.2rem; font-weight: 800; color: ${r.WQI >= 75 ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">WQI Score: ${r.WQI}</p>
            <p style="font-size: 0.8rem; color: var(--text-muted)">pH: ${r.pH} | TDS: ${r.TDS_mg_L} mg/L | Hardness: ${r.Hardness_mg_L} mg/L</p>
            <span class="badge-status ${r.WQI >= 75 ? 'pass' : 'fail'}" style="margin-top: 0.5rem; display: inline-block;">${r.Status}</span>
        `;
        container.appendChild(div);
    });

    document.getElementById("modal-compare").classList.remove("hidden");
}

// Open Certificate Modal
function openCertModal() {
    const p = getCurrentParams();
    const wqi = calculateWQI(p);
    const loc = document.getElementById("location-select").value;
    const date = document.getElementById("sample-date").value;

    document.getElementById("cert-location").textContent = loc;
    document.getElementById("cert-date").textContent = date;
    document.getElementById("cert-wqi").textContent = `${wqi} / 100`;

    const body = document.getElementById("cert-table-body");
    body.innerHTML = `
        <tr><td>pH Level</td><td>${p.ph}</td><td>6.5 - 8.5</td><td>${p.ph >= 6.5 && p.ph <= 8.5 ? 'PASS' : 'FAIL'}</td></tr>
        <tr><td>Total Dissolved Solids (TDS)</td><td>${p.tds} mg/L</td><td>< 500 mg/L</td><td>${p.tds <= 500 ? 'PASS' : 'FAIL'}</td></tr>
        <tr><td>Turbidity</td><td>${p.turbidity} NTU</td><td>< 5.0 NTU</td><td>${p.turbidity <= 5.0 ? 'PASS' : 'FAIL'}</td></tr>
        <tr><td>Total Hardness</td><td>${p.hardness} mg/L</td><td>< 300 mg/L</td><td>${p.hardness <= 300 ? 'PASS' : 'FAIL'}</td></tr>
        <tr><td>Coliform Bacteria</td><td>${p.coliform} MPN</td><td>0 MPN</td><td>${p.coliform === 0 ? 'PASS' : 'FAIL'}</td></tr>
    `;

    document.getElementById("modal-cert").classList.remove("hidden");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}

// Table & Chart logic
function renderTable() {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";
    waterRecords.forEach(r => {
        const tr = document.createElement("tr");
        const isSafe = r.WQI >= 75;
        tr.innerHTML = `
            <td>${r.Date}</td>
            <td><strong>${r.Location}</strong></td>
            <td>${r.pH}</td>
            <td>${r.TDS_mg_L} mg/L</td>
            <td>${r.Hardness_mg_L} mg/L</td>
            <td>${r.Coliform_MPN} MPN</td>
            <td><strong style="color: ${isSafe ? 'var(--primary-cyan)' : 'var(--accent-amber)'}">${r.WQI}</strong></td>
            <td><span class="badge-status ${isSafe ? 'pass' : 'fail'}">${r.Status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function initChart() {
    const ctx = document.getElementById("wqiChart").getContext("2d");
    const labels = waterRecords.map(r => `${r.Date} (${r.Location.split(' - ')[0]})`);
    const dataWQI = waterRecords.map(r => r.WQI);

    wqiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Water Quality Index (WQI)',
                data: dataWQI,
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(0, 242, 254, 0.08)',
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#00f2fe',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function updateChart() {
    if (!wqiChartInstance) return;
    wqiChartInstance.data.labels = waterRecords.map(r => `${r.Date} (${r.Location.split(' - ')[0]})`);
    wqiChartInstance.data.datasets[0].data = waterRecords.map(r => r.WQI);
    wqiChartInstance.update();
}

async function handleSaveRecord() {
    const p = getCurrentParams();
    const date = document.getElementById("sample-date").value || new Date().toISOString().split("T")[0];
    const location = document.getElementById("location-select").value;

    const payload = {
        location: location,
        data: {
            pH: p.ph,
            TDS_mg_L: p.tds,
            Turbidity_NTU: p.turbidity,
            Hardness_mg_L: p.hardness,
            Chlorine_mg_L: p.chlorine,
            Nitrates_mg_L: p.nitrates,
            Fluoride_mg_L: p.fluoride,
            Coliform_MPN: p.coliform
        }
    };

    try {
        const response = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === "success" && result.record) {
                const rec = parseRecord(result.record);
                waterRecords.push(rec);
                renderTable();
                updateChart();
                alert(`✅ Record sent to localhost server & saved to water_data.csv!\nLocation: ${rec.Location} | WQI: ${rec.WQI} (${rec.Status})`);
                return;
            }
        }
    } catch (err) {
        console.warn("[LOCALHOST] Could not connect to backend server, fallback to session memory:", err);
    }

    // Fallback if backend server is not active
    const wqi = calculateWQI(p);
    let statusText = wqi >= 90 ? "Excellent" : (wqi >= 75 ? "Good" : (wqi >= 50 ? "Poor" : "Very Poor"));
    const newRecord = { Date: date, Location: location, pH: p.ph, TDS_mg_L: p.tds, Turbidity_NTU: p.turbidity, Hardness_mg_L: p.hardness, Chlorine_mg_L: p.chlorine, Nitrates_mg_L: p.nitrates, Fluoride_mg_L: p.fluoride, Coliform_MPN: p.coliform, WQI: wqi, Status: statusText };
    waterRecords.push(newRecord);
    renderTable();
    updateChart();
    alert(`⚠️ Saved in session memory only (Localhost server offline).`);
}

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Date,Location,pH,TDS_mg_L,Turbidity_NTU,Hardness_mg_L,Chlorine_mg_L,Nitrates_mg_L,Fluoride_mg_L,Coliform_MPN,WQI,Status\n";
    waterRecords.forEach(r => {
        const row = [r.Date, `"${r.Location}"`, r.pH, r.TDS_mg_L, r.Turbidity_NTU, r.Hardness_mg_L, r.Chlorine_mg_L, r.Nitrates_mg_L, r.Fluoride_mg_L, r.Coliform_MPN, r.WQI, r.Status].join(",");
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_water_purity_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const lines = e.target.result.split("\n");
        if (lines.length <= 1) return;
        const imported = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(",");
            if (cols.length >= 12) {
                imported.push({ Date: cols[0].replace(/"/g, ""), Location: cols[1].replace(/"/g, ""), pH: parseFloat(cols[2]), TDS_mg_L: parseFloat(cols[3]), Turbidity_NTU: parseFloat(cols[4]), Hardness_mg_L: parseFloat(cols[5]), Chlorine_mg_L: parseFloat(cols[6]), Nitrates_mg_L: parseFloat(cols[7]), Fluoride_mg_L: parseFloat(cols[8]), Coliform_MPN: parseFloat(cols[9]), WQI: parseFloat(cols[10]), Status: cols[11].replace(/"/g, "") });
            }
        }
        if (imported.length > 0) {
            waterRecords = imported;
            renderTable();
            updateChart();
            alert(`📥 Successfully imported ${imported.length} records!`);
        }
    };
    reader.readAsText(file);
}
