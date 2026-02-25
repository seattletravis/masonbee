import csv
from django.core.management.base import BaseCommand
from beegarden.models import Garden

class Command(BaseCommand):
    help = "Import Seattle P-Patch data from CSV into the Garden model."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='P_Patch_Data.csv',
            help='Path to the P-Patch CSV file.'
        )

    def handle(self, *args, **options):
        file_path = options['file']

        self.stdout.write(self.style.NOTICE(f"Importing P-Patch data from {file_path}..."))

        with open(file_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0

            for row in reader:
                Garden.objects.get_or_create(
                    name=row.get('NAME'),
                    defaults={
                        'garden_type': 'community',
                        'address': row.get('ADDRESS'),
                        'cross_streets': row.get('LOCATION'),
                        'latitude': row.get('y') or None,
                        'longitude': row.get('x') or None,
                        'neighborhood': row.get('AFFILIATION'),
                        'managed_by': row.get('DEPT'),
                        'url': row.get('URL'),
                        'num_plots': row.get('NUMPLOTS') or None,
                        'size_sqft': row.get('SIZE_SQFT') or None,
                        'is_public': True,
    }
)
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully imported {count} gardens."))
