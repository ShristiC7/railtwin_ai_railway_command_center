"""
Synthetic Data Generator (Updated - with Goods Train Forecast)
Indian Railways - SIH Hackathon Project

Yeh script banata hai:
1. Ek sample corridor (stations + sections)
2. Corridor ki timetable-based non-traffic hours (availability)
3. Goods train forecast (Control Office se) - har section, har din
   kitni goods trains expected hain
4. ~80 synthetic maintenance defects (TMS/SMMS/TDMS se)

Availability windows ab goods_traffic_level bhi rakhte hain -
taaki dikhe ki block planning mein goods traffic bhi consider hua.

Output: data/ folder mein JSON files save hongi
"""

import json
import random
import os
from datetime import datetime, timedelta

random.seed(42)

# -----------------------------
# STEP 1: Corridor Definition
# -----------------------------
CORRIDOR_ID = "CR-01"
CORRIDOR_NAME = "Sample Corridor - Section A to F"

stations = [
    {"code": "STA", "name": "Station A", "km": 0.0},
    {"code": "STB", "name": "Station B", "km": 12.5},
    {"code": "STC", "name": "Station C", "km": 24.0},
    {"code": "STD", "name": "Station D", "km": 38.2},
    {"code": "STE", "name": "Station E", "km": 51.0},
    {"code": "STF", "name": "Station F", "km": 64.5},
]

sections = []
for i in range(len(stations) - 1):
    sections.append({
        "section_id": f"SEC-{i+1:02d}",
        "corridor_id": CORRIDOR_ID,
        "from_station": stations[i]["code"],
        "to_station": stations[i+1]["code"],
        "start_km": stations[i]["km"],
        "end_km": stations[i+1]["km"],
        "traffic_density": random.choice(["high", "high", "moderate", "low"])
    })

# -----------------------------
# STEP 2: Goods Train Forecast (Control Office se)
# -----------------------------
# Har section ke liye, agle 30 dinon mein kitni goods trains expected hain

def generate_goods_forecast(section_id, days=30):
    forecast = []
    base_date = datetime(2026, 9, 1)
    for d in range(days):
        date = base_date + timedelta(days=d)
        expected_trains = random.randint(2, 14)  # din mein kitni goods trains guzrengi

        if expected_trains <= 5:
            level = "low"
        elif expected_trains <= 9:
            level = "moderate"
        else:
            level = "high"

        forecast.append({
            "section_id": section_id,
            "date": date.strftime("%Y-%m-%d"),
            "expected_goods_trains": expected_trains,
            "traffic_level": level
        })
    return forecast

goods_train_forecast = []
for sec in sections:
    goods_train_forecast.extend(generate_goods_forecast(sec["section_id"]))

# Quick lookup banate hain - (section_id, date) -> goods traffic_level
goods_lookup = {
    (row["section_id"], row["date"]): row["traffic_level"] for row in goods_train_forecast
}

# -----------------------------
# STEP 3: Corridor Availability (non-traffic hours)
# -----------------------------
# Ab yahan goods_traffic_level bhi jodenge - taaki pata chale
# ki is block window mein goods traffic kitni thi jab yeh slot bana

def generate_availability(section_id, days=30):
    availability = []
    base_date = datetime(2026, 9, 1)
    for d in range(days):
        date = base_date + timedelta(days=d)
        date_str = date.strftime("%Y-%m-%d")
        num_windows = random.choice([1, 1, 2])
        for w in range(num_windows):
            start_hour = random.choice([1, 2, 3, 13, 14])
            duration_hours = random.choice([2, 3, 4])

            goods_level = goods_lookup.get((section_id, date_str), "moderate")

            availability.append({
                "section_id": section_id,
                "date": date_str,
                "start_time": f"{start_hour:02d}:00",
                "duration_hours": duration_hours,
                "goods_traffic_level": goods_level
            })
    return availability

corridor_availability = []
for sec in sections:
    corridor_availability.extend(generate_availability(sec["section_id"]))

# -----------------------------
# STEP 4: Synthetic Defects/Tasks (TMS, SMMS, TDMS)
# -----------------------------

defect_types = {
    "TMS": [
        ("Rail fracture", "high"),
        ("Rail weld defect", "moderate"),
        ("Track geometry deviation", "moderate"),
        ("Ballast cleaning overdue", "low"),
        ("Rail wear beyond limit", "high"),
    ],
    "SMMS": [
        ("Point machine relay failure", "high"),
        ("Signal cable fault", "moderate"),
        ("Interlocking fault", "high"),
        ("Signal lamp failure", "low"),
        ("Track circuit fault", "moderate"),
    ],
    "TDMS": [
        ("OHE insulator crack", "high"),
        ("Feeder voltage anomaly", "moderate"),
        ("Insulator cleaning overdue", "low"),
        ("OHE wire wear", "moderate"),
        ("Substation equipment fault", "high"),
    ],
}

departments = list(defect_types.keys())

def severity_score(level):
    return {"high": random.randint(7, 10), "moderate": random.randint(4, 6), "low": random.randint(1, 3)}[level]

defects = []
defect_id_counter = 1
NUM_DEFECTS = 80

for _ in range(NUM_DEFECTS):
    dept = random.choice(departments)
    defect_name, level = random.choice(defect_types[dept])
    section = random.choice(sections)
    km_location = round(random.uniform(section["start_km"], section["end_km"]), 1)
    days_overdue = random.randint(0, 45)
    severity = severity_score(level)
    safety_signal = severity >= 7 and random.random() > 0.3

    defects.append({
        "defect_id": f"DEF-{defect_id_counter:04d}",
        "department": dept,
        "defect_type": defect_name,
        "corridor_id": CORRIDOR_ID,
        "section_id": section["section_id"],
        "km_location": km_location,
        "severity": severity,
        "days_overdue": days_overdue,
        "traffic_impact": section["traffic_density"],
        "safety_signal": safety_signal,
        "detected_date": (datetime(2026, 9, 1) - timedelta(days=days_overdue)).strftime("%Y-%m-%d"),
        "estimated_duration_hours": random.choice([1, 2, 2, 3, 4])
    })
    defect_id_counter += 1

# -----------------------------
# STEP 5: Sab kuch save karna
# -----------------------------
os.makedirs("data", exist_ok=True)

with open("data/corridor.json", "w") as f:
    json.dump({
        "corridor_id": CORRIDOR_ID,
        "corridor_name": CORRIDOR_NAME,
        "stations": stations,
        "sections": sections
    }, f, indent=2)

with open("data/corridor_availability.json", "w") as f:
    json.dump(corridor_availability, f, indent=2)

with open("data/goods_train_forecast.json", "w") as f:
    json.dump(goods_train_forecast, f, indent=2)

with open("data/defects.json", "w") as f:
    json.dump(defects, f, indent=2)

# -----------------------------
# Summary
# -----------------------------
print("Data generation complete!\n")
print(f"Corridor: {CORRIDOR_NAME} ({len(sections)} sections)")
print(f"Availability windows generated: {len(corridor_availability)}")
print(f"Goods train forecast entries: {len(goods_train_forecast)}")
print(f"Defects generated: {len(defects)}")
print(f"\nDepartment-wise breakdown:")
for dept in departments:
    count = len([d for d in defects if d["department"] == dept])
    print(f"  {dept}: {count} defects")
print(f"\nFiles saved in ./data/ folder:")
print("  - corridor.json")
print("  - corridor_availability.json")
print("  - goods_train_forecast.json")
print("  - defects.json")