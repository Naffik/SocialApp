from django.contrib.auth.models import AbstractUser
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db import models
from django.utils.translation import gettext_lazy as _
from user_app.api.managers import CustomUserManager
from friendship.models import Friend, Follow, Block


class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    display_name = models.CharField(max_length=255, null=True, blank=True)
    first_name = models.CharField(max_length=32, null=False, blank=False)
    last_name = models.CharField(max_length=32, null=False, blank=False)
    date_of_birth = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    bio = models.CharField(max_length=512, blank=True, null=True)
    avatar = models.ImageField(upload_to='profile_images/', blank=True, default='profile_images/default.jpg')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.username

    def friends_count(self):
        return Friend.objects.filter(to_user=self.pk).count()

    def followers_count(self):
        return Follow.objects.filter(followee=self.pk).count()

    def follows_count(self):
        return Follow.objects.filter(follower=self.pk).count()


class OnlineUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username


class Action(models.Model):
    user = models.ForeignKey(User, related_name='actions', db_index=True, on_delete=models.CASCADE)
    verb = models.CharField(max_length=255)
    target_ct = models.ForeignKey(ContentType, blank=True, null=True, related_name='target_obj',
                                  on_delete=models.CASCADE)
    target_id = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    target = GenericForeignKey('target_ct', 'target_id')
    created = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ('-created',)
