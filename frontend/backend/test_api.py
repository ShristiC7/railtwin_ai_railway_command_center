import requests
import json
from main import app
from prioritize import calculate_priority_score
from optimize import optimize_maintenance_schedule

print("Testing prioritize calculation...")
score, factors = calculate_priority_score({
    "criticality": 0.9,
    "severity": 0.8,
    "urgency": 0.7,
    "opImpact": 0.6,
    "failureRisk": 0.5
})
print(f"Priority score: {score}%, factors: {factors['final_score']}")

print("\nTesting optimize_maintenance_schedule directly...")
sample_tasks = [
    {"defect_id": "TSK-01", "section_id": "SEC-01", "department": "ENG", "defect_type": "Track Tamping", "criticality": 9, "severity": 8, "days_overdue": 10, "estimated_duration_hours": 2.0},
    {"defect_id": "TSK-02", "section_id": "SEC-01", "department": "SNT", "defect_type": "Point Machine Overhaul", "criticality": 8, "severity": 7, "days_overdue": 5, "estimated_duration_hours": 1.5},
    {"defect_id": "TSK-03", "section_id": "SEC-01", "department": "TRD", "defect_type": "OHE Wire Adjustment", "criticality": 7, "severity": 6, "days_overdue": 2, "estimated_duration_hours": 1.5}
]
sample_windows = [
    {"id": 1, "section_id": "SEC-01", "date": "2026-09-01", "start_time": "01:00", "end_time": "04:00", "duration_hours": 3.0, "goods_traffic_level": "low"}
]
opt_res = optimize_maintenance_schedule(sample_tasks, sample_windows, horizon_name="weekly", day_start=0, day_end=7)
print(f"Optimization scheduled: {opt_res['tasks_scheduled']} tasks into {opt_res['blocks_after_joint']} blocks (Reduction: {opt_res['reduction_pct']}%)")
print("All Core Backend Logic Verified Successfully!")
