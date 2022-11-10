from django.urls import path
from chat_app.api.views import ChatListView

urlpatterns = [
    path('', ChatListView.as_view(), name='chat-list'),
]
