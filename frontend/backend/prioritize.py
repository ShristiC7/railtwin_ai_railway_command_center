"""
RailTwin AI - Prioritization Engine
Indian Railways - SIH Hackathon Project (Problem Statement 26027)

Implements PRD Section 8.2 Priority Scoring Formula:
Priority = 0.30 * Criticality + 0.25 * Severity + 0.20 * Urgency + 0.15 * Operational_Impact + 0.10 * Failure_Risk

Provides:
- calculate_priority_score(task): returns priority score (0-100) and explainability factors.
- Standalone execution with Supabase or local JSON sync.
"""

import os
import json
from typing import Dict, Any, Tuple

def calculate_priority_score(defect_or_task: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
    """
    Calculates an explainable priority score for a maintenance task based on PRD Section 8.2.
    Accepts both snake_case (database/API) and camelCase (frontend/legacy).
    """
    # 1. Asset Criticality (0.0 to 1.0 or 1 to 10)
    raw_crit = defect_or_task.get("criticality")
    if raw_crit is None:
        raw_crit = 0.7
    elif raw_crit > 1.0:
        raw_crit = min(raw_crit / 10.0, 1.0)

    # 2. Defect Severity (0.0 to 1.0 or 1 to 10)
    raw_sev = defect_or_task.get("severity")
    if raw_sev is None:
        raw_sev = 0.6
    elif raw_sev > 1.0:
        raw_sev = min(raw_sev / 10.0, 1.0)

    # 3. Urgency / Overdue Exposure
    days_overdue = defect_or_task.get("days_overdue", 0) or 0
    raw_urg = defect_or_task.get("urgency")
    if raw_urg is None:
        raw_urg = min(days_overdue / 45.0, 1.0)
    elif raw_urg > 1.0:
        raw_urg = min(raw_urg / 10.0, 1.0)

    # 4. Operational Impact
    raw_op = defect_or_task.get("opImpact") or defect_or_task.get("operational_impact")
    if raw_op is None:
        traffic = str(defect_or_task.get("traffic_impact", "moderate")).lower()
        raw_op = 0.9 if traffic == "high" else (0.6 if traffic == "moderate" else 0.3)
    elif raw_op > 1.0:
        raw_op = min(raw_op / 10.0, 1.0)

    # 5. Failure Risk / Historical Frequency
    raw_risk = defect_or_task.get("failureRisk") or defect_or_task.get("failure_risk")
    if raw_risk is None:
        raw_risk = 0.85 if defect_or_task.get("safety_signal", False) else 0.5
    elif raw_risk > 1.0:
        raw_risk = min(raw_risk / 10.0, 1.0)

    # Calculate weighted priority (0 to 1.0)
    score_normalized = (
        0.30 * raw_crit +
        0.25 * raw_sev +
        0.20 * raw_urg +
        0.15 * raw_op +
        0.10 * raw_risk
    )

    # Scale to 0-100
    score_100 = round(score_normalized * 100, 1)

    factors = {
        "criticality_weight": 0.30,
        "criticality_value": round(raw_crit, 2),
        "severity_weight": 0.25,
        "severity_value": round(raw_sev, 2),
        "urgency_weight": 0.20,
        "urgency_value": round(raw_urg, 2),
        "operational_impact_weight": 0.15,
        "operational_impact_value": round(raw_op, 2),
        "failure_risk_weight": 0.10,
        "failure_risk_value": round(raw_risk, 2),
        "final_score": score_100,
        "is_safety_critical": bool(score_100 >= 80 or defect_or_task.get("safety_signal"))
    }

    return score_100, factors


def run_prioritization_on_dataset(tasks_or_defects: list) -> list:
    """Calculates and attaches priority score and factors to each item in a list."""
    scored = []
    for item in tasks_or_defects:
        score, factors = calculate_priority_score(item)
        updated = dict(item)
        updated["priority_score"] = score
        updated["priorityScore"] = score
        updated["priority_factors"] = factors
        scored.append(updated)
    return sorted(scored, key=lambda x: x.get("priority_score", 0), reverse=True)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")

    if supabase_url and supabase_key:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        print("Connected to Supabase. Fetching defects...")
        response = supabase.table("defects").select("*").execute()
        defects = response.data
        scored = run_prioritization_on_dataset(defects)
        for d in scored:
            supabase.table("defects").update({"priority_score": d["priority_score"]}).eq("defect_id", d["defect_id"]).execute()
        print(f"Updated {len(scored)} records in Supabase.")
    else:
        # Local JSON mode
        data_path = os.path.join(os.path.dirname(__file__), "data", "defects.json")
        if os.path.exists(data_path):
            with open(data_path, "r") as f:
                defects = json.load(f)
            scored = run_prioritization_on_dataset(defects)
            with open(data_path, "w") as f:
                json.dump(scored, f, indent=2)
            print(f"Calculated priority scores for {len(scored)} local defects.")
            print("\nTop 5 Urgent Tasks:")
            for i, d in enumerate(scored[:5], 1):
                print(f" {i}. [{d.get('defect_id', d.get('id'))}] Dept: {d.get('department', d.get('dept'))} | Type: {d.get('defect_type', d.get('title'))[:30]} | Priority Score: {d.get('priority_score')}%")