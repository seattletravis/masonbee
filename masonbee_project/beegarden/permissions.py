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