
app_name = "api"
from rest_framework.routers import DefaultRouter
from .views import GardenViewSet, BeeHouseViewSet, BeeHouseEventViewSet, JournalEntryViewSet, default_garden, watched_gardens, change_password
from django.urls import path
from .beehouse_views import PublicBeehouseListView
from .friend_views import (
    UserSearchView,
    SendFriendRequestView,
    PendingRequestsView,
    AcceptFriendRequestView,
    DeclineFriendRequestView,
    FriendListView,
)

from .profile_views import UserProfileView, AvatarUploadView
from .auth_views import RegisterView, VerifyEmailView, CheckUsernameView, CheckEmailView


router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")
router.register(r"beehouses", BeeHouseViewSet, basename="beehouse")
router.register(r"beehouse-events", BeeHouseEventViewSet, basename="beehouse-event")
router.register(r"journal", JournalEntryViewSet, basename="journal")

# ⭐ DO NOT RESET urlpatterns AGAIN
urlpatterns = [
    # Friend system
    path("friends/search/", UserSearchView.as_view(), name="friend-search"),
    path("friends/request/", SendFriendRequestView.as_view(), name="friend-request"),
    path("friends/requests/", PendingRequestsView.as_view(), name="friend-requests"),
    path("friends/accept/", AcceptFriendRequestView.as_view(), name="friend-accept"),
    path("friends/decline/", DeclineFriendRequestView.as_view(), name="friend-decline"),
    path("friends/list/", FriendListView.as_view(), name="friend-list"),

    # Profile
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("profile/avatar/", AvatarUploadView.as_view(), name="avatar-upload"),

    # Gardens
    path("gardens/default/", default_garden),
    path("gardens/watched/", watched_gardens, name="watched-gardens"),
    
    path("beehouses/public/", PublicBeehouseListView.as_view(), name="public-beehouses"),
    
    # Register
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/<uidb64>/<token>/", VerifyEmailView.as_view(), name="verify-email"),
    path("check-username/", CheckUsernameView.as_view()),
    path("check-email/", CheckEmailView.as_view()),
    path("change-password/", change_password, name="change-password"),
]

urlpatterns += router.urls

