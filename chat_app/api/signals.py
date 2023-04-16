import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from chat_app.models import ChatRoom, ChatMessage


@receiver(post_save, sender=ChatMessage)
def channel_list_signal(sender, instance,  created, **kwargs):
    """
    Send messages to the chat when image is uploaded.
    """
    if instance.image:
        result = [{
            'pk': instance.pk,
            'user': instance.user.pk,
            'avatar': instance.user.avatar.url,
            'message': instance.message,
            'username': instance.user.username,
            'image': instance.image.url,
            'timestamp': str(instance.timestamp)
        }]
        try:
            channel_layer = get_channel_layer()
            chat_room = ChatRoom.objects.get(pk=instance.chat.id)

            async_to_sync(channel_layer.group_send)(
                chat_room.chat_uuid,
                {
                    'type': 'chat.message',
                    'message': result
                })
        except Exception as e:
            raise Exception(f"Something went wrong in channel_list signal {e}")


@receiver(post_delete, sender=ChatMessage)
def auto_delete_image_on_delete(sender, instance, **kwargs):
    """
    Deletes image from system
    when corresponding `ImageField` object is deleted.
    """
    if instance.image:
        if os.path.isfile(instance.image.path):
            os.remove(instance.image.path)


@receiver(pre_save, sender=ChatMessage)
def auto_delete_image_on_change(sender, instance, **kwargs):
    """
    Deletes old image from system
    when corresponding `ImageField` object is updated
    with new image.
    """
    if not instance.pk:
        return False

    try:
        old_image = ChatMessage.objects.get(pk=instance.pk).image
    except ChatMessage.DoesNotExist:
        return False

    new_image = instance.image
    if not old_image == new_image:
        if os.path.isfile(old_image.path):
            os.remove(old_image.path)
