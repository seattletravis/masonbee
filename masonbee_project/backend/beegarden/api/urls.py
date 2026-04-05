app_name = "api"
from rest_framework.routers import DefaultRouter
from .views import GardenViewSet, BeeHouseViewSet, BeeHouseEventViewSet

from django.urls import path
from .friend_views import (
    UserSearchView,
    SendFriendRequestView,
    PendingRequestsView,
    AcceptFriendRequestView,
    DeclineFriendRequestView,
    FriendListView,
)

from .profile_views import UserProfileView, AvatarUploadView

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")
router.register(r"beehouses", BeeHouseViewSet, basename="beehouse")
router.register(r"beehouse-events", BeeHouseEventViewSet, basename="beehouse-event")

urlpatterns = []
urlpatterns += router.urls

urlpatterns += [
    path("friends/search/", UserSearchView.as_view(), name="friend-search"),
    path("friends/request/", SendFriendRequestView.as_view(), name="friend-request"),
    path("friends/requests/", PendingRequestsView.as_view(), name="friend-requests"),
    path("friends/accept/", AcceptFriendRequestView.as_view(), name="friend-accept"),
    path("friends/decline/", DeclineFriendRequestView.as_view(), name="friend-decline"),
    path("friends/list/", FriendListView.as_view(), name="friend-list"),
]

urlpatterns += [
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("profile/avatar/", AvatarUploadView.as_view(), name="avatar-upload"),
]