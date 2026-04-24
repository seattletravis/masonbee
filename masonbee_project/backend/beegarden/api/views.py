from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count
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




from django.db.models import Q
from rest_framework import filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class GardenViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Garden.objects.all()
    serializer_class = GardenSerializer

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

class BeeHouseViewSet(viewsets.ModelViewSet):
    serializer_class = BeeHouseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Return ALL beehouses created by this user
        qs = BeeHouse.objects.filter(created_by=user)

        # Annotate event_count using related_name="events"
        qs = qs.annotate(event_count=Count("events"))

        return qs


    @action(detail=True, methods=["get"], url_path="events")
    def events(self, request, pk=None):
        beehouse = self.get_object()
        user = request.user
        garden = beehouse.garden

        if not (
            garden.is_public
            or garden.owner == user
            or garden.access_list.filter(user=user).exists()
        ):
            return Response({"detail": "Not authorized."}, status=403)

        events = BeeHouseEvent.objects.filter(beehouse=beehouse).order_by("-created_at")
        serializer = BeeHouseEventSerializer(events, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)



class BeeHouseEventViewSet(viewsets.ModelViewSet):
    queryset = BeeHouseEvent.objects.all()
    serializer_class = BeeHouseEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()

        # Filter by beehouse if provided
        beehouse_id = self.request.query_params.get("beehouse")
        if beehouse_id:
            qs = qs.filter(beehouse_id=beehouse_id)

        user = self.request.user

        # Only return events the user is allowed to see
        qs = qs.filter(
            beehouse__garden__is_public=True
        ) | qs.filter(
            beehouse__garden__owner=user
        ) | qs.filter(
            beehouse__garden__access_list__user=user
        )

        return qs.order_by("-created_at")


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def default_garden(request):
    user = request.user

    # POST: set or clear default
    if request.method == "POST":
        garden_id = request.data.get("garden_id")

        # ⭐ CLEAR DEFAULT
        if garden_id is None:
            UserPinnedGarden.objects.filter(user=user).update(is_default=False)
            return Response({"status": "default cleared"}, status=200)

        # ⭐ SET NEW DEFAULT
        UserPinnedGarden.objects.filter(user=user).update(is_default=False)

        pinned, created = UserPinnedGarden.objects.get_or_create(
            user=user,
            garden_id=garden_id,
            defaults={"is_default": True}
        )

        if not created:
            pinned.is_default = True
            pinned.save()

        return Response({"status": "default set"}, status=200)

    # GET: return current default
    try:
        pinned = UserPinnedGarden.objects.get(user=user, is_default=True)
        data = MinimalGardenSerializer(pinned.garden).data
        return Response(data, status=200)
    except UserPinnedGarden.DoesNotExist:
        return Response(None, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def watched_gardens(request):
    user = request.user

    pinned = UserPinnedGarden.objects.filter(user=user).select_related("garden")

    return Response(UserPinnedGardenSerializer(pinned, many=True).data)

