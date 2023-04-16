from rest_framework import serializers
from chat_app.models import ChatRoom, ChatMessage
from user_app.api.serializers import ChatUserSerializer


class ChatRoomSerializer(serializers.ModelSerializer):
    member = ChatUserSerializer(many=True, read_only=True)
    members = serializers.ListField(write_only=True)

    class Meta:
        model = ChatRoom
        exclude = ['id']


class ChatMessageSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        exclude = ['id', 'chat']

    @staticmethod
    def get_username(obj):
        return obj.user.username
