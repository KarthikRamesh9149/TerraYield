#!/usr/bin/env python3
"""
Export all districts from jsonfiles/out GeoJSON files to a CSV.
Run from jsonfiles/ directory: python export_districts_csv.py
"""
import csv
import json
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "districts.csv")

def extract_districts():
    rows = []
    seen = set()

    for filename in sorted(os.listdir(OUT_DIR)):
        if not filename.endswith(".geojson"):
            continue
        filepath = os.path.join(OUT_DIR, filename)
        try:
            with open(filepath, encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"Skip {filename}: {e}")
            continue

        if data.get("type") != "FeatureCollection" or "features" not in data:
            continue

        state_slug = filename.replace(".geojson", "")

        for feat in data.get("features", []):
            if feat.get("type") != "Feature":
                continue
            props = feat.get("properties") or {}
            state_name = props.get("State_Name") or props.get("state") or ""
            state_code = props.get("State_Code") or ""
            dist_name = props.get("Dist_Name") or props.get("district") or props.get("DIST_NAME") or ""
            dist_code = props.get("Dist_Code") or props.get("dist_code") or ""

            # Dedupe by state+district
            key = (state_name, dist_name)
            if key in seen:
                continue
            seen.add(key)

            rows.append({
                "state_slug": state_slug,
                "state_name": state_name,
                "state_code": state_code,
                "district_name": dist_name,
                "district_code": dist_code,
            })

    return rows

def main():
    rows = extract_districts()
    fieldnames = ["state_slug", "state_name", "state_code", "district_name", "district_code"]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} districts to {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
