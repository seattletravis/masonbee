from rest_framework import serializers
from beegarden.models import BeeHouseEvent

class BeeHouseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeeHouseEvent
        fields = "__all__"
        read_only_fields = ["id", "created_at", "created_by"]

    def validate_event_type(self, value):
        allowed = [choice[0] for choice in BeeHouseEvent._meta.get_field("event_type").choices]
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid event_type '{value}'. Allowed values: {allowed}"
            )
        return value