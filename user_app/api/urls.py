from django.urls import path
from .views import (RegisterView, VerifyEmail, RequestPasswordResetView, PasswordTokenCheckView, SetNewPasswordView)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('email-verify/', VerifyEmail.as_view(), name='email-verify'),
    path('request-password-reset/', RequestPasswordResetView.as_view(), name='request-password-reset'),
    path('password-reset/<uidb64>/<token>/', PasswordTokenCheckView.as_view(), name='password-reset'),
    path('password-reset-complete/', SetNewPasswordView.as_view(), name='password-reset-complete'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
