from django.db import models
from user_app.models import User
from shortuuidfield import ShortUUIDField

def chat_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/chat_<uuid>/<filename>/
    return 'chat_{0}/{1}'.format(instance.chat.chat_uuid, filename)


class ChatRoom(models.Model):
    chat_uuid = ShortUUIDField()
    member = models.ManyToManyField(User)
    name = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return str(self.chat_uuid) + ' -> ' + str(self.name)


class ChatMessage(models.Model):
    chat = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    message = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to=chat_directory_path, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    delivered = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    delivered_timestamp = models.DateTimeField(null=True, blank=True)
    read_timestamp = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.message

    def get_last_message(self):
        return self

#
# class ChatImage(models.Model):
#     chat = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, null=True)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
#     image = models.ImageField(upload_to=chat_directory_path)
#     timestamp = models.DateTimeField(auto_now_add=True)
#
#     def __str__(self):
#         return self.image.name
