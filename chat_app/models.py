from django.db import models
from user_app.models import User
from shortuuidfield import ShortUUIDField

TYPE_CHOICE = (
    ('DM', 'Direct Message'),
    ('GM', 'Group Message')
)


class ChatRoom(models.Model):
    chat_uuid = ShortUUIDField()
    type = models.CharField(max_length=10, choices=TYPE_CHOICE, default='DM')
    member = models.ManyToManyField(User)
    name = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return str(self.chat_uuid) + ' -> ' + str(self.name)


class ChatMessage(models.Model):
    chat = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    message = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message


def chat_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/chat_<uuid>/<filename>/
    return 'chat_{0}/{1}/'.format(instance.chat.chat_uuid, filename)


class ChatImage(models.Model):
    chat = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    image = models.ImageField(upload_to=chat_directory_path)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.image.name
