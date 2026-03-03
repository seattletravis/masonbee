from django.shortcuts import render

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Garden,
    UserPinnedGarden,
    PrivateGardenAccess,
    GardenImage,
)

# ---------------------- Permissions helpers ---------------------- #

def user_can_view_garden(user, garden: Garden) -> bool:
    if garden.is_public:
        return True
    if garden.owner == user:
        return True
    return PrivateGardenAccess.objects.filter(garden=garden, user=user).exists()


def user_can_manage_garden(user, garden: Garden) -> bool:
    if garden.owner == user:
        return True
    return PrivateGardenAccess.objects.filter(
        garden=garden,
        user=user,
        role="manager",
    ).exists()


def user_can_grant_access(user, garden: Garden) -> bool:
    return user_can_manage_garden(user, garden)


def user_can_revoke_access(requesting_user, target_user, garden: Garden) -> bool:
    if requesting_user == garden.owner:
        return True
    # managers can revoke viewers only
    return PrivateGardenAccess.objects.filter(
        garden=garden,
        user=requesting_user,
        role="manager",
    ).exists() and PrivateGardenAccess.objects.filter(
        garden=garden,
        user=target_user,
        role="viewer",
    ).exists()


# ---------------------- Serializers (inline for now) ---------------------- #

from rest_framework import serializers
from beegarden.models import BeeHouse
from .beehouse_serializers import BeeHouseSerializer

class BeeHouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeeHouse
        fields = "__all__"
        read_only_fields = ["id", "beehouse_id"]


# class GardenSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Garden
#         fields = "__all__"
#         read_only_fields = ["owner", "created_at", "updated_at"]

class GardenSerializer(serializers.ModelSerializer):
    beehouses = BeeHouseSerializer(many=True, read_only=True)

    class Meta:
        model = Garden
        fields = "__all__"
        read_only_fields = ["owner", "created_at", "updated_at"]



class UserPinnedGardenSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPinnedGarden
        fields = "__all__"
        read_only_fields = ["user", "pinned_at"]


class PrivateGardenAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateGardenAccess
        fields = "__all__"
        read_only_fields = ["granted_by", "granted_at"]


class GardenImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GardenImage
        fields = "__all__"
        read_only_fields = ["uploaded_by", "uploaded_at"]


# ---------------------- GardenViewSet ---------------------- #

class GardenViewSet(viewsets.ModelViewSet):
    """
    Core garden endpoints:
    - list / retrieve (respecting visibility)
    - create / update / delete (owner + managers)
    - pin / unpin
    - manage private access
    - upload images
    """
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Public gardens + private gardens user can see
        public_qs = Garden.objects.filter(is_public=True)
        private_qs = Garden.objects.filter(
            is_public=False,
            access_list__user=user,
        )
        owned_qs = Garden.objects.filter(owner=user)
        return (public_qs | private_qs | owned_qs).distinct()

    def perform_create(self, serializer):
        # If garden_type is private, set owner to current user
        garden = serializer.save()
        if garden.garden_type == "private" and garden.owner is None:
            garden.owner = self.request.user
            garden.save()

    def update(self, request, *args, **kwargs):
        garden = self.get_object()
        if not user_can_manage_garden(request.user, garden):
            return Response({"detail": "Not allowed to edit this garden."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        garden = self.get_object()
        if request.user != garden.owner:
            return Response({"detail": "Only the owner can delete this garden."},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    # ---------- Pin / Unpin ---------- #

    @action(detail=True, methods=["post"])
    def pin(self, request, pk=None):
        garden = self.get_object()
        if not user_can_view_garden(request.user, garden):
            return Response({"detail": "You do not have access to this garden."},
                            status=status.HTTP_403_FORBIDDEN)

        obj, created = UserPinnedGarden.objects.get_or_create(
            user=request.user,
            garden=garden,
        )
        serializer = UserPinnedGardenSerializer(obj)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["delete"])
    def unpin(self, request, pk=None):
        garden = self.get_object()
        UserPinnedGarden.objects.filter(user=request.user, garden=garden).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---------- Access management (private gardens) ---------- #

    @action(detail=True, methods=["get"])
    def access_list(self, request, pk=None):
        garden = self.get_object()
        if not user_can_manage_garden(request.user, garden):
            return Response({"detail": "Not allowed to view access list."},
                            status=status.HTTP_403_FORBIDDEN)
        qs = garden.access_list.select_related("user")
        serializer = PrivateGardenAccessSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def grant_access(self, request, pk=None):
        garden = self.get_object()
        if not user_can_grant_access(request.user, garden):
            return Response({"detail": "Not allowed to grant access."},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = PrivateGardenAccessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user = serializer.validated_data["user"]
        role = serializer.validated_data.get("role", "viewer")

        # Managers can only grant viewer role
        if not request.user == garden.owner and role == "manager":
            return Response({"detail": "Only the owner can grant manager role."},
                            status=status.HTTP_403_FORBIDDEN)

        obj, _ = PrivateGardenAccess.objects.update_or_create(
            garden=garden,
            user=target_user,
            defaults={
                "role": role,
                "granted_by": request.user,
            },
        )
        out = PrivateGardenAccessSerializer(obj)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def revoke_access(self, request, pk=None):
        garden = self.get_object()
        target_user_id = request.data.get("user_id")
        target_user = get_object_or_404(User, id=target_user_id)

        if not user_can_revoke_access(request.user, target_user, garden):
            return Response({"detail": "Not allowed to revoke access."},
                            status=status.HTTP_403_FORBIDDEN)

        PrivateGardenAccess.objects.filter(garden=garden, user=target_user).delete()
        # TODO: also remove pinned gardens + notifications for that user/garden
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ---------- Images ---------- #

    @action(detail=True, methods=["get"])
    def images(self, request, pk=None):
        garden = self.get_object()
        if not user_can_view_garden(request.user, garden):
            return Response({"detail": "You do not have access to this garden."},
                            status=status.HTTP_403_FORBIDDEN)
        qs = garden.images.all()
        serializer = GardenImageSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def upload_image(self, request, pk=None):
        garden = self.get_object()

        # Public gardens: any authenticated user can upload
        # Private gardens: only owner + managers (for now)
        if garden.is_public:
            if not request.user.is_authenticated:
                return Response({"detail": "Authentication required."},
                                status=status.HTTP_401_UNAUTHORIZED)
        else:
            if not user_can_manage_garden(request.user, garden):
                return Response({"detail": "Not allowed to upload images to this garden."},
                                status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data["garden"] = garden.id

        serializer = GardenImageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(uploaded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
