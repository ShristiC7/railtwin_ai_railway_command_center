/**
 * RailTwin AI — Client-Side Railway Intelligence Engine
 * SIH 2026 | Problem Statement 26027
 * 
 * Features:
 * - Network Hierarchy (Zone -> Division -> Section -> Corridor -> Block Section -> Track -> Asset)
 * - Multi-Department Ingestion (TMS/Engineering, SMMS/S&T, TDMS/TRD)
 * - Explainable Priority Scoring (PRD Formula)
 * - Multi-Department Bundling & CP-SAT Constraint Optimization Simulator
 * - Dynamic Re-Planning & Critical Defect Injection
 * - What-If Scenario Simulator
 * - Human Approval Lifecycle & Audit Logging
 */

const RailTwinEngine = (function() {
  'use strict';

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

  // --- Maintenance Task Backlog ---
  const INITIAL_TASKS = [
    {
      id: "TSK-892A",
      code: "TRK-842",
      title: "Flash-Butt Weld Testing & Ultrasonic Inspection",
      dept: "ENG",
      deptName: "Engineering (Civil)",
      source: "TMS (Track Management System)",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-03",
      location: "KM 42.5 UP Line",
      kmStart: 42.0,
      kmEnd: 43.5,
      severity: 0.95,
      criticality: 0.92,
      urgency: 0.88,
      opImpact: 0.85,
      failureRisk: 0.90,
      durationHrs: 2.5,
      blockType: "TRAFFIC_POWER_DISCONNECT",
      safetyProfile: "ISOLATION_REQUIRED",
      status: "CRITICAL",
      dueDate: "2026-09-02",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-441B",
      code: "SIG-119",
      title: "Electronic Interlocking & Point Machine Diagnostic",
      dept: "SNT",
      deptName: "Signal & Telecom (S&T)",
      source: "SMMS (Signalling Maintenance System)",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-03",
      location: "KM 42.8 Maripat-Dadri Junction",
      kmStart: 42.4,
      kmEnd: 43.2,
      severity: 0.75,
      criticality: 0.80,
      urgency: 0.70,
      opImpact: 0.65,
      failureRisk: 0.60,
      durationHrs: 2.0,
      blockType: "TRAFFIC_POWER_DISCONNECT",
      safetyProfile: "TRACK_CIRCUIT_DEACTIVATE",
      status: "HIGH",
      dueDate: "2026-09-03",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-318C",
      code: "OHE-992",
      title: "25kV Catenary Contact Wire Height Adjustment",
      dept: "TRD",
      deptName: "Traction Distribution (TRD)",
      source: "TDMS (Traction Distribution System)",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-03",
      location: "KM 41.8 - 44.0 Sector B",
      kmStart: 41.8,
      kmEnd: 44.0,
      severity: 0.60,
      criticality: 0.70,
      urgency: 0.55,
      opImpact: 0.60,
      failureRisk: 0.50,
      durationHrs: 2.0,
      blockType: "OHE_POWER_SHUTDOWN",
      safetyProfile: "TOWER_WAGON_OCCUPANCY",
      status: "ROUTINE",
      dueDate: "2026-09-04",
      bundleCandidate: "B-104"
    },
    {
      id: "TSK-512D",
      code: "BRG-8092",
      title: "Bridge BX-8092 Pier 4 Micro-Crack Epoxy Grouting",
      dept: "ENG",
      deptName: "Engineering (Civil / Bridges)",
      source: "TMS (Bridge Cadre)",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-02",
      location: "KM 26.4 Viaduct Pier 4",
      kmStart: 26.0,
      kmEnd: 26.8,
      severity: 0.90,
      criticality: 0.98,
      urgency: 0.95,
      opImpact: 0.90,
      failureRisk: 0.92,
      durationHrs: 3.5,
      blockType: "SPEED_RESTRICTION_CAUTION",
      safetyProfile: "STRUCTURAL_MONITORING",
      status: "CRITICAL",
      dueDate: "2026-08-30",
      bundleCandidate: null
    },
    {
      id: "TSK-201E",
      code: "SIG-122",
      title: "Digital Axle Counter Head Calibration",
      dept: "SNT",
      deptName: "Signal & Telecom (S&T)",
      source: "SMMS",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-01",
      location: "GZB Yard Km 12-14",
      kmStart: 12.0,
      kmEnd: 14.0,
      severity: 0.50,
      criticality: 0.65,
      urgency: 0.40,
      opImpact: 0.50,
      failureRisk: 0.45,
      durationHrs: 1.5,
      blockType: "TRAFFIC_CAUTION",
      safetyProfile: "YARD_DISCONNECTION",
      status: "ROUTINE",
      dueDate: "2026-09-07",
      bundleCandidate: "B-105"
    },
    {
      id: "TSK-609F",
      code: "TRK-845",
      title: "Ballast Tamping & Track Geometry Alignment",
      dept: "ENG",
      deptName: "Engineering (Civil)",
      source: "TMS (Track Cadre)",
      corridorId: "CORR-GZB-ALJN",
      blockId: "BLK-01",
      location: "Km 13.0 - 15.2 Yard Exit",
      kmStart: 13.0,
      kmEnd: 15.2,
      severity: 0.70,
      criticality: 0.75,
      urgency: 0.65,
      opImpact: 0.70,
      failureRisk: 0.60,
      durationHrs: 2.0,
      blockType: "TRAFFIC_BLOCK",
      safetyProfile: "TAMPING_MACHINE_OCCUPANCY",
      status: "HIGH",
      dueDate: "2026-09-05",
      bundleCandidate: "B-105"
    }
  ];

  // --- Calculate Explainable Priority Score using PRD Formula ---
  // Formula: Priority = 0.30*Crit + 0.25*Sev + 0.20*Urg + 0.15*OpImpact + 0.10*FailRisk
  function calculatePriority(task) {
    const score = (
      0.30 * task.criticality +
      0.25 * task.severity +
      0.20 * task.urgency +
      0.15 * task.opImpact +
      0.10 * task.failureRisk
    );
    return parseFloat((score * 100).toFixed(1)); // percentage score out of 100
  }

  // --- Multi-Department Bundles Definition ---
  const BUNDLES = [
    {
      bundleId: "B-104",
      name: "Bundle B-104: Engineering + S&T + TRD Integrated Block",
      corridorId: "CORR-GZB-ALJN",
      blockSection: "Maripat – Dadri (KM 41.8 – 44.0)",
      departments: ["Engineering (Civil)", "Signal & Telecom (S&T)", "Traction Distribution (TRD)"],
      tasks: ["TSK-892A (TRK-842)", "TSK-441B (SIG-119)", "TSK-318C (OHE-992)"],
      scheduledWindow: "Monday 01:00 – 04:00 (Night Off-Peak)",
      durationMinutes: 180,
      baselineSeparateMinutes: 390, // 150 + 120 + 120
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

  // --- Audit Trail ---
  const INITIAL_AUDIT = [
    { id: "AUD-101", user: "NRD-4829 (Chief Controller)", action: "SYSTEM_INITIALIZE", note: "Common railway data model loaded from TMS, SMMS, TDMS", timestamp: "08:30:15" },
    { id: "AUD-102", user: "AI_OPTIMIZER_V2.4", action: "BUNDLE_DISCOVERY", note: "Multi-department bundle B-104 formed (ENG + SNT + TRD at KM 42.5)", timestamp: "09:12:44" },
    { id: "AUD-103", user: "AI_OPTIMIZER_V2.4", action: "CP_SAT_SOLVER_PASS", note: "0 hard constraint violations detected. 8 soft objectives maximized.", timestamp: "09:12:45" },
    { id: "AUD-104", user: "NRD-4829", action: "PLAN_STATUS_UPDATE", note: "Plan status set to RECOMMENDED for Ghaziabad-Aligarh Section", timestamp: "09:45:00" }
  ];

  // --- State Store in Session Storage ---
  function getStored(key, fallback) {
    try {
      const data = sessionStorage.getItem('rt_' + key);
      return data ? JSON.parse(data) : fallback;
    } catch(e) {
      return fallback;
    }
  }

  function setStored(key, val) {
    try {
      sessionStorage.setItem('rt_' + key, JSON.stringify(val));
    } catch(e) {}
  }

  // Active state initialization
  let currentCorridorIndex = getStored('active_corridor_idx', 0);
  let tasks = getStored('tasks', INITIAL_TASKS);
  let planStatus = getStored('plan_status', "RECOMMENDED"); // DRAFT, RECOMMENDED, APPROVED, LOCKED
  let isOptimized = getStored('is_optimized', true);
  let auditLogs = getStored('audit_logs', INITIAL_AUDIT);
  let emergencyInjected = getStored('emergency_injected', false);

  // Recalculate priority on all tasks
  tasks.forEach(t => {
    t.priorityScore = calculatePriority(t);
  });

  return {
    // --- Network Queries ---
    getNetworks: () => NETWORKS,
    getCurrentNetwork: () => NETWORKS[currentCorridorIndex] || NETWORKS[0],
    setCorridorIndex: (idx) => {
      currentCorridorIndex = idx;
      setStored('active_corridor_idx', idx);
      RailTwinEngine.logAudit("CORRIDOR_SWITCH", `Switched active corridor to: ${NETWORKS[idx].name}`);
    },

    // --- Task Backlog Queries ---
    getTasks: () => tasks,
    getTasksByDept: (dept) => {
      if (!dept || dept === 'ALL') return tasks;
      return tasks.filter(t => t.dept.toUpperCase() === dept.toUpperCase());
    },
    getPriorityScore: calculatePriority,

    // --- Bundles & Optimization ---
    getBundles: () => BUNDLES,
    getOptimizationStatus: () => isOptimized,
    getPlanStatus: () => planStatus,

    // --- Actions ---
    runOptimization: (onComplete) => {
      isOptimized = true;
      setStored('is_optimized', true);
      RailTwinEngine.logAudit("CP_SAT_OPTIMIZE", "Manual CP-SAT constraint optimization run completed. Bundles refreshed.");
      if (onComplete) onComplete({
        blockReduction: "-42%",
        utilization: "78%",
        downtimeSaved: "4.5h",
        trainConflicts: 0
      });
    },

    approvePlan: (onComplete) => {
      planStatus = "APPROVED";
      setStored('plan_status', planStatus);
      RailTwinEngine.logAudit("PLAN_APPROVAL", `Plan approved and locked by user authorization.`);
      if (onComplete) onComplete(planStatus);
    },

    lockPlan: (onComplete) => {
      planStatus = "LOCKED";
      setStored('plan_status', planStatus);
      RailTwinEngine.logAudit("PLAN_LOCKED", `Plan locked against automated modifications.`);
      if (onComplete) onComplete(planStatus);
    },

    // --- Dynamic Re-Optimization / Emergency Defect (Demo Step 7) ---
    injectEmergencyDefect: (onComplete) => {
      emergencyInjected = true;
      setStored('emergency_injected', true);
      
      // Inject new critical task
      const emergencyTask = {
        id: "TSK-999-EMERG",
        code: "EMERG-TRK-99",
        title: "🚨 EMERGENCY: Rail Fracture at KM 42.8 UP Line",
        dept: "ENG",
        deptName: "Engineering (Civil / Safety)",
        source: "TMS Emergency Sensor Alarm",
        corridorId: "CORR-GZB-ALJN",
        blockId: "BLK-03",
        location: "KM 42.8 UP Line (Immediate Isolation)",
        kmStart: 42.6,
        kmEnd: 43.0,
        severity: 1.0,
        criticality: 1.0,
        urgency: 1.0,
        opImpact: 0.95,
        failureRisk: 1.0,
        durationHrs: 2.0,
        blockType: "EMERGENCY_TRACK_CLOSURE",
        safetyProfile: "IMMEDIATE_TRAFFIC_HALT",
        status: "CRITICAL",
        dueDate: "IMMEDIATE (TODAY)",
        bundleCandidate: "B-104-EMERG"
      };
      emergencyTask.priorityScore = calculatePriority(emergencyTask);

      // Prepend to tasks
      tasks.unshift(emergencyTask);
      setStored('tasks', tasks);

      RailTwinEngine.logAudit("EMERGENCY_INJECT", "CRITICAL ALERT: Rail Fracture detected at KM 42.8. Dynamic Re-Optimizer triggered.");
      RailTwinEngine.logAudit("DYNAMIC_REOPTIMIZE", "Targeted re-optimization complete. Preserved unaffected schedules in BLK-01, BLK-04, BLK-05. Shifted downstream freight G-8891 by 35 mins.");

      if (onComplete) onComplete(emergencyTask);
    },

    // --- What-If Simulator (Demo Step 8) ---
    simulateWhatIf: (scenarioType) => {
      let result = {};
      if (scenarioType === 'CANCEL_BLOCK') {
        result = {
          title: "What-If: Block Cancellation at Maripat-Dadri",
          baselineUtilization: "78%",
          simulatedUtilization: "61%",
          impactSummary: "Cancelling Block B-104 defers 3 tasks (TRK-842, SIG-119, OHE-992). Overdue risk score rises by +24%.",
          recommendedAlternative: "Auto-shift workload to Tuesday 02:00 window (Slot S-208) with zero passenger train delays.",
          kpiDelta: { utilization: "-17%", separateBlocks: "+2", delayRisk: "+12m" }
        };
      } else if (scenarioType === 'FREIGHT_SURGE') {
        result = {
          title: "What-If: 3 Additional Goods Trains (DFCCIL Reroute)",
          baselineUtilization: "78%",
          simulatedUtilization: "74%",
          impactSummary: "Available maintenance gaps reduce from 240 mins to 190 mins. All bundled tasks still fit within 180 min window.",
          recommendedAlternative: "Tighten buffer times between track tamping and TRD tower wagon clearing.",
          kpiDelta: { utilization: "-4%", separateBlocks: "0", delayRisk: "+4m" }
        };
      } else {
        result = {
          title: "What-If: 30 km/h Temporary Speed Restriction (TSR)",
          baselineUtilization: "78%",
          simulatedUtilization: "76%",
          impactSummary: "Pass-through time for Shatabdi increased by 6.2 mins. Scheduled maintenance block start shifted by +8 mins.",
          recommendedAlternative: "Adjust start from 01:00 to 01:08; maintain full 180 min maintenance duration.",
          kpiDelta: { utilization: "-2%", separateBlocks: "0", delayRisk: "+6.2m" }
        };
      }
      RailTwinEngine.logAudit("WHAT_IF_SIMULATION", `Executed What-If simulation: ${result.title}. Baseline preserved intact.`);
      return result;
    },

    // --- KPI Suite ---
    getKPIs: () => ({
      blockUtilization: { baseline: "48%", optimized: "78%", diff: "+30%" },
      separateBlocks: { baseline: "24", optimized: "14", diff: "-42%" },
      totalDowntimeHrs: { baseline: "46.5h", optimized: "30.2h", diff: "-35%" },
      criticalCompletionRate: { baseline: "75%", optimized: "100%", diff: "+25%" },
      multiDeptBundlesCount: BUNDLES.length,
      trainConflictCount: 0,
      scheduleStability: "86%"
    }),

    // --- Audit Logging ---
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
      // Dispatch custom event for views to refresh
      window.dispatchEvent(new CustomEvent('railtwin:audit_update', { detail: entry }));
    }
  };
})();

// Attach to window
window.RailTwinEngine = RailTwinEngine;
