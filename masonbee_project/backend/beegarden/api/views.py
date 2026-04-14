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

from .garden_serializers import GardenSerializer, MinimalGardenSerializer
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

from django.db.models import Q
from rest_framework import filters

class GardenViewSet(viewsets.ModelViewSet):
    
    """
    Core garden endpoints:
    - list / retrieve (respecting visibility)
    - create / update / delete (owner + managers)
    - pin / unpin
    - manage private access
    - upload images
    """


    @action(detail=True, methods=["post"])
    def pin(self, request, pk=None):
        user = request.user
        garden = self.get_object()

        record, created = UserPinnedGarden.objects.get_or_create(
            user=user,
            garden=garden,
        )

        return Response(UserPinnedGardenSerializer(record).data)

    @action(detail=True, methods=["delete"])
    def unpin(self, request, pk=None):
        user = request.user
        garden = self.get_object()

        UserPinnedGarden.objects.filter(user=user, garden=garden).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
    
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer
    permission_classes = [permissions.IsAuthenticated]

    # DRF search backend (still useful for browsable API)
    filter_backends = [filters.SearchFilter]
    search_fields = [
        'name',
        'address',
        'neighborhood',
        'cross_streets',
        'managed_by',
    ]

    def get_queryset(self):
        user = self.request.user

        # Base visibility rules
        public_qs = Garden.objects.filter(is_public=True)
        private_qs = Garden.objects.filter(
            is_public=False,
            access_list__user=user,
        )
        owned_qs = Garden.objects.filter(owner=user)

        qs = (public_qs | private_qs | owned_qs).distinct()

        # Manual search filtering (required because get_queryset overrides DRF filtering)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search) |
                Q(neighborhood__icontains=search) |
                Q(cross_streets__icontains=search) |
                Q(managed_by__icontains=search)
            )

        return qs


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



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def default_garden(request):
    try:
        pinned = UserPinnedGarden.objects.get(user=request.user, is_default=True)
        data = MinimalGardenSerializer(pinned.garden).data
        return Response(data, status=200)
    except UserPinnedGarden.DoesNotExist:
        # Must return explicit JSON null, not empty body
        return Response(None, status=200)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def watched_gardens(request):
    user = request.user

    pinned = UserPinnedGarden.objects.filter(user=user).select_related("garden")

    return Response(UserPinnedGardenSerializer(pinned, many=True).data)

