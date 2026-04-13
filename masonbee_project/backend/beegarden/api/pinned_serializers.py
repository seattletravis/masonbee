from rest_framework import serializers
from beegarden.models import UserPinnedGarden

class UserPinnedGardenSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        user = self.context["request"].user

        # If user is setting this as default, unset all others
        if attrs.get("is_default"):
            UserPinnedGarden.objects.filter(user=user).update(is_default=False)

        return attrs
    class Meta:
        model = UserPinnedGarden
        fields = "__all__"