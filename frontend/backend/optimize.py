"""
Joint Block Optimizer (Updated - Weekly + Monthly horizons)
Indian Railways - SIH Hackathon Project

Yeh updated version do plans banata hai:
1. WEEKLY plan  - agle 7 dinon ki availability se (short-term, urgent tasks)
2. MONTHLY plan - agle 30 dinon ki availability se (long-term, preventive maintenance)

Dono ke liye alag-alag optimizer run hota hai, aur result
block_plan_output table mein 'plan_horizon' column se differentiate hota hai.
"""

import os
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client, Client
from ortools.sat.python import cp_model

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Supabase se connection ban gaya.\n")

# -----------------------------
# STEP 1: Data fetch karna
# -----------------------------
defects_resp = supabase.table("defects").select("*").execute()
defects = defects_resp.data

availability_resp = supabase.table("corridor_availability").select("*").execute()
availability = availability_resp.data

print(f"{len(defects)} defects aur {len(availability)} availability windows mile.\n")

# Purane block_plan_output rows clear karna (taaki dubara chalane pe duplicate na ho)
supabase.table("block_plan_output").delete().neq("id", 0).execute()

defects_by_section = defaultdict(list)
for d in defects:
    defects_by_section[d["section_id"]].append(d)

windows_by_section_all = defaultdict(list)
for w in availability:
    windows_by_section_all[w["section_id"]].append(w)


def run_optimizer_for_horizon(horizon_name, day_start, day_end, tasks_per_section=8, windows_limit=15):
    """
    Ek horizon (weekly ya monthly) ke liye optimizer chalata hai.
    day_start/day_end: kitne din ki availability window consider karni hai (0-indexed se)
    """
    base_date = datetime(2026, 9, 1)
    range_start = base_date + timedelta(days=day_start)
    range_end = base_date + timedelta(days=day_end)

    total_before_blocks = 0
    total_after_blocks = 0
    plan_rows = []

    for section_id, section_defects in defects_by_section.items():

        # Is horizon ki date range mein aane wali windows filter karo
        section_windows = [
            w for w in windows_by_section_all.get(section_id, [])
            if range_start <= datetime.strptime(w["date"], "%Y-%m-%d") < range_end
        ]
        section_windows = section_windows[:windows_limit]

        section_defects_sorted = sorted(
            section_defects, key=lambda d: d["priority_score"] or 0, reverse=True
        )[:tasks_per_section]

        if not section_defects_sorted or not section_windows:
            continue

        n_tasks = len(section_defects_sorted)
        n_windows = len(section_windows)

        model = cp_model.CpModel()
        x = {}
        for i in range(n_tasks):
            for j in range(n_windows):
                x[i, j] = model.NewBoolVar(f"x_{i}_{j}")

        window_used = {}
        for j in range(n_windows):
            window_used[j] = model.NewBoolVar(f"used_{j}")

        for i in range(n_tasks):
            model.Add(sum(x[i, j] for j in range(n_windows)) <= 1)

        for j in range(n_windows):
            capacity = section_windows[j]["duration_hours"]
            model.Add(
                sum(x[i, j] * section_defects_sorted[i]["estimated_duration_hours"] for i in range(n_tasks))
                <= capacity
            )
            for i in range(n_tasks):
                model.Add(window_used[j] >= x[i, j])

        priority_terms = sum(
            int((section_defects_sorted[i]["priority_score"] or 0) * 10) * x[i, j]
            for i in range(n_tasks) for j in range(n_windows)
        )
        window_penalty = sum(window_used[j] for j in range(n_windows))
        model.Maximize(priority_terms - window_penalty)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 5.0
        status = solver.Solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            continue

        windows_actually_used = set()
        tasks_scheduled = 0

        for j in range(n_windows):
            assigned = [section_defects_sorted[i] for i in range(n_tasks) if solver.Value(x[i, j]) == 1]
            if assigned:
                windows_actually_used.add(j)
                tasks_scheduled += len(assigned)
                depts = sorted(set(d["department"] for d in assigned))
                defect_ids = [d["defect_id"] for d in assigned]

                plan_rows.append({
                    "section_id": section_id,
                    "planned_date": section_windows[j]["date"],
                    "start_time": section_windows[j]["start_time"],
                    "duration_hours": section_windows[j]["duration_hours"],
                    "departments_included": ", ".join(depts),
                    "defect_ids": ", ".join(defect_ids),
                    "plan_horizon": horizon_name
                })

        total_before_blocks += tasks_scheduled
        total_after_blocks += len(windows_actually_used)

    return plan_rows, total_before_blocks, total_after_blocks


# -----------------------------
# STEP 2: WEEKLY plan (agle 7 din)
# -----------------------------
print("=" * 60)
print("WEEKLY PLAN generate ho raha hai (Day 0-7)...")
print("=" * 60)
weekly_rows, weekly_before, weekly_after = run_optimizer_for_horizon(
    "weekly", day_start=0, day_end=7, tasks_per_section=5, windows_limit=6
)
print(f"Weekly: {weekly_before} tasks siloed mein -> {weekly_after} combined blocks")

# -----------------------------
# STEP 3: MONTHLY plan (agle 30 din)
# -----------------------------
print("\n" + "=" * 60)
print("MONTHLY PLAN generate ho raha hai (Day 0-30)...")
print("=" * 60)
monthly_rows, monthly_before, monthly_after = run_optimizer_for_horizon(
    "monthly", day_start=0, day_end=30, tasks_per_section=8, windows_limit=15
)
print(f"Monthly: {monthly_before} tasks siloed mein -> {monthly_after} combined blocks")

# -----------------------------
# STEP 4: Supabase mein save karna
# -----------------------------
all_rows = weekly_rows + monthly_rows
if all_rows:
    supabase.table("block_plan_output").insert(all_rows).execute()

# -----------------------------
# STEP 5: Summary
# -----------------------------
print("\n" + "=" * 60)
print("FINAL SUMMARY")
print("=" * 60)

if weekly_before > 0:
    weekly_pct = round((1 - weekly_after / weekly_before) * 100, 1)
    print(f"Weekly  -> Before: {weekly_before} blocks | After: {weekly_after} blocks | Reduction: {weekly_pct}%")

if monthly_before > 0:
    monthly_pct = round((1 - monthly_after / monthly_before) * 100, 1)
    print(f"Monthly -> Before: {monthly_before} blocks | After: {monthly_after} blocks | Reduction: {monthly_pct}%")

print(f"\nTotal {len(all_rows)} block plan entries Supabase mein save ho gaye (weekly + monthly).")