import json
import csv
from shapely.geometry import shape

INPUT_FILE = "Habitat_Sites_Tacoma.geojson"
OUTPUT_FILE = "Tacoma_Habitat.csv"

def extract_centroid(geom):
    """Return (lat, lon) centroid from Polygon or MultiPolygon."""
    try:
        g = shape(geom)
        c = g.centroid
        return c.y, c.x
    except Exception as e:
        print("Geometry error:", e)
        return None, None

def build_habitat_type(props):
    """Derive habitat type from mitigation/designation/comments."""
    tags = []

    if props.get("mitigation") == "Yes":
        tags.append("MitigationSite")

    if props.get("designation"):
        tags.append(f"Designation{props['designation']}")

    comments = props.get("comments", "").lower()
    if "wetland" in comments:
        tags.append("Wetland")
    if "riparian" in comments:
        tags.append("Riparian")
    if "shoreline" in comments:
        tags.append("Shoreline")
    if "superfund" in comments:
        tags.append("SuperfundAdjacent")

    return ";".join(tags) if tags else "Habitat"

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []

    for feature in data["features"]:
        props = feature["properties"]
        geom = feature["geometry"]

        lat, lon = extract_centroid(geom)

        rows.append({
            "name": props.get("name"),
            "address": props.get("address"),
            "managed_by": "Port of Tacoma",
            "public": True,
            "habitat_type": build_habitat_type(props),
            "description": props.get("comments") or "",
            "city": "Tacoma",
            "state": "WA",
            "zip": "",
            "latitude": lat,
            "longitude": lon,
        })

    # Write CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done — wrote {len(rows)} habitat sites to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
