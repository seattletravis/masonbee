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

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")
router.register(r"beehouses", BeeHouseViewSet, basename="beehouse")
router.register(r"beehouse-events", BeeHouseEventViewSet, basename="beehouse-event")


urlpatterns = router.urls

urlpatterns += [
    path("friends/search/", UserSearchView.as_view()),
    path("friends/request/", SendFriendRequestView.as_view()),
    path("friends/requests/", PendingRequestsView.as_view()),
    path("friends/accept/", AcceptFriendRequestView.as_view()),
    path("friends/decline/", DeclineFriendRequestView.as_view()),
    path("friends/list/", FriendListView.as_view()),
]