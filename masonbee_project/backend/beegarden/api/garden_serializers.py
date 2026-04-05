from rest_framework import serializers
from beegarden.models import Garden
from .beehouse_serializers import BeeHouseSerializer

class GardenSerializer(serializers.ModelSerializer):
    beehouses = BeeHouseSerializer(many=True, read_only=True)

    class Meta:
        model = Garden
        fields = "__all__"
        read_only_fields = ["owner", "created_at", "updated_at"]