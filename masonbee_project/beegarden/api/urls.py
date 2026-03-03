from rest_framework.routers import DefaultRouter
from .views import GardenViewSet, BeeHouseViewSet, BeeHouseEventViewSet

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")
router.register(r"beehouses", BeeHouseViewSet, basename="beehouse")
router.register(r"beehouse-events", BeeHouseEventViewSet, basename="beehouse-event")


urlpatterns = router.urls