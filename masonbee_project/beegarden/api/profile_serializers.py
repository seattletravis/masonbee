from rest_framework import serializers
from beegarden.models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "display_name",
            "bio",
            "avatar",
            "location_enabled",
            "latitude",
            "longitude",
            "friend_request_notifications",
        ]
        read_only_fields = ["avatar"]
