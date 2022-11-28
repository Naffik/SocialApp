from rest_framework import generics
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from chat_app.api.permissions import IsChatUser
from chat_app.models import ChatRoom, ChatMessage
from chat_app.api.serializers import ChatRoomSerializer, ChatMessageSerializer


class ChatListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user.pk
        queryset = ChatRoom.objects.filter(member__pk=user)
        return queryset


class ChatImageUploadView(generics.CreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsChatUser]
    lookup_field = 'chat_uuid'

    def perform_create(self, serializer):
        chat = ChatRoom.objects.get(chat_uuid=self.kwargs.get('chat_uuid'))
        user = self.request.user
        serializer.save(chat=chat, user=user)


class ChatImageListView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    lookup_field = 'chat_uuid'

    def get_queryset(self):
        user = self.request.user.pk
        chat = get_object_or_404(ChatRoom, chat_uuid=self.kwargs.get('chat_uuid'), member=user)
        if chat:
            queryset = ChatMessage.objects.filter(chat=chat).exclude(image__isnull=True)
            return queryset
        else:
            return ChatMessage.objects.none()

