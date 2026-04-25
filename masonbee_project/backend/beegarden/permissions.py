from beegarden.models import PrivateGardenAccess

def user_can_view_garden(user, garden):
    if garden.is_public:
        return True
    if garden.owner == user:
        return True
    return PrivateGardenAccess.objects.filter(garden=garden, user=user).exists()

def user_can_manage_garden(user, garden):
    if garden.owner == user:
        return True
    return PrivateGardenAccess.objects.filter(
        garden=garden,
        user=user,
        role="manager"
    ).exists()

def user_can_grant_access(user, garden):
    return user_can_manage_garden(user, garden)

def user_can_revoke_access(requesting_user, target_user, garden):
    if garden.owner == requesting_user:
        return True
    if requesting_user == target_user:
        return False
    return PrivateGardenAccess.objects.filter(
        garden=garden,
        user=requesting_user,
        role="manager"
    ).exists()
    
# -----------------------------
# Beehouse DRF permission class
# ----------------------------- 
    
    
from rest_framework.permissions import BasePermission, SAFE_METHODS

class BeehousePermission(BasePermission):
    """
    Public can read all beehouses (for prediction).
    Only authenticated users can create.
    Only the owner can update or delete.
    """

    def has_permission(self, request, view):
        # Allow public read-only access
        if request.method in SAFE_METHODS:
            return True

        # Write operations require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Public can read any object
        if request.method in SAFE_METHODS:
            return True

        # Only the owner can modify/delete
        return obj.owner == request.user
 