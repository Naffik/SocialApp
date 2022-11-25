from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver
from chat_app.models import ChatRoom, ChatMessage


@receiver(post_save, sender=ChatMessage)
def channel_list_signal(sender, instance,  created, **kwargs):
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

