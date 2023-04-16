from django.urls import path
from chat_app.api.views import ChatListView, ChatImageUploadView, ChatImageListView

urlpatterns = [
    path('', ChatListView.as_view(), name='chat-list'),
    path('u/<str:chat_uuid>/', ChatImageUploadView.as_view(), name='chat-image-upload'),
    path('l/<str:chat_uuid>/', ChatImageListView.as_view(), name='chat-image-list'),
]
