from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

# ----------------------------------Garden-------------------------------------

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
    latitude = models.DecimalField(
    max_digits=15,
    decimal_places=6,
    blank=True,
    null=True,
    help_text="Optional. Used to place public gardens on the map. Private gardens can leave this blank."
)

    longitude = models.DecimalField(
    max_digits=15,
    decimal_places=6,
    blank=True,
    null=True,
    help_text="Optional. Private gardens do not need coordinates."
)

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


# ----------------------------BeeHouse---------------------------------

class BeeHouse(models.Model):
    HOUSE_TYPES = [
        ('block', 'Wood Block'),
        ('straw', 'Straw Bundle or Container'),
        ('drilled', 'Drilled Wood'),
        ('other', 'Other'),
    ]

    TUBE_CAPACITY_CHOICES = [
        ('<100', 'Less than 100 tubes'),
        ('<200', 'Less than 200 tubes'),
        ('<300', 'Less than 300 tubes'),
        ('>300', 'More than 300 tubes'),
    ]

    DIRECTIONS = [
        ('North', 'Northward Facing'),
        ('South', 'Southward Facing'),
        ('East', 'Eastward Facing'),
        ('West', 'Westward Facing'),
    ]

    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name='beehouses')

    beehouse_id = models.CharField(max_length=50)

    class Meta:
        unique_together = ('garden', 'beehouse_id')

    beehouse_type = models.CharField(max_length=20, choices=HOUSE_TYPES)

    latitude = models.DecimalField(max_digits=15, decimal_places=6)
    longitude = models.DecimalField(max_digits=15, decimal_places=6)

    # Ecological state
    is_active = models.BooleanField(default=False)

    tube_capacity = models.CharField(max_length=10, choices=TUBE_CAPACITY_CHOICES)
    height_above_ground_inches = models.PositiveIntegerField()

    install_date = models.DateField(blank=True, null=True)
    orientation = models.CharField(max_length=50, choices=DIRECTIONS, blank=True, null=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    # Physical lifecycle
    uninstall_date = models.DateField(
        blank=True,
        null=True,
        help_text="Enter uninstall date only if this BeeHouse has been permanently removed or otherwise decommissioned."
    )


    def __str__(self):
        return f"{self.beehouse_id} ({self.garden.name})"

    def clean(self):
        if self.uninstall_date and self.is_active:
            raise ValidationError("A BeeHouse with an uninstall date cannot be active.")

    def save(self, *args, **kwargs):
        if self.uninstall_date is not None:
            self.is_active = False
        super().save(*args, **kwargs)

# -----------------------------BeeHouseEvent-----------------------------------
class BeeHouseEvent(models.Model):
    EVENT_TYPES = [
        ("emergence", "Emergence Observed"),
        ("activated", "Activated - Added dormant bees to bee house!"),
        ("deactivated", "Deactivated - Removed dormant bees from bee house!"),
        ("tubes_added", "Tubes Added"),
        ("cleaned", "Cleaned"),
        ("parasite_check", "Parasite Check"),
        ("tubes_replaced", "Tubes Replaced"),
        ("winterized", "Winterized"),
        ("maintenance", "Maintenance"),
        ("installed", "Installed"),
        ("uninstalled", "Uninstalled"),
        ("destroyed", "Destroyed"),
        ("other", "Other"),
    ]

    beehouse = models.ForeignKey(
        BeeHouse,
        on_delete=models.CASCADE,
        related_name="events"
    )

    event_type = models.CharField(
        max_length=50,
        choices=EVENT_TYPES
    )

    notes = models.TextField(
        blank=True,
        help_text="Optional details about the event."
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who recorded the event."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["beehouse", "created_at"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self):
        return f"{self.get_event_type_display()} on {self.created_at.date()}"

# -------------------------------GardenChatMessage-----------------------------

BAD_WORDS = ["shit", "fuck", "cunt", "damn", "slut"]

class GardenChatMessage(models.Model):
    garden = models.ForeignKey(Garden, on_delete=models.CASCADE, related_name="chat_messages")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        lowered = self.text.lower()
        for word in BAD_WORDS:
            if word in lowered:
                raise ValidationError("Your message contains language that isn't allowed.")

    def save(self, *args, **kwargs):
        self.full_clean()  # triggers clean()
        super().save(*args, **kwargs)


    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["garden", "created_at"]),
        ]

# ---------------------------------DirectMessage-----------------------------

class DirectMessageThread(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)

class DirectMessageThreadParticipant(models.Model):
    thread = models.ForeignKey(DirectMessageThread, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

class DirectMessage(models.Model):
    thread = models.ForeignKey(DirectMessageThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["thread", "created_at"]),
        ]

# ------------------------------------UserPinnedGarden------------------------------
class UserPinnedGarden(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="pinned_gardens"
    )

    garden = models.ForeignKey(
        Garden,
        on_delete=models.CASCADE,
        related_name="pinned_by"
    )

    pinned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "garden")

    def __str__(self):
        return f"{self.user.username} pinned {self.garden.name}"