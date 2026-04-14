
from rest_framework import serializers
from beegarden.models import UserPinnedGarden, Garden

class MinimalGardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Garden
        fields = ("id", "name")  # add more fields if needed

class UserPinnedGardenSerializer(serializers.ModelSerializer):
    garden = MinimalGardenSerializer(read_only=True)

    def validate(self, attrs):
        user = self.context["request"].user

        if attrs.get("is_default"):
            UserPinnedGarden.objects.filter(user=user).update(is_default=False)

        return attrs

    class Meta:
        model = UserPinnedGarden
        fields = "__all__"
