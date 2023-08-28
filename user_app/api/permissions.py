from rest_framework import permissions


class IsAdminOrReadOnly(permissions.IsAdminUser):
    """
    Checks whether the user is admin or read only
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        else:
            return bool(request.user and request.user.is_staff)


class IsProfileUserOrReadOnly(permissions.BasePermission):
    """
    Checks whether the user is a user profile owner or read only
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        else:
            return bool(obj == request.user or request.user.is_staff)


class IsProfileUser(permissions.BasePermission):
    """
    Checks whether the user is a user profile owner
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return bool(obj == request.user or request.user.is_staff)
        else:
            return bool(obj == request.user or request.user.is_staff)
