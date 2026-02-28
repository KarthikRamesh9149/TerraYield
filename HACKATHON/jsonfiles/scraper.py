#!/usr/bin/env python3
import argparse
import json
import os
import re
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

TEMPLATE_URL = "https://raw.githubusercontent.com/shuklaneerajdev/IndiaStateTopojsonFiles/refs/heads/master/Kerala.geojson"

CANDIDATE_STATE_UT_NAMES = [
    # States
    "AndhraPradesh","ArunachalPradesh","Assam","Bihar","Chhattisgarh","Goa","Gujrat",
    "Haryana","HimachalPradesh","Jharkhand","Karnataka","Kerala","MadhyaPradesh",
    "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
    "Rajasthan","Sikkim","TamilNadu","Telangana","Tripura","UttarPradesh",
    "Uttarakhand","WestBengal",
    # Union Territories
    "Andaman","Chandigarh","Dadra","Daman","Delhi","Ladakh","Lakshadweep","Puducherry"
]

EXTRA_FILENAME_GUESSES = [
    "Orissa",
    "Pondicherry",
    "Dadra and Nagar Haveli",
    "Daman and Diu"
]

def safe_slug(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^a-z0-9_]+", "", s)
    return s or "unknown"

def http_get_json(url: str, timeout: int = 60) -> dict:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (geojson-export-script)"})
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def pick_first(props: dict, keys: list[str]):
    for k in keys:
        v = props.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None

def extract_district_name(props: dict) -> str:
    return pick_first(props, ["district","DISTRICT","DIST_NAME","NAME_2","name","Name"]) or "unknown_district"

def flatten_geometry_coords(geometry: dict):
    if not isinstance(geometry, dict):
        raise ValueError("Missing/invalid geometry object")
    gtype = geometry.get("type")
    coords = geometry.get("coordinates")
    if gtype not in ("Polygon", "MultiPolygon"):
        raise ValueError(f"Unsupported geometry type: {gtype}")
    if coords is None:
        raise ValueError("Geometry has no coordinates")
    return gtype, coords

def build_url(state_name: str) -> str:
    # Replace ".../Kerala.geojson" with ".../<StateName>.geojson"
    return TEMPLATE_URL.replace("Kerala.geojson", f"{state_name}.geojson")

def process_one_state(url: str, state_name: str, outdir: str, state_prop: str,
                      write_per_district: bool, keep_geojson: bool) -> bool:
    try:
        geo = http_get_json(url)
    except HTTPError as e:
        if e.code == 404:
            return False
        raise
    except (URLError, TimeoutError):
        return False
    except json.JSONDecodeError:
        return False

    if geo.get("type") != "FeatureCollection" or "features" not in geo:
        return False

    os.makedirs(outdir, exist_ok=True)
    state_slug = safe_slug(state_name)

    # Optional: store district files in a dedicated folder
    per_district_dir = os.path.join(outdir, "_districts")
    if write_per_district:
        os.makedirs(per_district_dir, exist_ok=True)

    state_payload = {"state": state_name, "source_url": url, "districts": []}
    cleaned_features = []

    for feat in geo.get("features") or []:
        if not isinstance(feat, dict) or feat.get("type") != "Feature":
            continue

        props = feat.get("properties") or {}
        geom = feat.get("geometry")

        try:
            gtype, coords = flatten_geometry_coords(geom)
        except ValueError:
            continue

        district_name = extract_district_name(props)
        district_slug = safe_slug(district_name)

        new_props = dict(props)
        new_props[state_prop] = state_name

        state_payload["districts"].append({
            "district": district_name,
            "geometry_type": gtype,
            "coordinates": coords
        })

        if write_per_district:
            district_path = os.path.join(per_district_dir, f"{state_slug}__{district_slug}.json")
            with open(district_path, "w", encoding="utf-8") as f:
                json.dump({
                    "state": state_name,
                    "district": district_name,
                    "source_url": url,
                    "geometry_type": gtype,
                    "coordinates": coords,
                }, f, ensure_ascii=False, indent=2)

        if keep_geojson:
            cleaned_features.append({
                "type": "Feature",
                "properties": new_props,
                "geometry": {"type": gtype, "coordinates": coords},
            })

    state_path = os.path.join(outdir, f"{state_slug}.json")
    with open(state_path, "w", encoding="utf-8") as f:
        json.dump(state_payload, f, ensure_ascii=False, indent=2)

    if keep_geojson:
        cleaned_geo = {"type": "FeatureCollection", "features": cleaned_features}
        cleaned_path = os.path.join(outdir, f"{state_slug}.geojson")
        with open(cleaned_path, "w", encoding="utf-8") as f:
            json.dump(cleaned_geo, f, ensure_ascii=False, indent=2)

    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--outdir", default="./out")
    ap.add_argument("--state-prop", default="state")
    ap.add_argument("--write-per-district", action="store_true")
    ap.add_argument("--keep-geojson", action="store_true")
    ap.add_argument("--only", nargs="*", default=None,
                    help="Optional: restrict to specific state/UT names (exact match).")
    args = ap.parse_args()

    # Safety check: ensure the template has Kerala.geojson so replacement works
    if "Kerala.geojson" not in TEMPLATE_URL:
        raise SystemExit('Internal error: TEMPLATE_URL must contain "Kerala.geojson".')

    candidates = list(CANDIDATE_STATE_UT_NAMES) + EXTRA_FILENAME_GUESSES
    if args.only:
        candidates = args.only

    ok = []
    missing = []

    for name in candidates:
        url = build_url(name)
        try:
            worked = process_one_state(
                url=url,
                state_name=name,
                outdir=args.outdir,
                state_prop=args.state_prop,
                write_per_district=args.write_per_district,
                keep_geojson=args.keep_geojson
            )
        except Exception as e:
            missing.append((name, f"error: {e}"))
            print(f"ERR  {name}: {e}")
            continue

        if worked:
            ok.append(name)
            print(f"OK   {name} <- {url}")
        else:
            missing.append((name, "not found/invalid"))
            print(f"MISS {name} <- {url}")

    manifest_path = os.path.join(args.outdir, "_manifest.json")
    os.makedirs(args.outdir, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump({"downloaded": ok, "missing": missing}, f, ensure_ascii=False, indent=2)

    print(f"\nWrote manifest: {manifest_path}")
    print(f"Downloaded {len(ok)} file(s); missed {len(missing)} candidate(s).")

if __name__ == "__main__":
    main()
