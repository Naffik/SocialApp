from django.db import models
from user_app.models import User
from taggit.managers import TaggableManager


class Post(models.Model):
    content = models.TextField(max_length=256, null=False, blank=False)
    post_author = models.ForeignKey(User, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    image = models.ImageField(upload_to='images/', null=True, blank=True, verbose_name="")
    number_of_comments = models.IntegerField(null=True, default=0)
    tags = TaggableManager()
    favorites = models.ManyToManyField(User, related_name="favorite", blank=True, default=None)

    def __str__(self):
        return self.content[:20]

    def get_total_like(self):
        return self.like.users.count()

    def get_total_favorites(self):
        return self.favorites.count()


class Like(models.Model):
    post = models.OneToOneField(Post, related_name='like', on_delete=models.CASCADE)
    users = models.ManyToManyField(User, related_name='post_likes')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.post.content[:20]


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    comment_author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment_author")
    created = models.DateTimeField(auto_now_add=True)
    update_time = models.DateTimeField(auto_now=True)
    content = models.TextField(max_length=2048)
    hidden = models.BooleanField(default=False)

    def __str__(self):
        return str(self.comment_author)

    class Meta:
        ordering = ['created']
