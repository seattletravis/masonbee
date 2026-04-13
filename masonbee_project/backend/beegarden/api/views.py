from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

import os
print("DEBUG: LOADED VIEWS FILE:", os.path.abspath(__file__))

from beegarden.models import (
    Garden,
    BeeHouse,
    UserPinnedGarden,
    PrivateGardenAccess,
    GardenImage,
    BeeHouseEvent,
    JournalEntry,
    UserPinnedGarden
)

from .garden_serializers import GardenSerializer
from .beehouse_serializers import BeeHouseSerializer
from .access_serializers import PrivateGardenAccessSerializer
from .pinned_serializers import UserPinnedGardenSerializer
from .garden_image_serializers import GardenImageSerializer
from .beehouse_event_serializers import BeeHouseEventSerializer
from .journal_serializers import JournalEntrySerializer

from beegarden.permissions import (
    user_can_manage_garden,
    user_can_view_garden,
    user_can_grant_access,
    user_can_revoke_access,
)



class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    queryset = JournalEntry.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        user = self.request.user
        return JournalEntry.objects.filter(created_by=user)



class BeeHouseViewSet(viewsets.ModelViewSet):
    queryset = BeeHouse.objects.all()
    serializer_class = BeeHouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["get"], url_path="events")
    def events(self, request, pk=None):
        beehouse = self.get_object()

        # Only return events the user is allowed to see
        user = request.user
        garden = beehouse.garden

        if not (
            garden.is_public
            or garden.owner == user
            or garden.access_list.filter(user=user).exists()
        ):
            return Response({"detail": "Not authorized."}, status=403)

        events = (
            BeeHouseEvent.objects
            .filter(beehouse=beehouse)
            .order_by("-created_at")
        )

        serializer = BeeHouseEventSerializer(events, many=True)
        return Response(serializer.data)
    def perform_create(self, serializer):
        garden = serializer.validated_data["garden"]
        provided_id = serializer.validated_data.get("beehouse_id")

        # If user did not provide a custom ID, auto-generate one
        if not provided_id or provided_id.strip() == "":
            existing_ids = (
                BeeHouse.objects
                .filter(garden=garden)
                .values_list("beehouse_id", flat=True)
            )

            # Extract numeric suffixes from IDs like "House 1"
            numbers = []
            for hid in existing_ids:
                if hid and hid.startswith("House "):
                    try:
                        num = int(hid.split("House ")[1])
                        numbers.append(num)
                    except (ValueError, IndexError):
                        pass

            next_number = max(numbers) + 1 if numbers else 1
            auto_id = f"House {next_number}"

            serializer.save(created_by=self.request.user, beehouse_id=auto_id)
        else:
            serializer.save(created_by=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        garden_id = self.request.query_params.get("garden")
        if garden_id:
            qs = qs.filter(garden_id=garden_id)

        user = self.request.user
        return qs.filter(
            garden__is_public=True
        ) | qs.filter(
            garden__owner=user
        ) | qs.filter(
            garden__access_list__user=user
        )

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


# ----------------BeeHouseEventViewSet--------------------

class BeeHouseEventViewSet(viewsets.ModelViewSet):
    queryset = BeeHouseEvent.objects.all()
    serializer_class = BeeHouseEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()

        beehouse_id = self.request.query_params.get("beehouse")
        if beehouse_id:
            qs = qs.filter(beehouse_id=beehouse_id)

        user = self.request.user
        qs = qs.filter(
            beehouse__garden__is_public=True
        ) | qs.filter(
            beehouse__garden__owner=user
        ) | qs.filter(
            beehouse__garden__access_list__user=user
        )

        return qs.order_by("-created_at")


    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def default_garden(request):
    garden = Garden.objects.filter(owner=request.user).first()
    if not garden:
        return Response({"detail": "No default garden found."}, status=404)
    return Response(GardenSerializer(garden).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def watched_gardens(request):
    user = request.user

    pinned = UserPinnedGarden.objects.filter(user=user).select_related("garden")
    default = pinned.filter(is_default=True).first()

    return Response({
        "default": GardenSerializer(default.garden).data if default else None,
        "watchlist": GardenSerializer([p.garden for p in pinned], many=True).data
    })
