from django.contrib import admin
from web_app.models import Post, Comment, Like, DisLike
# Register your models here.
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(DisLike)