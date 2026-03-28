from rest_framework import serializers
from django.contrib.auth.models import User
from beegarden.models import FriendRequest, Friendship

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSearchSerializer(read_only=True)
    to_user = UserSearchSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ["id", "from_user", "to_user", "status", "created_at"]


class FriendshipSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ["id", "friend", "created_at"]

    def get_friend(self, obj):
        user = self.context["request"].user
        other = obj.user2 if obj.user1 == user else obj.user1
        return UserSearchSerializer(other).data
