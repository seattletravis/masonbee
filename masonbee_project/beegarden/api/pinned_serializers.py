from rest_framework import serializers
from beegarden.models import UserPinnedGarden

class UserPinnedGardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPinnedGarden
        fields = "__all__"