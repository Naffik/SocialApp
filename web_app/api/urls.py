from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (PostList, PostDetail, PostSearch, PostCreate, )

router = DefaultRouter()

urlpatterns = [
    path(r'post/', PostList.as_view(), name='post-list'),
    path(r'post/<int:pk>/', PostDetail.as_view(), name='post-detail'),
    path(r'post/search/', PostSearch.as_view(), name='post-search'),
    path(r'post/create/', PostCreate.as_view(), name='post-create')
]