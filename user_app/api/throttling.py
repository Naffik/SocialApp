from rest_framework.throttling import UserRateThrottle


class UserProfileDetailThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        if request.user and request.user.is_authenticated:
            self.rate = '500/hour'
            self.scope = 'user-profile-detail-user'
        else:
            self.rate = '50/hour'
            self.scope = 'user-profile-detail-anon'
        return super().allow_request(request, view)