from rest_framework import serializers
from beegarden.models import GardenImage

class GardenImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GardenImage
        fields = "__all__"
        read_only_fields = ["uploaded_by", "uploaded_at"]