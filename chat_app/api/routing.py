from django.urls import re_path
from chat_app.api import consumers
from django.conf import settings
from django.conf.urls.static import static
from .channelsmiddleware import JwtAuthMiddlewareStack

websocket_urlpatterns = [
	re_path(r'c/(?P<chat_uuid>\w+)/$', consumers.ChatConsumer.as_asgi()),
	re_path(r'notifications/(?P<username>\w+)/$', consumers.NotificationConsumer.as_asgi()),
]
