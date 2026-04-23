from rest_framework import serializers
from beegarden.models import BeeHouse

class BeeHouseSerializer(serializers.ModelSerializer):
    event_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BeeHouse
        fields = "__all__"
        read_only_fields = ["id"]
