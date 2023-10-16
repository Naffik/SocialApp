import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from friendship.models import Friend

from chat_app.models import ChatRoom, ChatMessage
from user_app.models import Action


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


@receiver(post_save, sender=Action)
def channel_notification_signal(sender, instance,  created, **kwargs):
    """
    Send notification when action was taken.
    """
    username = instance.user.username
    notification_content = f'{instance.user.username} {instance.verb} {instance.target.username}'
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notification_{username}',
            {
                'type': 'send_notification',
                'notification_content': notification_content
            }
        )
    except Exception as e:
        raise Exception(f"Something went wrong in channel_list signal {e}")


@receiver(post_save, sender=Friend)
def create_chat_room_signal(sender, instance,  created, **kwargs):
    """
    Create chat room when user accept request.
    """
    if created:
        user_1 = instance.to_user
        user_2 = instance.from_user
        sorted_usernames = sorted([user_1.username, user_2.username])
        chat_name = "_and_".join(sorted_usernames)
        chat_room, created = ChatRoom.objects.get_or_create(name=chat_name)

        if created:
            chat_room.member.add(user_1, user_2)
