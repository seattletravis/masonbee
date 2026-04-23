from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver





# ----------------------------------FriendRequests---------------------------
class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
    ]

    from_user = models.ForeignKey(User, related_name="sent_requests", on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name="received_requests", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return f"{self.from_user} → {self.to_user} ({self.status})"


class Friendship(models.Model):
    user1 = models.ForeignKey(User, related_name="friends1", on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name="friends2", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user1", "user2")

    def __str__(self):
        return f"{self.user1} ↔ {self.user2}"
    
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
    habitat_type = models.CharField(max_length=255, null=True, blank=True)

    # Location fields
    address = models.CharField(max_length=255, blank=True, null=True)
    cross_streets = models.CharField(max_length=255, blank=True, null=True)

    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=50, null=True, blank=True)


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
    source_id = models.CharField(max_length=255, unique=True)



    # Ownership (user-created gardens)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who owns this garden (only for private gardens)."
    )

    # Visibility — IMPORTANT:
    # User-created gardens must ALWAYS remain private.
    is_public = models.BooleanField(
        default=False,
        help_text="Only city-verified gardens may be public."
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    # -----------------------------
    # Privacy Enforcement
    # -----------------------------
    def clean(self):
        """
        Prevent user-owned gardens from ever being public.
        """
        if self.owner and self.is_public:
            raise ValidationError(
                "User-created gardens cannot be made public. "
                "Only city-verified gardens may be listed publicly."
            )

    def save(self, *args, **kwargs):
        """
        Enforce privacy at the database level.
        If a garden has an owner, force is_public=False.
        """
        if self.owner:
            self.is_public = False
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(owner__isnull=True) |
                    models.Q(is_public=False)
                ),
                name="user_gardens_must_be_private"
            )
        ]

# ----------------------------------Journal-------------------------

class JournalEntry(models.Model):
    CATEGORY_CHOICES = [
        ("bee_activity", "Bee Activity"),
        ("bloom", "Bloom / Flowering"),
        ("maintenance", "Maintenance"),
        ("observation", "General Observation"),
        ("weather", "Weather Note"),
        ("other", "Other"),
    ]

    garden = models.ForeignKey(
        "Garden",   # ← string reference avoids ordering issues
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="journal_entries"
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="journal_entries"
    )

    title = models.CharField(max_length=255)
    date = models.DateField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]


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

    BEEHOUSE_STATUS = [
        ('active', 'Active bees present'),
        ('cocoons', 'Will be loaded with cocoons'),
        ('inactive', 'Inactive / empty'),
    ]


    beehouse_status = models.CharField(
        max_length=20,
        choices=BEEHOUSE_STATUS,
        default='inactive',
        help_text="Biological status of the beehouse."
    )

    # Optional link to a city/community garden
    garden = models.ForeignKey(
        Garden,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='beehouses'
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # NEW: Human-friendly name
    name = models.CharField(
        max_length=100,
        help_text="A short name for this beehouse (e.g., 'Backyard House')."
    )

    # NEW: User-provided description of the garden/location
    garden_description = models.CharField(
        max_length=255,
        blank=True,
        help_text="Describe the area where this beehouse is located."
    )

    # NEW: Environmental context checkboxes
    water_nearby = models.BooleanField(default=False)
    clay_nearby = models.BooleanField(default=False)
    flowers_nearby = models.BooleanField(default=False)
    woods_nearby = models.BooleanField(default=False)

    # Existing ecological fields
    beehouse_type = models.CharField(max_length=20, choices=HOUSE_TYPES)
    tube_capacity = models.CharField(max_length=10, choices=TUBE_CAPACITY_CHOICES)
    height_above_ground_inches = models.PositiveIntegerField()
    orientation = models.CharField(max_length=50, choices=DIRECTIONS, blank=True, null=True)

    latitude = models.DecimalField(max_digits=15, decimal_places=6)
    longitude = models.DecimalField(max_digits=15, decimal_places=6)

    is_active = models.BooleanField(default=False)
    install_date = models.DateField(blank=True, null=True)
    uninstall_date = models.DateField(
        blank=True,
        null=True,
        help_text="Enter uninstall date only if this BeeHouse has been permanently removed."
    )

    def __str__(self):
        return self.name

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
    is_default = models.BooleanField(default=False)

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
    
# -----------------------------PrivateGardenAccess-------------------------------

class PrivateGardenAccess(models.Model):
    ROLE_CHOICES = [
        ("viewer", "Viewer"),
        ("manager", "Manager"),
    ]

    garden = models.ForeignKey(
        Garden,
        on_delete=models.CASCADE,
        related_name="access_list"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="private_garden_access"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="viewer",
        help_text="Viewer can see the garden. Manager can grant access to others."
    )

    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_private_garden_access"
    )

    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("garden", "user")

    def __str__(self):
        return f"{self.user.username} has {self.role} access to {self.garden.name}"
    
# -------------------------------------GardenImage----------------------------------

class GardenImage(models.Model):
    garden = models.ForeignKey(
        Garden,
        on_delete=models.CASCADE,
        related_name="images"
    )

    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    image = models.ImageField(
        upload_to="garden_images/",
        help_text="JPEG or PNG only. Max size 5MB."
    )

    caption = models.CharField(
        max_length=255,
        blank=True
    )

    is_banner = models.BooleanField(
        default=False,
        help_text="If true, this image is used as the garden banner."
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

# ------------------------------------UserSubscription-------------------------------

class UserSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tier = models.CharField(max_length=20, default="free")  # free, premium, pro
    renewed_at = models.DateTimeField(auto_now_add=True)


# ------------------------Avatar And Profile---------------------------
def avatar_upload_path(instance, filename):
    return f"avatars/user_{instance.user.id}/{filename}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    display_name = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)

    avatar = models.ImageField(
        upload_to=avatar_upload_path,
        blank=True,
        null=True
    )

    # Friend request preferences
    friend_request_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"Profile for {self.user.username}"





@receiver(post_save, sender=User)
def create_user_profile(_sender, instance, created, **_kwargs):
    if created:
        UserProfile.objects.create(user=instance)
