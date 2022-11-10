from django.urls import re_path
from chat_app.api import consumers
from django.conf import settings
from django.conf.urls.static import static
from .channelsmiddleware import JwtAuthMiddlewareStack

websocket_urlpatterns = [
	re_path(r'c/(?P<chat_uuid>\w+)/$', consumers.ChatConsumer.as_asgi()),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
