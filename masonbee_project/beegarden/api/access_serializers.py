from rest_framework import serializers
from beegarden.models import PrivateGardenAccess

class PrivateGardenAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateGardenAccess
        fields = "__all__"