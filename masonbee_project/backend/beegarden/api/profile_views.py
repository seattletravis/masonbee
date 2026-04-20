from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from beegarden.models import UserProfile
from .profile_serializers import UserProfileSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

      
class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get("avatar")

        if not file:
            return Response({"detail": "No file uploaded"}, status=400)

        # File size limit: 1MB
        if file.size > 1 * 1024 * 1024:
            return Response({"detail": "File too large (max 1MB)"}, status=400)

        # Allowed types
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            return Response({"detail": "Invalid file type"}, status=400)

        profile = request.user.profile
        profile.avatar = file
        profile.save()

        return Response({"detail": "Avatar uploaded successfully"})
