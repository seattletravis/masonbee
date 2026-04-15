from pyproj import Transformer

# EPSG:2285 (WA State Plane North) → EPSG:4326 (WGS84 lat/lon)
transformer = Transformer.from_crs("EPSG:2285", "EPSG:4326", always_xy=True)

def convert_to_wgs84(x, y):
    """
    Convert WA State Plane North (ft) coordinates to WGS84 lat/lon.
    x = longitude-like value (eastings)
    y = latitude-like value (northings)
    Returns (lat, lon)
    """
    lon, lat = transformer.transform(x, y)
    return lat, lon
