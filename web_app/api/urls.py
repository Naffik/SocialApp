from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (PostListView, PostDetailView, PostSearchView, PostCreateView, PostFavAddView, CommentListView,
                    CommentDetailView, PostCommentListView, CommentCreateView, PostFavListView, PopularTagsView, )

router = DefaultRouter()

urlpatterns = [
    path(r'post/', PostListView.as_view(), name='post-list'),
    path(r'post/search/', PostSearchView.as_view(), name='post-search'),
    path(r'post/create/', PostCreateView.as_view(), name='post-create'),
    path(r'post/fav/<str:username>/', PostFavListView.as_view(), name='list-users-fav-post'),
    path(r'post/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path(r'post/fav/', PostFavAddView.as_view(), name='post-fav-add-remove'),

    path(r'post/<int:pk>/comments/', PostCommentListView.as_view(), name='post-comment-list'),
    path(r'post/<int:pk>/create-comment/', CommentCreateView.as_view(), name='post-comment-create'),
    path(r'comment/', CommentListView.as_view(), name='comment-list'),
    path(r'comment/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    path(r'popular-tags/', PopularTagsView.as_view(), name='popular-tags'),
]
