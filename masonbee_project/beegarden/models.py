from django.db import models
from django.conf import settings

class Garden(models.Model):
    name = models.CharField(max_length=255)

    garden_type = models.CharField(
        max_length=50,
        choices=[
            ('community', 'Community Garden'),
            ('private', 'Private Garden'),
            ('public', 'Public Area'),
        ],
        default='community'
    )

    # Location fields
    address = models.CharField(max_length=255, blank=True, null=True)
    cross_streets = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=15, decimal_places=6, blank=True, null=True)
    neighborhood = models.CharField(max_length=255, blank=True, null=True)

    # Metadata
    managed_by = models.CharField(max_length=255, blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    num_plots = models.IntegerField(blank=True, null=True)
    size_sqft = models.IntegerField(blank=True, null=True)

    # Ownership (only for private gardens)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who owns this garden (only for private gardens)."
    )

    # Visibility
    is_public = models.BooleanField(
        default=False,
        help_text="Only check this box if the garden is open to the public."
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
