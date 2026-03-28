from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import FriendRequest, Friendship
from .friend_serializers import (
    UserSearchSerializer,
    FriendRequestSerializer,
    FriendshipSerializer,
)


class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()

        if not q:
            return Response([])

        users = User.objects.filter(
            models.Q(username__icontains=q)
            | models.Q(first_name__icontains=q)
            | models.Q(last_name__icontains=q)
            | models.Q(email__icontains=q)
        ).exclude(id=request.user.id)

        return Response(UserSearchSerializer(users, many=True).data)


class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        to_user_id = request.data.get("to_user_id")

        if not to_user_id:
            return Response({"detail": "to_user_id required"}, status=400)

        if int(to_user_id) == request.user.id:
            return Response({"detail": "Cannot friend yourself"}, status=400)

        to_user = User.objects.filter(id=to_user_id).first()
        if not to_user:
            return Response({"detail": "User not found"}, status=404)

        # Prevent duplicates
        if FriendRequest.objects.filter(from_user=request.user, to_user=to_user).exists():
            return Response({"detail": "Request already sent"}, status=400)

        if Friendship.objects.filter(
            models.Q(user1=request.user, user2=to_user)
            | models.Q(user1=to_user, user2=request.user)
        ).exists():
            return Response({"detail": "Already friends"}, status=400)

        fr = FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return Response(FriendRequestSerializer(fr).data, status=201)


class PendingRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        incoming = FriendRequest.objects.filter(to_user=request.user, status="pending")
        return Response(FriendRequestSerializer(incoming, many=True).data)


class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        fr_id = request.data.get("request_id")
        fr = FriendRequest.objects.filter(id=fr_id, to_user=request.user, status="pending").first()

        if not fr:
            return Response({"detail": "Request not found"}, status=404)

        # Create mutual friendship
        Friendship.objects.create(user1=fr.from_user, user2=fr.to_user)

        fr.status = "accepted"
        fr.save()

        return Response({"detail": "Friend request accepted"})


class DeclineFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        fr_id = request.data.get("request_id")
        fr = FriendRequest.objects.filter(id=fr_id, to_user=request.user, status="pending").first()

        if not fr:
            return Response({"detail": "Request not found"}, status=404)

        fr.status = "declined"
        fr.save()

        return Response({"detail": "Friend request declined"})


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        friendships = Friendship.objects.filter(
            models.Q(user1=user) | models.Q(user2=user)
        )

        serializer = FriendshipSerializer(friendships, many=True, context={"request": request})
        return Response(serializer.data)
