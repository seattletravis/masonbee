import json
import csv
from shapely.geometry import shape

# Load GeoJSON
with open("Park_Sites.geojson") as f:
    data = json.load(f)

rows = []

for feature in data["features"]:
    geom = shape(feature["geometry"])
    centroid = geom.centroid
    props = feature["properties"]

    rows.append({
        "SITE_NAME": props.get("SITE_NAME"),
        "PrimaryAddress": props.get("PrimaryAddress"),
        "Acres": props.get("Acres"),
        "ParkSiteID": props.get("ParkSiteID"),
        "latitude": centroid.y,
        "longitude": centroid.x,
    })

# Write CSV
with open("Bellevue_Data_With_Coords.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

print("Done — Bellevue_Data_With_Coords.csv created.")
