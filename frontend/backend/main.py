"""
FastAPI Backend Server (Updated - weekly/monthly split + goods forecast)
Indian Railways - SIH Hackathon Project

Yeh server frontend dashboard ko data deta hai:
1. GET /defects            -> prioritized task list
2. GET /block-plan          -> optimized block schedule (?horizon=weekly/monthly filter ke saath)
3. GET /summary             -> KPIs, weekly aur monthly dono ka alag-alag before/after comparison
4. GET /corridor            -> corridor + sections info
5. GET /goods-forecast       -> goods train forecast (Control Office data)

Chalane ka tareeka:
uvicorn main:app --reload
"""

import os
from collections import defaultdict
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="AI Block Planning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Block Planning API chal raha hai."}


@app.get("/defects")
def get_defects():
    """
    Saare defects, priority_score ke hisaab se sorted (sabse urgent pehle).
    Dashboard ke 'task inbox' section ke liye.
    """
    response = supabase.table("defects").select("*").order("priority_score", desc=True).execute()
    return {"count": len(response.data), "defects": response.data}


@app.get("/block-plan")
def get_block_plan(horizon: Optional[str] = None):
    """
    Optimizer se bana hua combined block schedule.
    ?horizon=weekly ya ?horizon=monthly se filter kar sakte hain.
    Dashboard ke Gantt calendar view ke liye.
    """
    query = supabase.table("block_plan_output").select("*").order("planned_date")
    if horizon:
        query = query.eq("plan_horizon", horizon)
    response = query.execute()
    return {"count": len(response.data), "block_plan": response.data}


@app.get("/goods-forecast")
def get_goods_forecast():
    """
    Goods train forecast - Control Office se aane wala data.
    Dashboard mein traffic-aware planning dikhane ke liye.
    """
    response = supabase.table("goods_train_forecast").select("*").order("date").execute()
    return {"count": len(response.data), "goods_forecast": response.data}


@app.get("/corridor")
def get_corridor():
    """
    Corridor aur sections ki basic info.
    """
    corridor = supabase.table("corridor").select("*").execute()
    sections = supabase.table("sections").select("*").execute()
    return {"corridor": corridor.data, "sections": sections.data}


def _horizon_stats(plan_rows, horizon_name):
    """
    Ek horizon (weekly/monthly) ke liye before/after stats nikalta hai.
    """
    rows = [r for r in plan_rows if r.get("plan_horizon") == horizon_name]
    blocks_after = len(rows)
    tasks_scheduled = sum(
        len(r["defect_ids"].split(", ")) for r in rows if r.get("defect_ids")
    )
    blocks_before = tasks_scheduled

    reduction_pct = 0
    if blocks_before > 0:
        reduction_pct = round((1 - blocks_after / blocks_before) * 100, 1)

    joint_blocks = len([
        r for r in rows
        if r.get("departments_included") and len(r["departments_included"].split(", ")) > 1
    ])

    return {
        "blocks_before_siloed": blocks_before,
        "blocks_after_joint": blocks_after,
        "reduction_pct": reduction_pct,
        "joint_multi_department_blocks": joint_blocks,
    }


@app.get("/summary")
def get_summary():
    """
    Dashboard ke KPI cards ke liye - weekly aur monthly dono ka
    alag-alag before/after comparison, department-wise breakdown.
    """
    defects_resp = supabase.table("defects").select("*").execute()
    defects = defects_resp.data

    plan_resp = supabase.table("block_plan_output").select("*").execute()
    plan_rows = plan_resp.data

    dept_counts = defaultdict(int)
    for d in defects:
        dept_counts[d["department"]] += 1

    safety_critical_count = len([d for d in defects if d["safety_signal"]])

    return {
        "total_defects": len(defects),
        "department_breakdown": dict(dept_counts),
        "safety_critical_count": safety_critical_count,
        "weekly": _horizon_stats(plan_rows, "weekly"),
        "monthly": _horizon_stats(plan_rows, "monthly"),
    }