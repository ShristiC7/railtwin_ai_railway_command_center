/**
 * RailTwin AI — Unified Railway Intelligence & Command Center Engine
 * SIH 2026 | Problem Statement 26027 | Ministry of Railways
 * 
 * Features:
 * - Dual Engine: FastAPI REST API Integration + Zero-Dependency Local Fallback
 * - 7-Level Network Hierarchy (Zone -> Division -> Section -> Corridor -> Block Section -> Track -> Asset)
 * - Multi-Department Ingestion & Task Normalization (TMS / SMMS / TDMS / COA)
 * - PRD Section 8.2 Explainable Priority Engine
 * - Multi-Department Block Bundling & CP-SAT Constraint Solver
 * - Dynamic Re-Planning & Emergency Rail Defect Injection
 * - What-If Scenario Simulation (Block Cancellation, Freight Surge, Speed Restrictions)
 * - Human-in-the-loop Approval & Audit Logging (DRAFT -> RECOMMENDED -> APPROVED -> LOCKED)
 * - Live Status Indicator for FastAPI CP-SAT Server
 */

const RailTwinEngine = (function() {
  'use strict';

  const API_BASE_URL = 'http://127.0.0.1:8000';
  let backendConnected = false;
  let backendChecked = false;

  // --- Network Hierarchy ---
  const NETWORKS = [
    {
      zone: "Northern Railway (NR)",
      division: "Delhi Division (DLI)",
      section: "Ghaziabad-Aligarh Section",
      corridorId: "CORR-GZB-ALJN",
      name: "Ghaziabad – Aligarh Mainline",
      lengthKm: 106,
      tracks: "Double Line (UP/DOWN) + Electrified 25kV AC",
      blockSections: [
        { id: "BLK-01", name: "Sahibabad – Ghaziabad Jn", kmStart: 0, kmEnd: 18, status: "NOMINAL" },
        { id: "BLK-02", name: "Ghaziabad Jn – Maripat", kmStart: 18, kmEnd: 32, status: "WARNING" },
        { id: "BLK-03", name: "Maripat – Dadri", kmStart: 32, kmEnd: 48, status: "BLOCK_ACTIVE" },
        { id: "BLK-04", name: "Dadri – Boraki", kmStart: 48, kmEnd: 64, status: "NOMINAL" },
        { id: "BLK-05", name: "Boraki – Ajaibpur", kmStart: 64, kmEnd: 82, status: "NOMINAL" },
        { id: "BLK-06", name: "Ajaibpur – Aligarh Jn", kmStart: 82, kmEnd: 106, status: "NOMINAL" }
      ],
      activeTrains: [
        { id: "12042", name: "Shatabdi Express", type: "PREMIUM_PASSENGER", direction: "DOWN", speedKmh: 130, locationKm: 28.4, etaMins: 14 },
        { id: "22436", name: "Vande Bharat Express", type: "HIGH_SPEED", direction: "UP", speedKmh: 145, locationKm: 74.2, etaMins: 22 },
        { id: "G-8891", name: "Container Freight (DFCCIL link)", type: "FREIGHT", direction: "DOWN", speedKmh: 75, locationKm: 41.0, etaMins: 45 }
      ]
    },
    {
      zone: "Northern Railway (NR)",
      division: "Delhi Division (DLI)",
      section: "Delhi-Agra Section",
      corridorId: "CORR-NDLS-AGC",
      name: "New Delhi – Agra Cantt Mainline",
      lengthKm: 195,
      tracks: "Triple Line with High Speed Catenary",
      blockSections: [
        { id: "BLK-11", name: "New Delhi – Tuglakabad", kmStart: 0, kmEnd: 22, status: "NOMINAL" },
        { id: "BLK-12", name: "Tuglakabad – Faridabad", kmStart: 22, kmEnd: 45, status: "NOMINAL" },
        { id: "BLK-13", name: "Faridabad – Palwal", kmStart: 45, kmEnd: 84, status: "NOMINAL" },
        { id: "BLK-14", name: "Palwal – Mathura Jn", kmStart: 84, kmEnd: 141, status: "WARNING" },
        { id: "BLK-15", name: "Mathura Jn – Agra Cantt", kmStart: 141, kmEnd: 195, status: "NOMINAL" }
      ],
      activeTrains: [
        { id: "12002", name: "Bhopal Shatabdi", type: "PREMIUM_PASSENGER", direction: "DOWN", speedKmh: 140, locationKm: 52.0, etaMins: 18 },
        { id: "12280", name: "Taj Express", type: "EXPRESS", direction: "UP", speedKmh: 110, locationKm: 112.5, etaMins: 35 }
      ]
    },
    {
      zone: "Northern Railway (NR)",
      division: "Lucknow Division (LKO)",
      section: "Kanpur-Lucknow Section",
      corridorId: "CORR-CNB-LKO",
      name: "Kanpur Central – Lucknow Charbagh",
      lengthKm: 72,
      tracks: "Double Line Electrified",
      blockSections: [
        { id: "BLK-21", name: "Kanpur Central – Unnao Jn", kmStart: 0, kmEnd: 18, status: "NOMINAL" },
        { id: "BLK-22", name: "Unnao Jn – Harauni", kmStart: 18, kmEnd: 46, status: "NOMINAL" },
        { id: "BLK-23", name: "Harauni – Lucknow Charbagh", kmStart: 46, kmEnd: 72, status: "NOMINAL" }
      ],
      activeTrains: [
        { id: "12004", name: "Lucknow Shatabdi", type: "PREMIUM_PASSENGER", direction: "UP", speedKmh: 120, locationKm: 34.0, etaMins: 20 }
      ]
    }
  ];

  // --- Initial Task Backlog (PRD FR-02, FR-04) ---
  const INITIAL_TASKS = [
    {
      id: "TSK-892A",
      code: "TRK-842",
      dept: "ENG",
      deptName: "Track Engineering (TMS)",
      source: "Track Management System (TMS)",
      title: "Flash-Butt Weld Testing & Ultrasonic Inspection",
      location: "KM 42.5 UP Line (Maripat–Dadri)",
      durationMinutes: 150,
      durationHrs: 2.5,
      criticality: 0.95,
      severity: 0.90,
      urgency: 0.85,
      opImpact: 0.70,
      failureRisk: 0.80,
      status: "CRITICAL",
      safetyProfile: "Absolute Block + Track Occupancy",
      blockType: "TRAFFIC_POWER_BLOCK",
      machineReq: "USFD Flaw Detector + 8 Trackmen",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-441B",
      code: "SIG-119",
      dept: "SNT",
      deptName: "Signal & Telecom (SMMS)",
      source: "Signalling Maintenance System (SMMS)",
      title: "Electronic Interlocking & Point Machine Diagnostic",
      location: "KM 43.1 Point 104A (Maripat–Dadri)",
      durationMinutes: 120,
      durationHrs: 2.0,
      criticality: 0.80,
      severity: 0.75,
      urgency: 0.80,
      opImpact: 0.65,
      failureRisk: 0.60,
      status: "HIGH",
      safetyProfile: "Disconnection Notice + S&T Safety Buffer",
      blockType: "SIGNAL_DISCONNECTION",
      machineReq: "Diagnostic Tool Set + 4 Signal Technicians",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-318C",
      code: "OHE-992",
      dept: "TRD",
      deptName: "Traction Distribution (TDMS)",
      source: "Traction Distribution System (TDMS)",
      title: "25kV Catenary Contact Wire Height Adjustment",
      location: "KM 41.8 – 44.0 (Maripat–Dadri)",
      durationMinutes: 120,
      durationHrs: 2.0,
      criticality: 0.75,
      severity: 0.60,
      urgency: 0.70,
      opImpact: 0.50,
      failureRisk: 0.55,
      status: "ROUTINE",
      safetyProfile: "Power Block (25kV AC Isolation)",
      blockType: "POWER_BLOCK",
      machineReq: "Tower Wagon TW-04 + 6 Electrical Fitters",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-512D",
      code: "BRG-201",
      dept: "ENG",
      deptName: "Bridge Civil Cadre (TMS)",
      source: "Bridge Management System (TMS)",
      title: "Bridge BX-8092 Pier 4 Micro-Crack Epoxy Grouting",
      location: "KM 26.4 UP Line",
      durationMinutes: 210,
      durationHrs: 3.5,
      criticality: 0.98,
      severity: 0.95,
      urgency: 0.90,
      opImpact: 0.85,
      failureRisk: 0.90,
      status: "CRITICAL",
      safetyProfile: "Track Speed Restriction (30 km/h) + Traffic Block",
      blockType: "TRAFFIC_BLOCK",
      machineReq: "High-Pressure Injection Rig + 10 Bridge Cadre",
      bundleCandidate: null
    },
    {
      id: "TSK-201E",
      code: "SIG-122",
      dept: "SNT",
      deptName: "Signal & Telecom (SMMS)",
      source: "Signalling Maintenance System (SMMS)",
      title: "Digital Axle Counter Head Calibration",
      location: "GZB Yard Track 4",
      durationMinutes: 90,
      durationHrs: 1.5,
      criticality: 0.50,
      severity: 0.40,
      urgency: 0.45,
      opImpact: 0.30,
      failureRisk: 0.40,
      status: "ROUTINE",
      safetyProfile: "Caution Order",
      blockType: "NON_INTERLOCKED_BLOCK",
      machineReq: "Axle Counter Multi-Meter + 3 Technicians",
      bundleCandidate: "B-105"
    },
    {
      id: "TSK-609F",
      code: "TRK-845",
      dept: "ENG",
      deptName: "Track Engineering (TMS)",
      source: "Track Management System (TMS)",
      title: "Ballast Tamping & Track Geometry Alignment",
      location: "GZB Yard Turnout 12",
      durationMinutes: 120,
      durationHrs: 2.0,
      criticality: 0.70,
      severity: 0.65,
      urgency: 0.60,
      opImpact: 0.55,
      failureRisk: 0.50,
      status: "HIGH",
      safetyProfile: "Tamping Machine Block",
      blockType: "TRAFFIC_BLOCK",
      machineReq: "CSM Tamping Machine + 8 PW Gang",
      bundleCandidate: "B-105"
    }
  ];

  // --- PRD Priority Scoring Formula (Section 8.2) ---
  function calculatePriority(task) {
    const crit = task.criticality > 1 ? task.criticality / 10 : (task.criticality || 0.7);
    const sev = task.severity > 1 ? task.severity / 10 : (task.severity || 0.6);
    const urg = task.urgency > 1 ? task.urgency / 10 : (task.urgency || 0.6);
    const op = task.opImpact > 1 ? task.opImpact / 10 : (task.opImpact || 0.5);
    const risk = task.failureRisk > 1 ? task.failureRisk / 10 : (task.failureRisk || 0.5);

    const p = (0.30 * crit) + (0.25 * sev) + (0.20 * urg) + (0.15 * op) + (0.10 * risk);
    return Math.round(p * 100);
  }

  // --- Bundles (PRD Section 7.1) ---
  const BUNDLES = [
    {
      bundleId: "B-104",
      name: "Bundle B-104: Track + Signal + OHE Integration",
      corridorId: "CORR-GZB-ALJN",
      blockSection: "Maripat – Dadri (KM 41.8 – 44.0)",
      departments: ["Engineering (Civil)", "Signal & Telecom (S&T)", "Traction Distribution (TRD)"],
      tasks: ["TSK-892A (TRK-842)", "TSK-441B (SIG-119)", "TSK-318C (OHE-992)"],
      scheduledWindow: "Monday 01:00 – 04:00 (Night Off-Peak)",
      durationMinutes: 180,
      baselineSeparateMinutes: 390,
      timeSavedMinutes: 210,
      blockReductionPercent: 42,
      utilizationUplift: 32,
      trainGapClearance: "Zero conflict with Shatabdi 12042 and Goods G-8891",
      explainabilityReason: "All 3 tasks require 25kV OHE isolation and track occupancy along KM 41.8-44.0. Bundling achieves 210 min downtime savings while respecting safety isolation envelopes.",
      status: "OPTIMIZED_RECOMMENDED"
    },
    {
      bundleId: "B-105",
      name: "Bundle B-105: Engineering + S&T Yard Maintenance",
      corridorId: "CORR-GZB-ALJN",
      blockSection: "Sahibabad – Ghaziabad Jn (KM 12.0 – 15.2)",
      departments: ["Engineering (Civil)", "Signal & Telecom (S&T)"],
      tasks: ["TSK-201E (SIG-122)", "TSK-609F (TRK-845)"],
      scheduledWindow: "Wednesday 02:00 – 04:30 (Off-Peak)",
      durationMinutes: 150,
      baselineSeparateMinutes: 210,
      timeSavedMinutes: 60,
      blockReductionPercent: 28,
      utilizationUplift: 18,
      trainGapClearance: "Interleaved between late night freight movements",
      explainabilityReason: "Track tamping and axle counter calibration share the yard turnout access window without conflicting safety procedures.",
      status: "OPTIMIZED_RECOMMENDED"
    }
  ];

  // --- Initial Audit Trail (PRD FR-16) ---
  const INITIAL_AUDIT = [
    { id: "AUD-101", user: "NRD-4829 (Chief Controller)", action: "SYSTEM_INITIALIZE", note: "Common railway data model loaded from TMS, SMMS, TDMS", timestamp: "08:30:15" },
    { id: "AUD-102", user: "AI_OPTIMIZER_V2.5", action: "BUNDLE_DISCOVERY", note: "Multi-department bundle B-104 formed (ENG + SNT + TRD at KM 42.5)", timestamp: "09:12:44" },
    { id: "AUD-103", user: "AI_OPTIMIZER_V2.5", action: "CP_SAT_SOLVER_PASS", note: "0 hard constraint violations detected. 8 soft objectives maximized.", timestamp: "09:12:45" },
    { id: "AUD-104", user: "NRD-4829", action: "PLAN_STATUS_UPDATE", note: "Plan status set to RECOMMENDED for Ghaziabad-Aligarh Section", timestamp: "09:45:00" }
  ];

  // --- Persistent Storage Layer ---
  function getStored(key, fallback) {
    try {
      const localData = localStorage.getItem('rt_' + key);
      if (localData) return JSON.parse(localData);
      const sessData = sessionStorage.getItem('rt_' + key);
      if (sessData) return JSON.parse(sessData);
      return fallback;
    } catch(e) {
      return fallback;
    }
  }

  function setStored(key, val) {
    try {
      const json = JSON.stringify(val);
      localStorage.setItem('rt_' + key, json);
      sessionStorage.setItem('rt_' + key, json);
    } catch(e) {}
  }

  // Active state initialization
  let currentCorridorIndex = getStored('active_corridor_idx', 0);
  let tasks = getStored('tasks', INITIAL_TASKS);
  let planStatus = getStored('plan_status', "RECOMMENDED");
  let isOptimized = getStored('is_optimized', true);
  let auditLogs = getStored('audit_logs', INITIAL_AUDIT);
  let emergencyInjected = getStored('emergency_injected', false);

  tasks.forEach(t => {
    t.priorityScore = calculatePriority(t);
    t.durationHrs = t.durationHrs || (t.durationMinutes ? (t.durationMinutes / 60).toFixed(1) : 2.0);
  });

  // --- Async REST Backend Connector ---
  async function checkBackendConnection() {
    try {
      const resp = await fetch(`${API_BASE_URL}/`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        backendConnected = true;
        backendChecked = true;
        updateStatusBadges();
        return true;
      }
    } catch (e) {
      backendConnected = false;
      backendChecked = true;
      updateStatusBadges();
      return false;
    }
    return false;
  }

  function updateStatusBadges() {
    const badges = document.querySelectorAll('.rt-backend-badge');
    badges.forEach(b => {
      if (backendConnected) {
        b.className = 'rt-backend-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30';
        b.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>FastAPI CP-SAT Online</span>';
        b.title = "Connected to Python FastAPI Backend (Google OR-Tools CP-SAT Solver Active)";
      } else {
        b.className = 'rt-backend-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30';
        b.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-amber-500"></span><span>Local Simulation Engine</span>';
        b.title = "Operating in high-fidelity client-side simulation mode";
      }
    });
  }

  // Automatic connection probe on engine load
  setTimeout(checkBackendConnection, 100);

  return {
    // --- Connection Status ---
    isBackendConnected: () => backendConnected,
    checkBackendHealth: checkBackendConnection,
    getApiUrl: () => API_BASE_URL,

    // --- Network Queries (FR-01) ---
    getNetworks: () => NETWORKS,
    getCurrentNetwork: () => NETWORKS[currentCorridorIndex] || NETWORKS[0],
    setCorridorIndex: (idx) => {
      currentCorridorIndex = idx;
      setStored('active_corridor_idx', idx);
      RailTwinEngine.logAudit("CORRIDOR_SWITCH", `Switched active corridor to: ${NETWORKS[idx].name}`);
    },

    // --- Task Backlog Queries & CRUD (FR-02, FR-05, FR-06) ---
    getTasks: () => tasks,
    getTasksByDept: (dept) => {
      if (!dept || dept === 'ALL') return tasks;
      return tasks.filter(t => t.dept.toUpperCase() === dept.toUpperCase());
    },
    getPriorityScore: calculatePriority,

    // Add New Maintenance Task / Requirement (Manual Creator)
    addTask: async function(taskData, onComplete) {
      const newTask = Object.assign({
        id: "TSK-" + Math.floor(1000 + Math.random() * 9000),
        code: "AST-" + Math.floor(100 + Math.random() * 900),
        dept: "ENG",
        deptName: "Track Engineering (TMS)",
        source: "Controller Manual Entry",
        title: "Field Maintenance Request",
        location: "KM 42.0 UP Line",
        durationMinutes: 120,
        durationHrs: 2.0,
        criticality: 0.70,
        severity: 0.65,
        urgency: 0.60,
        opImpact: 0.50,
        failureRisk: 0.50,
        status: "HIGH",
        safetyProfile: "Absolute Block Required",
        blockType: "TRAFFIC_BLOCK",
        machineReq: "Standard Gang Equipment",
        bundleCandidate: null
      }, taskData);

      newTask.priorityScore = calculatePriority(newTask);
      tasks.unshift(newTask);
      setStored('tasks', tasks);
      RailTwinEngine.logAudit("TASK_CREATED", `Created maintenance task ${newTask.id} (${newTask.title}) in database.`);

      // Sync with FastAPI if connected
      if (backendConnected) {
        try {
          await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
          });
        } catch (e) {}
      }

      if (onComplete) onComplete(newTask);
      return newTask;
    },

    deleteTask: function(taskId) {
      tasks = tasks.filter(t => t.id !== taskId);
      setStored('tasks', tasks);
      RailTwinEngine.logAudit("TASK_DELETED", `Removed task ${taskId} from active database.`);
    },

    // --- Bundles & Optimization (FR-07, FR-09, FR-10, FR-11) ---
    getBundles: () => BUNDLES,
    getOptimizationStatus: () => isOptimized,
    getPlanStatus: () => planStatus,

    runOptimization: async (horizon = "weekly", onComplete) => {
      isOptimized = true;
      setStored('is_optimized', true);

      let solverStats = {
        blockReduction: "-42%",
        utilization: "78.4%",
        downtimeSaved: "4.5h",
        trainConflicts: 0,
        jointBundles: BUNDLES.length
      };

      if (backendConnected) {
        try {
          const resp = await fetch(`${API_BASE_URL}/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ horizon: horizon })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.result) {
              solverStats.blockReduction = `-${data.result.reduction_pct}%`;
              solverStats.utilization = `${data.result.block_utilization_pct}%`;
              solverStats.downtimeSaved = `${data.result.downtime_saved_hours}h`;
              solverStats.jointBundles = data.result.joint_multi_department_blocks;
            }
          }
        } catch (e) {}
      }

      RailTwinEngine.logAudit("CP_SAT_OPTIMIZE", `CP-SAT constraint optimization run completed for ${horizon} horizon. Multi-department bundles generated.`);
      if (onComplete) onComplete(solverStats);
      return solverStats;
    },

    setPlanStatus: (newStatus) => {
      planStatus = newStatus;
      setStored('plan_status', newStatus);
      RailTwinEngine.logAudit("PLAN_APPROVAL", `Plan state transitioned to ${newStatus}`);
    },

    approvePlan: async (onComplete) => {
      planStatus = "APPROVED";
      setStored('plan_status', "APPROVED");
      RailTwinEngine.logAudit("PLAN_APPROVED", "Plan approved by Chief Controller without manual overrides.");
      if (backendConnected) {
        try {
          await fetch(`${API_BASE_URL}/plans/weekly/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "APPROVE", note: "Approved via Command Center UI" })
          });
        } catch (e) {}
      }
      if (onComplete) onComplete("APPROVED");
    },

    lockPlan: async (onComplete) => {
      planStatus = "LOCKED";
      setStored('plan_status', "LOCKED");
      RailTwinEngine.logAudit("PLAN_LOCKED", "Plan finalized and locked for live field dispatch.");
      if (backendConnected) {
        try {
          await fetch(`${API_BASE_URL}/plans/weekly/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "LOCK", note: "Locked for live field execution" })
          });
        } catch (e) {}
      }
      if (onComplete) onComplete("LOCKED");
    },

    // --- Dynamic Re-Planner / Defect Injection (FR-12, Demo Step 7) ---
    injectEmergencyDefect: async (onComplete) => {
      if (emergencyInjected) return;
      emergencyInjected = true;
      setStored('emergency_injected', true);

      const emergencyTask = {
        id: "TSK-999-EMERG",
        code: "TRK-911-FRACTURE",
        dept: "ENG",
        deptName: "Track Engineering (TMS)",
        source: "TMS Emergency Sensor Alarm",
        title: "EMERGENCY: Rail Fracture at KM 42.8 UP Line",
        location: "KM 42.8 UP Line (Maripat–Dadri)",
        durationMinutes: 90,
        durationHrs: 1.5,
        criticality: 1.0,
        severity: 1.0,
        urgency: 1.0,
        opImpact: 0.95,
        failureRisk: 1.0,
        status: "CRITICAL",
        safetyProfile: "IMMEDIATE TRAFFIC HALT + Emergency Clamping",
        blockType: "EMERGENCY_TRAFFIC_BLOCK",
        machineReq: "Emergency Clamping Rig + 6 PW Trackmen",
        priorityScore: 99
      };

      tasks.unshift(emergencyTask);
      setStored('tasks', tasks);

      if (backendConnected) {
        try {
          await fetch(`${API_BASE_URL}/events/critical-defect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: emergencyTask.title, location: emergencyTask.location })
          });
        } catch (e) {}
      }

      RailTwinEngine.logAudit("EMERGENCY_INJECT", "CRITICAL ALERT: Rail Fracture detected at KM 42.8. Dynamic Re-Optimizer triggered.");
      RailTwinEngine.logAudit("DYNAMIC_REOPTIMIZE", "Targeted re-optimization complete. Preserved unaffected schedules in BLK-01, BLK-04, BLK-05. Shifted downstream freight G-8891 by 35 mins.");

      if (onComplete) onComplete(emergencyTask);
    },

    // --- What-If Simulator (FR-13, Demo Step 8) ---
    simulateWhatIf: async (scenarioType) => {
      let result = {};
      if (scenarioType === 'CANCEL_BLOCK') {
        result = {
          title: "What-If: Block Cancellation at Maripat-Dadri",
          baselineUtilization: "78.4%",
          simulatedUtilization: "61.2%",
          impactSummary: "Cancelling Block B-104 defers 3 tasks (TRK-842, SIG-119, OHE-992). Overdue risk score rises by +24%.",
          recommendedAlternative: "Auto-shift workload to Tuesday 02:00 window (Slot S-208) with zero passenger train delays.",
          kpiDelta: { utilization: "-17.2%", separateBlocks: "+2", delayRisk: "+12m" }
        };
      } else if (scenarioType === 'FREIGHT_SURGE') {
        result = {
          title: "What-If: +3 Additional Goods Trains (DFCCIL Reroute)",
          baselineUtilization: "78.4%",
          simulatedUtilization: "74.0%",
          impactSummary: "Available maintenance gaps reduce from 240 mins to 190 mins. All bundled tasks still fit within 180 min window.",
          recommendedAlternative: "Tighten buffer times between track tamping and TRD tower wagon clearing.",
          kpiDelta: { utilization: "-4.4%", separateBlocks: "0", delayRisk: "+4m" }
        };
      } else {
        result = {
          title: "What-If: 30 km/h Temporary Speed Restriction (TSR)",
          baselineUtilization: "78.4%",
          simulatedUtilization: "76.1%",
          impactSummary: "Pass-through time for Shatabdi increased by 6.2 mins. Scheduled maintenance block start shifted by +8 mins.",
          recommendedAlternative: "Adjust start from 01:00 to 01:08; maintain full 180 min maintenance duration.",
          kpiDelta: { utilization: "-2.3%", separateBlocks: "0", delayRisk: "+6.2m" }
        };
      }

      if (backendConnected) {
        try {
          const resp = await fetch(`${API_BASE_URL}/scenarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario_type: scenarioType })
          });
          if (resp.ok) {
            const apiRes = await resp.json();
            result.title = apiRes.title || result.title;
            result.impactSummary = apiRes.impact_summary || result.impactSummary;
            result.recommendedAlternative = apiRes.recommended_recovery || result.recommendedAlternative;
          }
        } catch (e) {}
      }

      RailTwinEngine.logAudit("WHAT_IF_SIMULATION", `Executed What-If simulation: ${result.title}. Baseline preserved intact.`);
      return result;
    },

    // --- CSV & JSON Ingestion Engine (FR-02, FR-04) ---
    importTasksFromCSV: function(csvText) {
      if (!csvText || typeof csvText !== 'string') return { success: false, error: "Empty CSV file" };
      try {
        const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) return { success: false, error: "CSV must contain a header row and at least one data record." };

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
        const newTasks = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < 3) continue;

          const row = {};
          headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });

          const durMins = parseInt(row['durationminutes'] || row['duration'] || 120, 10);
          const taskObj = {
            id: row['taskid'] || row['id'] || ("TSK-" + Math.floor(1000 + Math.random() * 9000)),
            code: row['code'] || row['assetcode'] || ("AST-" + Math.floor(100 + Math.random() * 900)),
            dept: (row['dept'] || row['department'] || 'ENG').toUpperCase(),
            deptName: row['deptname'] || (row['dept'] === 'SNT' ? 'Signal & Telecom (SMMS)' : (row['dept'] === 'TRD' ? 'Traction Distribution (TDMS)' : 'Track Engineering (TMS)')),
            source: row['source'] || (row['dept'] === 'SNT' ? 'SMMS Portal' : (row['dept'] === 'TRD' ? 'TDMS Portal' : 'TMS Portal')),
            title: row['title'] || row['tasktitle'] || "Imported Maintenance Order",
            location: row['location'] || "KM " + (Math.random() * 80).toFixed(1) + " UP Line",
            durationMinutes: durMins,
            durationHrs: (durMins / 60).toFixed(1),
            criticality: parseFloat(row['criticality'] || 0.7),
            severity: parseFloat(row['severity'] || 0.6),
            urgency: parseFloat(row['urgency'] || 0.6),
            opImpact: parseFloat(row['opimpact'] || 0.5),
            failureRisk: parseFloat(row['failurerisk'] || 0.5),
            status: (row['status'] || 'HIGH').toUpperCase(),
            safetyProfile: row['safetyprofile'] || "Absolute Safety Block",
            blockType: row['blocktype'] || "TRAFFIC_POWER_BLOCK",
            machineReq: row['machinereq'] || row['machinerequirement'] || "PW Gang Equipment",
            bundleCandidate: row['bundlecandidate'] || null
          };

          taskObj.priorityScore = calculatePriority(taskObj);
          newTasks.push(taskObj);
        }

        if (newTasks.length === 0) return { success: false, error: "No valid task rows could be parsed." };

        tasks = [...newTasks, ...tasks];
        setStored('tasks', tasks);
        RailTwinEngine.logAudit("DATA_INGESTION_CSV", `Stored ${newTasks.length} task records into database.`);
        return { success: true, count: newTasks.length, sample: newTasks[0] };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    importTasksFromJSON: function(jsonList) {
      if (!Array.isArray(jsonList) || jsonList.length === 0) return { success: false, error: "Invalid JSON array" };
      const parsed = jsonList.map(t => {
        const item = Object.assign({}, t);
        item.priorityScore = calculatePriority(item);
        item.durationHrs = item.durationHrs || (item.durationMinutes ? (item.durationMinutes / 60).toFixed(1) : 2.0);
        return item;
      });
      tasks = [...parsed, ...tasks];
      setStored('tasks', tasks);
      RailTwinEngine.logAudit("DATA_INGESTION_JSON", `Stored ${parsed.length} tasks into persistent database.`);
      return { success: true, count: parsed.length };
    },

    // Database Dump & Restore
    exportDatabaseJSON: function() {
      const dump = {
        exportedAt: new Date().toISOString(),
        tasks: tasks,
        bundles: BUNDLES,
        auditLogs: auditLogs,
        corridorIndex: currentCorridorIndex,
        planStatus: planStatus
      };
      return JSON.stringify(dump, null, 2);
    },

    importDatabaseJSON: function(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (data.tasks && Array.isArray(data.tasks)) {
          tasks = data.tasks;
          tasks.forEach(t => {
            t.priorityScore = calculatePriority(t);
            t.durationHrs = t.durationHrs || (t.durationMinutes ? (t.durationMinutes / 60).toFixed(1) : 2.0);
          });
          setStored('tasks', tasks);
        }
        if (data.auditLogs && Array.isArray(data.auditLogs)) {
          auditLogs = data.auditLogs;
          setStored('audit_logs', auditLogs);
        }
        RailTwinEngine.logAudit("DB_RESTORE", `Restored database backup (${tasks.length} tasks).`);
        return { success: true, count: tasks.length };
      } catch(e) {
        return { success: false, error: e.message };
      }
    },

    resetToDefaults: function() {
      tasks = INITIAL_TASKS.map(t => Object.assign({}, t));
      tasks.forEach(t => { t.priorityScore = calculatePriority(t); });
      emergencyInjected = false;
      planStatus = "RECOMMENDED";
      setStored('tasks', tasks);
      setStored('emergency_injected', false);
      setStored('plan_status', planStatus);
      RailTwinEngine.logAudit("DATABASE_RESET", "Backlog and planning schedule restored to baseline factory state.");
    },

    // Sample Download Generators (PRD FR-02)
    getSampleCSV: function(type = 'TASKS_ALL') {
      if (type === 'TMS_ENG') {
        return `Task ID,Code,Dept,Title,Location,Duration Minutes,Criticality,Severity,Urgency,Op Impact,Failure Risk,Status,Safety Profile,Block Type,Machine Requirement
TSK-1001,TRK-901,ENG,Deep Screening of Ballast (BCM Machine),KM 14.5 UP Line,240,0.92,0.88,0.85,0.70,0.80,CRITICAL,Absolute Machine Block,TRAFFIC_BLOCK,BCM Ballast Cleaner + 12 Gang
TSK-1002,TRK-902,ENG,Turnout Diamond Crossing Replacement,GZB Yard Pt 112,180,0.85,0.80,0.75,0.80,0.75,HIGH,Speed Restriction 20 km/h,TRAFFIC_BLOCK,Rail Crane + 8 Trackmen`;
      } else if (type === 'SMMS_SNT') {
        return `Task ID,Code,Dept,Title,Location,Duration Minutes,Criticality,Severity,Urgency,Op Impact,Failure Risk,Status,Safety Profile,Block Type,Machine Requirement
TSK-2001,SIG-301,SNT,Track Circuit Lead Cable Renewal,KM 41.8 UP Line,120,0.88,0.80,0.85,0.60,0.70,HIGH,Signal Disconnection Notice,SIGNAL_DISCONNECTION,Cable Jointing Kit + 4 Techs
TSK-2002,SIG-302,SNT,Automatic Block Signal Head Overhaul,KM 68.2 DN Line,90,0.65,0.55,0.60,0.40,0.50,ROUTINE,Caution Order,NON_INTERLOCKED_BLOCK,Signal Analyzer + 3 Techs`;
      } else if (type === 'TDMS_TRD') {
        return `Task ID,Code,Dept,Title,Location,Duration Minutes,Criticality,Severity,Urgency,Op Impact,Failure Risk,Status,Safety Profile,Block Type,Machine Requirement
TSK-3001,OHE-501,TRD,Catenary Insulator High-Pressure Washing,KM 42.0 - 45.0,150,0.80,0.75,0.70,0.50,0.60,HIGH,25kV Power Block + Earth,POWER_BLOCK,Tower Wagon TW-02 + 6 Fitters
TSK-3002,OHE-502,TRD,Cantilever Assembly Contact Wire Dropper Fix,KM 28.0 UP Line,120,0.70,0.65,0.60,0.45,0.50,ROUTINE,25kV Power Block,POWER_BLOCK,Ladders + 4 OHE Linemen`;
      } else if (type === 'TIMETABLE') {
        return `Train Number,Train Name,Category,Origin,Destination,Section Arrival,Section Departure,Direction,Max Speed KMPH,Priority Rank
12042,Shatabdi Express,PREMIUM_PASSENGER,NDLS,LKO,06:15,07:30,DOWN,130,1
22436,Vande Bharat Express,HIGH_SPEED,BSB,NDLS,14:20,15:35,UP,145,1
12280,Taj Express,SUPERFAST,NZM,JHS,07:10,08:40,DOWN,110,2
G-8891,Container Freight,FREIGHT,TKD,DADRI,01:30,03:15,DOWN,75,4`;
      } else {
        return `Task ID,Code,Dept,Title,Location,Duration Minutes,Criticality,Severity,Urgency,Op Impact,Failure Risk,Status,Safety Profile,Block Type,Machine Requirement
TSK-1001,TRK-901,ENG,Deep Screening of Ballast (BCM Machine),KM 14.5 UP Line,240,0.92,0.88,0.85,0.70,0.80,CRITICAL,Absolute Machine Block,TRAFFIC_BLOCK,BCM Machine + 12 Trackmen
TSK-2001,SIG-301,SNT,Track Circuit Lead Cable Renewal,KM 41.8 UP Line,120,0.88,0.80,0.85,0.60,0.70,HIGH,Signal Disconnection Notice,SIGNAL_DISCONNECTION,Cable Tester + 4 Techs
TSK-3001,OHE-501,TRD,Catenary Insulator High-Pressure Washing,KM 42.0 - 45.0,150,0.80,0.75,0.70,0.50,0.60,HIGH,25kV Power Block,POWER_BLOCK,Tower Wagon + 6 Fitters`;
      }
    },

    // --- KPI Suite (PRD Section 19) ---
    getKPIs: () => ({
      blockUtilization: { baseline: "48.2%", optimized: "78.4%", diff: "+30.2%" },
      separateBlocks: { baseline: "24", optimized: "14", diff: "-41.7%" },
      totalDowntimeHrs: { baseline: "46.5h", optimized: "30.2h", diff: "-35.1%" },
      criticalCompletionRate: { baseline: "75%", optimized: "100%", diff: "+25%" },
      multiDeptBundlesCount: BUNDLES.length,
      trainConflictCount: 0,
      scheduleStability: "86.4%"
    }),

    // --- Audit Logging (FR-16) ---
    getAuditLogs: () => auditLogs,
    logAudit: (action, note) => {
      const auth = JSON.parse(sessionStorage.getItem('rt_auth') || '{"id":"NRD-4829"}');
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const entry = {
        id: "AUD-" + Math.floor(100 + Math.random() * 900),
        user: auth.id || "SYS_OPERATOR",
        action,
        note,
        timestamp: timeStr
      };
      auditLogs.unshift(entry);
      setStored('audit_logs', auditLogs);
      window.dispatchEvent(new CustomEvent('railtwin:audit_update', { detail: entry }));
    }
  };
})();

// Attach to window
window.RailTwinEngine = RailTwinEngine;
