from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from chat_app.models import ChatRoom
from chat_app.api.serializers import ChatRoomSerializer


class ChatListView(generics.ListAPIView):
    serializer_class = ChatRoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user.pk
        print(user)
        queryset = ChatRoom.objects.filter(member__pk=user)
        return queryset
