import re

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from web_app.models import Post

CREATE_POST_URL = reverse('post-create')
DETAIL_POST_URL = reverse('post-detail', kwargs={'pk': 1})
SEARCH_POST_URL = reverse('post-search')
LIST_POST_URL = reverse('post-list')


class BaseTestCase(APITestCase):

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='testcase',
            email='testcase@example.com',
            password='testcase')
        Post.objects.create(post_author=self.user, title='Test post 1', tags=['tag1', 'tag2'],
                            content='Test content 1')
        Post.objects.create(post_author=self.user, title='Second test post', tags=['tag2', 'tag3'],
                            content='Another test content 2')
        self.client = APIClient(enforce_csrf_checks=True)


class PostAPITests(BaseTestCase):

    def test_post_list(self):
        response = self.client.get(LIST_POST_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_create_post_unauthorized(self):
        data = {
            'title': 'Test title',
            'tags': ['tag1', 'tag2'],
            'content': 'Post content'
        }

        response = self.client.post(CREATE_POST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Post.objects.count(), 2)

    def test_create_post_authorized(self):
        self.client.force_authenticate(self.user)
        data = {
            'title': 'Test title',
            'tags': ['tag1', 'tag2'],
            'content': 'Test content'
        }

        response = self.client.post(CREATE_POST_URL, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 3)

    def test_search_by_title(self):
        response = self.client.get(SEARCH_POST_URL, {'title': 'Test post 1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test post 1')

    def test_search_by_content(self):
        response = self.client.get(SEARCH_POST_URL, {'content': 'Test content 1'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['content'], 'Test content 1')

    def test_search_by_tags(self):
        response = self.client.get(SEARCH_POST_URL, {'tags': 'tag2'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_search_no_results(self):
        response = self.client.get(SEARCH_POST_URL, {'title': 'non_existent_text'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_get_post_detail_no_results(self):
        response = self.client.get(DETAIL_POST_URL, kwargs={'pk': 9999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # def test_get_post_detail(self):
    #     response = self.client.get(DETAIL_POST_URL)
    #     self.assertEqual(response.status_code, status.HTTP_200_OK)
