from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from beegarden.models import (
    Garden,
    BeeHouse,
    UserPinnedGarden,
    PrivateGardenAccess,
    GardenImage,
)

from .garden_serializers import GardenSerializer
from .beehouse_serializers import BeeHouseSerializer
from .access_serializers import PrivateGardenAccessSerializer
from .pinned_serializers import UserPinnedGardenSerializer
from .garden_image_serializers import GardenImageSerializer

from beegarden.permissions import (
    user_can_manage_garden,
    user_can_view_garden,
    user_can_grant_access,
    user_can_revoke_access,
)

class BeeHouseViewSet(viewsets.ModelViewSet):
    queryset = BeeHouse.objects.all()
    serializer_class = BeeHouseSerializer
    permission_classes = [permissions.IsAuthenticated]

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




# from rest_framework import viewsets, permissions
# from beegarden.models import Garden, BeeHouse
# from .garden_serializers import GardenSerializer
# from .beehouse_serializers import BeeHouseSerializer


# class GardenViewSet(viewsets.ModelViewSet):
#     queryset = Garden.objects.all()
#     serializer_class = GardenSerializer
#     permission_classes = [permissions.IsAuthenticated]

# class BeeHouseViewSet(viewsets.ModelViewSet):
#     queryset = BeeHouse.objects.all()
#     serializer_class = BeeHouseSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         qs = super().get_queryset()
#         garden_id = self.request.query_params.get("garden")
#         if garden_id:
#             qs = qs.filter(garden_id=garden_id)

#         user = self.request.user
#         return qs.filter(
#             garden__is_public=True
#         ) | qs.filter(
#             garden__managed_by=user
#         )