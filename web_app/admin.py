from django.contrib import admin
from web_app.models import Post, Comment, Like


class CommentInLine(admin.StackedInline):
    model = Comment


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'post_author']
    list_filter = ['created']
    search_fields = ['content']


@admin.register(Comment)
class Comment(admin.ModelAdmin):
    list_display = ['id', 'comment_author', 'post', 'content']
    list_filter = ['post']


admin.site.register(Like)
