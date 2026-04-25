import math
from rest_framework import generics
from rest_framework.permissions import AllowAny
from beegarden.models import BeeHouse
from beegarden.api.beehouse_serializers import PublicBeehouseSerializer


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000  # meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class PublicBeehouseListView(generics.ListAPIView):
    serializer_class = PublicBeehouseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = BeeHouse.objects.all()

        lat = self.request.query_params.get("lat")
        lon = self.request.query_params.get("lon")
        radius = float(self.request.query_params.get("radius", 200))

        if lat and lon:
            try:
                lat = float(lat)
                lon = float(lon)

                safe_results = []
                for bh in queryset:
                    # Skip invalid rows
                    if bh.latitude is None or bh.longitude is None:
                        continue

                    # Convert Decimal → float
                    bh_lat = float(bh.latitude)
                    bh_lon = float(bh.longitude)

                    dist = haversine_distance(lat, lon, bh_lat, bh_lon)
                    if dist <= radius:
                        safe_results.append(bh)

                return safe_results

            except Exception as e:
                print("Error in public beehouse filter:", e)
                return []

        return queryset
