import re

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from web_app.models import Post, Comment

CREATE_POST_URL = reverse('post-create')
# DETAIL_POST_URL = reverse('post-detail', kwargs={'pk': 10})
DETAIL_POST_URL_NOT_FOUND = reverse('post-detail', kwargs={'pk': 9999})
SEARCH_POST_URL = reverse('post-search')
LIST_POST_URL = reverse('post-list')
ADD_REMOVE_POST_FAV_URL = reverse('post-fav-add-remove')
ADD_REMOVE_POST_FAV_URL_NOT_FOUND = reverse('post-fav-add-remove')

CREATE_COMMENT_URL = reverse('post-comment-create', kwargs={'pk': 1})
LIST_POSTS_COMMENTS_URL = reverse('post-comment-list', kwargs={'pk': 1})
LIST_COMMENTS_URL = reverse('comment-list')
DETAIL_COMMENT_URL = reverse('comment-detail', kwargs={'pk': 1})


class PostBaseTestCase(APITestCase):

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username='testcase',
            email='testcase@example.com',
            password='testcase')
        self.post1 = Post.objects.create(post_author=self.user, title='Test post 1', tags=['tag1', 'tag2'],
                                         content='Test content 1')
        self.post2 = Post.objects.create(post_author=self.user, title='Second test post', tags=['tag2', 'tag3'],
                                         content='Another test content 2')


class PostAPITests(PostBaseTestCase):

    def test_list_post(self):
        response = self.client.get(LIST_POST_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_get_post_detail_no_results(self):
        response = self.client.get(DETAIL_POST_URL_NOT_FOUND)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_post_detail(self):
        response = self.client.get(reverse('post-detail', kwargs={'pk': self.post1.pk}))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

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

    def test_add_user_to_post_fav(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(ADD_REMOVE_POST_FAV_URL, {'pk': self.post1.pk})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User added to post')
        self.assertTrue(self.user in self.post1.favourites.all())

    def test_remove_user_from_post_fav(self):
        self.post1.favourites.add(self.user)
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(ADD_REMOVE_POST_FAV_URL, {'pk': self.post1.pk})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User removed from post')
        self.assertFalse(self.user in self.post1.favourites.all())

    def test_add_user_to_post_fav_second_time(self):
        self.post1.favourites.add(self.user)
        self.client.force_authenticate(user=self.user)
        response = self.client.post(ADD_REMOVE_POST_FAV_URL, {'pk': self.post1.pk})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'An error has occurred')
        self.assertTrue(self.user in self.post1.favourites.all())

    def test_remove_user_to_post_fav_second_time(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(ADD_REMOVE_POST_FAV_URL, {'pk': self.post1.pk})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'An error has occurred')
        self.assertFalse(self.user in self.post1.favourites.all())

    def test_add_user_to_nonexistent_post_fav(self):
        expected_data = {
            'detail': 'Not found.'
        }
        self.client.force_authenticate(user=self.user)
        response = self.client.post(ADD_REMOVE_POST_FAV_URL_NOT_FOUND, {'pk': 9999})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json(), expected_data)

    def test_remove_user_from_nonexistent_post_fav(self):
        expected_data = {
            'detail': 'Not found.'
        }
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(ADD_REMOVE_POST_FAV_URL_NOT_FOUND, {'pk': 9999})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.json(), expected_data)


class CommentBaseTestCase(APITestCase):

    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='adminpassword',
            email='admin@example.com'
        )
        self.user = User.objects.create_user(
            username='testcase',
            email='testcase@example.com',
            password='testcase')
        self.post = Post.objects.create(post_author=self.user, title='Test post 1', tags=['tag1', 'tag2'],
                                        content='Test content')
        self.comment = Comment.objects.create(post=self.post, comment_author=self.user, content="Test")

    def test_list_comments_authorized(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(LIST_COMMENTS_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_comments_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(LIST_COMMENTS_URL)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
