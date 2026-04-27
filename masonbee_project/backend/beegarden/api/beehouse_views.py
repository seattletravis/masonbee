import math
from rest_framework import generics
from rest_framework.permissions import AllowAny
from beegarden.models import BeeHouse
from beegarden.api.beehouse_serializers import PublicBeehouseSerializer


# -----------------------------
# Fast bounding-box prefilter
# -----------------------------
def bounding_box(lat, lon, radius_m):
    """
    Returns (min_lat, max_lat, min_lon, max_lon)
    for a quick DB-level bounding box filter.
    """
    # Approx degrees per meter
    dlat = radius_m / 111320
    dlon = radius_m / (111320 * math.cos(math.radians(lat)))

    return (
        lat - dlat,
        lat + dlat,
        lon - dlon,
        lon + dlon,
    )


# -----------------------------
# Precise Haversine distance
# -----------------------------
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


# -----------------------------
# Public Beehouse API
# -----------------------------
class PublicBeehouseListView(generics.ListAPIView):
    serializer_class = PublicBeehouseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = BeeHouse.objects.all()

        lat = self.request.query_params.get("lat")
        lon = self.request.query_params.get("lon")
        radius = float(self.request.query_params.get("radius", 200))

        if not lat or not lon:
            return queryset

        try:
            lat = float(lat)
            lon = float(lon)

            # -----------------------------
            # 1. Bounding-box prefilter
            # -----------------------------
            min_lat, max_lat, min_lon, max_lon = bounding_box(lat, lon, radius)

            candidates = queryset.filter(
                latitude__gte=min_lat,
                latitude__lte=max_lat,
                longitude__gte=min_lon,
                longitude__lte=max_lon,
            )

            # -----------------------------
            # 2. Precise Haversine filter
            # -----------------------------
            safe_results = []
            for bh in candidates:
                if bh.latitude is None or bh.longitude is None:
                    continue

                bh_lat = float(bh.latitude)
                bh_lon = float(bh.longitude)

                dist = haversine_distance(lat, lon, bh_lat, bh_lon)
                if dist <= radius:
                    safe_results.append(bh)

            return safe_results

        except Exception as e:
            print("Error in public beehouse filter:", e)
            return []
