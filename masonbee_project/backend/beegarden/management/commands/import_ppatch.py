import csv
from decimal import Decimal
from django.core.management.base import BaseCommand
from beegarden.models import Garden
from beegarden.utils import convert_to_wgs84   # ⭐ NEW IMPORT

class Command(BaseCommand):
    help = "Import Seattle P-Patch community gardens from CSV"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="P_Patch_Data.csv",
            help="Path to the P-Patch CSV file",
        )

    def handle(self, *args, **options):
        file_path = options["file"]

        self.stdout.write(self.style.WARNING(f"Importing gardens from {file_path}..."))

        count = 0

        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                name = row.get("NAME")
                if not name:
                    continue

                # Convert numeric fields safely
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

                # Raw GIS coordinates (EPSG:2285)
                raw_x = row.get("x")
                raw_y = row.get("y")

                lat = None
                lon = None

                # Convert only if both values exist
                if raw_x and raw_y:
                    try:
                        x = float(raw_x)
                        y = float(raw_y)
                        lat, lon = convert_to_wgs84(x, y)  # ⭐ USE UTILS FUNCTION
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f"Coordinate conversion failed for {name}: {e}")
                        )

                garden, created = Garden.objects.get_or_create(
                    name=name,
                    defaults={
                        "garden_type": "community",
                        "address": row.get("ADDRESS") or None,
                        "cross_streets": row.get("LOCATION") or None,
                        "latitude": lat,
                        "longitude": lon,
                        "neighborhood": row.get("AFFILIATION") or None,
                        "managed_by": row.get("DEPT") or None,
                        "url": row.get("URL") or None,
                        "num_plots": to_int(row.get("NUMPLOTS")),
                        "size_sqft": to_int(row.get("SIZE_SQFT")),
                        "is_public": True,
                    },
                )

                if created:
                    count += 1

        self.stdout.write(self.style.SUCCESS(f"Imported {count} gardens."))
