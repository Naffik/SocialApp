from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('api/', include('web_app.api.urls')),
    path('admin/', admin.site.urls),
    path('account/', include('user_app.api.urls')),
    path('chat/', include('chat_app.api.urls')),
    path('docs/', include_docs_urls(title='SocialApp')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
