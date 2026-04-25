from rest_framework import serializers
from beegarden.models import BeeHouse

class BeeHouseSerializer(serializers.ModelSerializer):
    event_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BeeHouse
        fields = "__all__"
        read_only_fields = ["id"]


class PublicBeehouseSerializer(serializers.ModelSerializer):
    """
    Public-facing serializer for beehouse data.
    Exposes only what the prediction engine needs.
    Does NOT expose owner or private details.
    """

    class Meta:
        model = BeeHouse
        fields = [
            "id",
            "latitude",
            "longitude",
            "created_at",
        ]
        read_only_fields = fields