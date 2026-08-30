"""
Upload synthetic data to Supabase (Fixed - correct delete order)
Indian Railways - SIH Hackathon Project

Yeh script data/ folder ki JSON files padhkar
Supabase ki tables mein daal deta hai.

Chalane se pehle: generate_data.py already chal chuka ho
aur data/ folder mein files ban chuki hon.

IMPORTANT: Isse pehle Supabase SQL Editor mein yeh chala lena:
  create table goods_train_forecast (...)
  alter table corridor_availability add column goods_traffic_level text;
"""

import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("SUPABASE_URL ya SUPABASE_KEY .env file mein nahi mili. Check karein.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Supabase se connection ban gaya.\n")

# -----------------------------
# Purana data clear karna
# IMPORTANT: block_plan_output sabse pehle delete karna hai,
# kyunki yeh defects aur sections ko reference karta hai (foreign key).
# Agar pehle defects/sections delete karenge to error aayega.
# -----------------------------
print("Purana data clear kiya jaa raha hai...")
supabase.table("block_plan_output").delete().neq("id", 0).execute()
supabase.table("defects").delete().neq("defect_id", "").execute()
supabase.table("corridor_availability").delete().neq("id", 0).execute()
supabase.table("goods_train_forecast").delete().neq("id", 0).execute()
supabase.table("sections").delete().neq("section_id", "").execute()
supabase.table("corridor").delete().neq("corridor_id", "").execute()
print("Purana data clear ho gaya.\n")

# -----------------------------
# STEP 1: Corridor upload karna
# -----------------------------
with open("data/corridor.json", "r") as f:
    corridor_data = json.load(f)

corridor_row = {
    "corridor_id": corridor_data["corridor_id"],
    "corridor_name": corridor_data["corridor_name"]
}
supabase.table("corridor").upsert(corridor_row).execute()
print(f"Corridor uploaded: {corridor_data['corridor_name']}")

sections_rows = corridor_data["sections"]
supabase.table("sections").upsert(sections_rows).execute()
print(f"Sections uploaded: {len(sections_rows)}")

# -----------------------------
# STEP 2: Goods train forecast upload karna
# -----------------------------
with open("data/goods_train_forecast.json", "r") as f:
    goods_forecast_data = json.load(f)

BATCH_SIZE = 200
for i in range(0, len(goods_forecast_data), BATCH_SIZE):
    batch = goods_forecast_data[i:i + BATCH_SIZE]
    supabase.table("goods_train_forecast").insert(batch).execute()

print(f"Goods train forecast uploaded: {len(goods_forecast_data)} records")

# -----------------------------
# STEP 3: Corridor availability upload karna
# -----------------------------
with open("data/corridor_availability.json", "r") as f:
    availability_data = json.load(f)

for i in range(0, len(availability_data), BATCH_SIZE):
    batch = availability_data[i:i + BATCH_SIZE]
    supabase.table("corridor_availability").insert(batch).execute()

print(f"Corridor availability uploaded: {len(availability_data)} records")

# -----------------------------
# STEP 4: Defects upload karna
# -----------------------------
with open("data/defects.json", "r") as f:
    defects_data = json.load(f)

for defect in defects_data:
    defect["priority_score"] = None

supabase.table("defects").upsert(defects_data).execute()
print(f"Defects uploaded: {len(defects_data)}")

print("\nSaara data Supabase mein safal taur par upload ho gaya!")
print("Ab prioritize.py aur optimize.py dobara chalayein.")