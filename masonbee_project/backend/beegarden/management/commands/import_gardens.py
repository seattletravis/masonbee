import csv
import json
from decimal import Decimal
from django.core.management.base import BaseCommand
from beegarden.models import Garden
from beegarden.utils import convert_to_wgs84   # keep your existing converter

# call these commands to use. 
# python manage.py import_gardens --file P_Patch_Data.csv --city Seattle --source SEA
# python manage.py import_gardens --file tacoma_gardens.csv --city Tacoma --source TAC
# python manage.py import_gardens --file bellevue_gardens.csv --city Bellevue --source BEL


def to_decimal(value):
    try:
        return Decimal(value)
    except:
        return None


def to_int(value):
    try:
        return int(value)
    except:
        return None


def clean_name(name):
    if not name:
        return "Unnamed Community Garden"
    return name.strip().title()


def clean_address(addr):
    if not addr:
        return None
    return addr.strip()


def extract_coords(row):
    """
    Handles:
    - Seattle-style raw x/y (EPSG:2285)
    - Tacoma/Bellevue GeoJSON geometry
    - Direct lat/lon fields
    """

    # Seattle-style raw x/y
    raw_x = row.get("x") or row.get("X")
    raw_y = row.get("y") or row.get("Y")

    if raw_x and raw_y:
        try:
            x = float(raw_x)
            y = float(raw_y)
            return convert_to_wgs84(x, y)
        except:
            pass

    # Direct lat/lon fields
    lat = row.get("latitude") or row.get("LAT") or row.get("lat")
    lon = row.get("longitude") or row.get("LON") or row.get("lon")

    if lat and lon:
        try:
            return float(lat), float(lon)
        except:
            pass

    # GeoJSON geometry
    geom = row.get("geometry")
    if geom:
        try:
            g = json.loads(geom)
            if g["type"] == "Point":
                lon, lat = g["coordinates"]
                return float(lat), float(lon)
        except:
            pass

    return None, None


class Command(BaseCommand):
    help = "Import community garden data for Seattle, Tacoma, and Bellevue."

    def add_arguments(self, parser):
        parser.add_argument("--file", type=str, required=True)
        parser.add_argument("--city", type=str, required=True)
        parser.add_argument("--state", type=str, default="WA")
        parser.add_argument("--source", type=str, required=True,
                            help="Prefix like SEA, TAC, BEL")

    def handle(self, *args, **options):
        file_path = options["file"]
        city = options["city"]
        state = options["state"]
        prefix = options["source"]

        self.stdout.write(self.style.WARNING(
            f"Importing gardens for {city} from {file_path}..."
        ))

        count = 0

        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                name = clean_name(row.get("NAME") or row.get("name"))
                if not name:
                    continue

                address = clean_address(row.get("ADDRESS") or row.get("address"))
                lat, lon = extract_coords(row)

                # Unique per-city ID
                raw_id = row.get("ID") or row.get("id") or name.replace(" ", "_")
                source_id = f"{prefix}-{raw_id}"

                garden, created = Garden.objects.update_or_create(
                    source_id=source_id,
                    defaults={
                        "name": name,
                        "garden_type": "community",
                        "address": address,
                        "cross_streets": row.get("LOCATION") or None,
                        "latitude": lat,
                        "longitude": lon,
                        "neighborhood": row.get("AFFILIATION") or None,
                        "managed_by": row.get("DEPT") or row.get("managed_by") or None,
                        "url": row.get("URL") or None,
                        "num_plots": to_int(row.get("NUMPLOTS")),
                        "size_sqft": to_int(row.get("SIZE_SQFT")),
                        "city": city,
                        "state": state,
                        "is_public": True,
                    },
                )

                if created:
                    count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Imported or updated {count} gardens for {city}."
        ))
