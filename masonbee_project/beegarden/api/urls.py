from rest_framework.routers import DefaultRouter
from .views import GardenViewSet, BeeHouseViewSet

router = DefaultRouter()
router.register(r"gardens", GardenViewSet, basename="garden")
router.register(r"beehouses", BeeHouseViewSet, basename="beehouse")


urlpatterns = router.urls