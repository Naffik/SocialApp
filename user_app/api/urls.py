from django.urls import path
from .views import (RegisterView, VerifyEmail, RequestPasswordResetView, PasswordTokenCheckView, SetNewPasswordView,
                    UserProfileDetailView, FriendViewSet, UserListView, CustomTokenObtainPairView,
                    CustomTokenRefreshView)
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework import routers
import pprint

router = routers.DefaultRouter()
router.register('friends', FriendViewSet, 'friend'),

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('email-verify/', VerifyEmail.as_view(), name='email-verify'),
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('password-reset/<uidb64>/<token>/', PasswordTokenCheckView.as_view(), name='password-reset'),
    path('password-reset-complete/', SetNewPasswordView.as_view(), name='password-reset-complete'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/<str:username>/', UserProfileDetailView.as_view(), name='user-profile-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
]

urlpatterns += router.urls
