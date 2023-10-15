import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from rest_framework.generics import get_object_or_404

from chat_app.api.redis_utils import add_online_user, remove_online_user, get_online_users
from user_app.models import User
from chat_app.models import ChatRoom, ChatMessage
from friendship.models import Friend

CHAT_MESSAGE_TYPE = 'chat.message'
DEFAULT_PAGINATION = {"start": "0", "end": "50"}
logger = logging.getLogger('django')


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.is_member = None
        self.chat_uuid = None
        self.user_room = None
        self.user = None

    def get_from_cache_or_db(self, cache_key, db_query_method, *args, **kwargs):
        try:
            cached_data = cache.get(cache_key)
        except Exception as e:
            logger.error(f"Failed to fetch from cache: {e}")
            cached_data = None
        if not cached_data:
            try:
                cached_data = db_query_method(*args, **kwargs)
            except Exception as e:
                logger.error(f"Database error {e}")
                return None
            try:
                cache.set(cache_key, cached_data)
            except Exception as e:
                logger.error(f"Failed to set cache key {e}")
        return cached_data

    def is_user_in_chat_room(self, chat_uuid, user_pk):
        return ChatRoom.objects.filter(member=user_pk).filter(chat_uuid=chat_uuid).exists()

    def get_user_pk(self, user):
        user = User.objects.get(username=user)
        user_pk = user.pk
        return user_pk

    def get_chats(self):
        chats = ChatRoom.objects.filter(member=self.user.pk)
        return [chat.chat_uuid for chat in chats]

    def get_online_friends(self):
        online_users = list(map(int, get_online_users()))
        friends = list(Friend.objects.filter(from_user=self.user).filter(to_user__in=online_users)
                       .values_list('to_user', flat=True))
        return friends

    def save_message(self, message, user_pk, chat_uuid):
        user_obj = self.get_from_cache_or_db(f"user_{user_pk}", User.objects.get, pk=user_pk)
        chat_obj = self.get_from_cache_or_db(f"chat_{chat_uuid}", ChatRoom.objects.get, chat_uuid=chat_uuid)

        message_obj = ChatMessage.objects.create(chat=chat_obj, user=user_obj, message=message)
        return {
            'pk': message_obj.pk,
            'user': user_pk,
            'avatar': user_obj.avatar.url,
            'message': message,
            'username': user_obj.username,
            'timestamp': str(message_obj.timestamp)
        }

    def get_last_message(self):
        message = ChatMessage.objects.all().order_by('timestamp')[-1:][0]
        message = self.messages_to_json(message)
        chat_message = {
            'type': 'chat.message',
            'message': message
        }
        return chat_message

    def get_previous_messages(self, text_data):
        text_data_json = json.loads(text_data)
        start = int(text_data_json['start'])
        end = int(text_data_json['end'])
        messages = ChatMessage.objects.all().order_by('timestamp')[start:end]
        messages = self.messages_to_json(messages)
        chat_message = {
            'type': 'chat.message',
            'message': messages
        }
        return chat_message

    def messages_to_json(self, messages):
        result = []
        for message in messages:
            message_data = {
                'pk': str(message.pk),
                'user': message.user.username,
                'avatar': message.user.avatar.url,
                'message': message.message,
                'timestamp': str(message.timestamp)
            }
            if message.image:
                message_data['image'] = message.image.url
            result.append(message_data)
        return result

    async def send_chats_list(self):
        chats_list = await database_sync_to_async(self.get_chats)()
        chat_message = {
            'type': 'chat.message',
            'message': {
                'action': 'chats',
                'chat_list': chats_list
            }
        }
        await self.channel_layer.send(self.channel_name, chat_message)

    async def send_online_user_list(self):
        online_user_list = list(map(int, get_online_users()))
        chat_message = {
            'type': 'chat.message',
            'message': {
                'action': 'online_user',
                'user_list': online_user_list
            }
        }
        await self.channel_layer.group_send('online_user', chat_message)

    async def send_online_friends_list(self):
        online_friends_list = await database_sync_to_async(self.get_online_friends)()
        chat_message = {
            'type': 'chat.message',
            'message': {
                'action': 'online_friends',
                'friend_list': online_friends_list
            }
        }
        await self.channel_layer.group_send('online_friends', chat_message)

    async def connect(self):
        self.user = self.scope['user']
        self.chat_uuid = self.scope["url_route"]["kwargs"]["chat_uuid"]
        self.user_room = await database_sync_to_async(list)(ChatRoom.objects.filter(member=self.user.pk))
        self.is_member = await database_sync_to_async(self.is_user_in_chat_room)(self.chat_uuid, self.user.pk)

        for room in self.user_room:
            await self.channel_layer.group_add(room.chat_uuid, self.channel_name)

        await self.channel_layer.group_add('online_user', self.channel_name)
        await self.channel_layer.group_add('online_friends', self.channel_name)
        add_online_user(self.user.pk)
        await self.send_online_friends_list()

        if self.is_member:
            previous_messages = await database_sync_to_async(self.get_previous_messages)(json.dumps(DEFAULT_PAGINATION))
            await self.channel_layer.send(
                self.channel_name,
                {
                    'type': CHAT_MESSAGE_TYPE,
                    'message': previous_messages
                }
            )
        else:
            await self.channel_layer.send(
                self.channel_name,
                {
                    'type': CHAT_MESSAGE_TYPE,
                    'message': {
                        'detail': 'User is not a member of the chat.'
                    }
                }
            )

        await self.accept()

    async def disconnect(self, close_code):
        remove_online_user(self.user.pk)
        await self.send_online_friends_list()
        for room in self.user_room:
            await self.channel_layer.group_discard(
                room.chat_uuid,
                self.channel_name
            )

    async def receive(self, text_data=None, bytes_data=None):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        chat_message = {}
        if self.is_member:
            if action == 'message':
                message = text_data_json['message']
                chat_message = await database_sync_to_async(
                    self.save_message
                )(message, self.user.pk, self.chat_uuid)
            elif action == 'typing':
                chat_message = text_data_json
            elif action == 'previous':
                chat_message = await database_sync_to_async(
                    self.get_previous_messages
                )(text_data)
                await self.channel_layer.send(
                    self.channel_name,
                    {
                        'type': 'chat.message',
                        'message': chat_message
                    }
                )
            await self.channel_layer.group_send(
                self.chat_uuid,
                {
                    'type': 'chat.message',
                    'message': chat_message
                }
            )
        else:
            await self.channel_layer.send(
                self.channel_name,
                {
                    'type': 'chat.message',
                    'message': {
                        'detail': 'User is not a member of this chat.'
                    }
                }
            )

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))


class NotificationConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_group_name = None
        self.room_name = None

    async def connect(self):
        self.room_name = self.scope['user'].username
        self.room_group_name = f'notification_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def send_notification(self, event):
        notification_content = event['notification_content']

        await self.send(text_data=json.dumps({
            'notification_content': notification_content
        }))
