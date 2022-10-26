import re

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import django.core.mail

kwargs = {
    'username': 'testcase'
}

CREATE_USER_URL = reverse('register')
LOGIN_USER_URL = reverse('token_obtain_pair')
TOKEN_REFRESH_URL = reverse('token_refresh')
USER_PASSWORD_RESET_URL = reverse('request-password-reset')
USER_PASSWORD_RESET_COMPLETE = reverse('password-reset-complete')
USER_PROFILE_DETAIL = reverse('user-profile-detail', kwargs=kwargs)


class UsersManagersTests(TestCase):

    def test_create_user(self):
        User = get_user_model()
        user = User.objects.create_user(username='test', email='test@test.com', password='foo')
        self.assertEqual(user.email, 'test@test.com')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        with self.assertRaises(TypeError):
            User.objects.create_user()
        with self.assertRaises(TypeError):
            User.objects.create_user(email='')
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password="foo")

    def test_create_superuser(self):
        User = get_user_model()
        admin_user = User.objects.create_superuser(email='super@user.com', password='foo')
        self.assertEqual(admin_user.email, 'super@user.com')
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email='super@user.com', password='foo', is_superuser=False)


class BaseTestCase(APITestCase):

    def setUp(self):
        self.username = 'testcase'
        self.email = 'testcase@example.com'
        self.password = 'zaq1@WSX'
        User = get_user_model()
        self.user = User.objects.create_user(
            username=self.username,
            email=self.email,
            password=self.password)
        self.refresh = RefreshToken.for_user(self.user)
        self.data = {
            'email': self.email,
            'password': self.password
        }
        self.client = APIClient(enforce_csrf_checks=True)


class RegistrationTestCase(BaseTestCase):

    def test_register(self):
        data = {
            'username': 'register',
            'email': 'register@example.com',
            'password': 'zaq1@WSX',
            'password2': 'zaq1@WSX'
        }
        response = self.client.post(CREATE_USER_URL, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class UserAPITests(BaseTestCase):

    def test_jwt_login(self):
        response = self.client.post(LOGIN_USER_URL, self.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_jwt_token_refresh(self):
        res = self.client.post(LOGIN_USER_URL, self.data)
        data = {
            'refresh': res.data['refresh'],
        }
        response = self.client.post(TOKEN_REFRESH_URL, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(list(response.data.keys())[0], 'access')

    def test_jtw_invalid_refresh_token(self):
        data = {
            'refresh': 'token'
        }
        response = self.client.post(TOKEN_REFRESH_URL, data)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['detail'], 'Token is invalid or expired')
        self.assertEqual(response.data['code'], 'token_not_valid')

    def test_user_exists(self):
        data = {
            'username': self.username,
            'email': self.email,
            'password': self.password,
            'password2': self.password
        }
        response = self.client.post(CREATE_USER_URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['username'][0], 'A user with that username already exists.')

    def test_password_is_too_short(self):
        data = {
            'username': 'test_password',
            'email': 'test@password.com',
            'password': 'zsd@2',
            'password2': 'zsd@2'
        }
        response = self.client.post(CREATE_USER_URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['password'][0],
                         'This password is too short. It must contain at least 8 characters.')

    def test_password_is_too_common(self):
        data = {
            'username': 'test_password',
            'email': 'test@password.com',
            'password': 'admin123',
            'password2': 'admin123'
        }
        response = self.client.post(CREATE_USER_URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['password'][0], 'This password is too common.')

    def test_password_is_entirely_numeric(self):
        data = {
            'username': 'test_password',
            'email': 'test@password.com',
            'password': '4215553127',
            'password2': '4215553127'
        }
        response = self.client.post(CREATE_USER_URL, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['password'][0], 'This password is entirely numeric.')

    def test_user_password_reset_request(self):
        data = {
            'email': self.email
        }
        response = self.client.post(USER_PASSWORD_RESET_URL, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success'], 'Email to reset your password has been sent')

    def test_user_password_reset(self):
        data = {
            'email': self.email
        }
        response = self.client.post(USER_PASSWORD_RESET_URL, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        email_content = django.core.mail.outbox[0].body
        token_regex = r"\/account\/password-reset\/([A-Za-z0-9:\-]+)\/([A-Za-z0-9:\-]+)\/"
        match = re.search(token_regex, email_content)
        assert match.groups(), "Could not find the link in the email"
        response = self.client.get(match.group(0))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Credentials valid')

    def test_uset_password_reset_complete(self):
        data = {
            'email': self.email
        }
        response = self.client.post(USER_PASSWORD_RESET_URL, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        email_content = django.core.mail.outbox[0].body
        token_regex = r"\/account\/password-reset\/([A-Za-z0-9:\-]+)\/([A-Za-z0-9:\-]+)\/"
        match = re.search(token_regex, email_content)
        assert match.groups(), "Could not find the link in the email"
        response = self.client.get(match.group(0))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        uidb64 = match.group(1)
        token = match.group(2)
        data = {
            'password': 'newPassword@',
            'token': token,
            'uidb64': uidb64
        }
        response = self.client.patch(USER_PASSWORD_RESET_COMPLETE, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_user_details(self):
        response = self.client.get(USER_PROFILE_DETAIL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
