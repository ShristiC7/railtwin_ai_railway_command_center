"""
Prioritization Engine
Indian Railways - SIH Hackathon Project

Yeh script Supabase se defects padhta hai, har ek ko
ek priority score deta hai (severity + urgency + safety + traffic
ke combination se), aur wapas database mein update kar deta hai.

Formula:
priority_score = (severity * 3) + (days_overdue_score * 2) 
                  + (safety_bonus) + (traffic_bonus)

- severity: already 1-10 scale hai
- days_overdue_score: days_overdue ko 0-10 scale mein normalize karte hain
- safety_bonus: agar safety_signal True hai to +15 extra
- traffic_bonus: high traffic corridor pe extra weight (+10 high, +5 moderate, +0 low)
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Supabase se connection ban gaya.\n")

# -----------------------------
# STEP 1: Saare defects fetch karna
# -----------------------------
response = supabase.table("defects").select("*").execute()
defects = response.data

print(f"{len(defects)} defects mile database mein.\n")


def calculate_priority_score(defect):
    """
    Har defect ke liye priority score calculate karta hai.
    Higher score = zyada urgent, pehle schedule hona chahiye.
    """
    severity = defect["severity"] or 0

    # days_overdue ko 0-10 scale mein normalize karna
    # (45 din ya usse zyada overdue = poora 10 score)
    days_overdue = defect["days_overdue"] or 0
    days_overdue_score = min(days_overdue / 45 * 10, 10)

    # Safety-critical defects ko bada bonus
    safety_bonus = 15 if defect["safety_signal"] else 0

    # Traffic impact ke hisaab se bonus
    traffic_map = {"high": 10, "moderate": 5, "low": 0}
    traffic_bonus = traffic_map.get(defect["traffic_impact"], 0)

    score = (severity * 3) + (days_overdue_score * 2) + safety_bonus + traffic_bonus

    return round(score, 2)


# -----------------------------
# STEP 2: Har defect ko score dena aur update karna
# -----------------------------
scored_defects = []

for defect in defects:
    score = calculate_priority_score(defect)
    scored_defects.append({**defect, "priority_score": score})

    # Supabase mein update karna
    supabase.table("defects").update({"priority_score": score}).eq(
        "defect_id", defect["defect_id"]
    ).execute()

print("Saare defects ko priority score mil gaya aur database update ho gaya.\n")

# -----------------------------
# STEP 3: Top 10 sabse urgent tasks dikhana
# -----------------------------
sorted_defects = sorted(scored_defects, key=lambda d: d["priority_score"], reverse=True)

print("=" * 90)
print("TOP 10 SABSE URGENT TASKS (Priority ke hisaab se ranked)")
print("=" * 90)
print(f"{'#':<3}{'Defect ID':<12}{'Dept':<8}{'Type':<28}{'Severity':<10}{'Overdue':<10}{'Safety':<8}{'Score'}")
print("-" * 90)

for i, d in enumerate(sorted_defects[:10], 1):
    print(
        f"{i:<3}{d['defect_id']:<12}{d['department']:<8}{d['defect_type'][:26]:<28}"
        f"{d['severity']:<10}{d['days_overdue']:<10}"
        f"{'Yes' if d['safety_signal'] else 'No':<8}{d['priority_score']}"
    )

print("\nPrioritization complete! Supabase  'defects' table main  priority_score column check .")