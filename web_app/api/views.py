from django.db.models import Exists, OuterRef
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters, status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from user_app.models import User
from web_app.api.pagination import PostPagination
from web_app.api.permissions import IsPostUserOrReadOnly
from web_app.api.serializers import PostSerializer, PostCreateSerializer
from web_app.models import Post, Like


class PostList(generics.ListAPIView):
    """
    List view for post model
    """
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = PostPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            post = Post.objects.annotate(is_liked=Exists(Like.objects.filter(users=user, post=OuterRef('pk'))),
                                         is_favourite=Exists(Post.objects.filter(favourites=user))).order_by('pk')
        else:
            post = Post.objects.all().order_by('pk')
        return post


class PostCreate(generics.CreateAPIView):
    """
    Create new post with POST data

    - title
    - tags
    - content
    """
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        post_author = self.request.user
        serializer.save(post_author=post_author)


class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve/Update/Destroy ViewSet for Post model
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsPostUserOrReadOnly]

    def get_queryset(self, *args, **kwargs):
        user = self.request.user
        if user.is_authenticated:
            post = Post.objects.annotate(is_liked=Exists(Like.objects.filter(users=user, post=OuterRef('pk'))),
                                         is_favourite=Exists(Post.objects.filter(favourites=user)))
        else:
            post = Post.objects.filter(pk=self.request.get('pk'))
        return post

    def perform_destroy(self, instance):
        instance.image.delete()
        instance.delete()

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        response = super(PostDetail, self).update(request, pk=pk)
        return response

    def perform_update(self, serializer):
        post = Post.objects.filter(slug=self.kwargs.get('slug'))
        try:
            post.image.delete()
        except FileNotFoundError:
            pass
        serializer.save()


class PostSearch(generics.ListAPIView):
    """
    Search list of post model
    """
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = PostPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['post_author__username', 'title', 'content']
    search_fields = ['^title']
    ordering_fields = ['title', 'created', 'like']

    def get_queryset(self, *args, **kwargs):
        my_tags = []
        tags = self.request.data.get('tags')
        if tags is not None:
            for x in tags.split(','):
                my_tags.append(x)
            queryset = Post.objects.filter(tags__name__in=my_tags)
        else:
            queryset = Post.objects.all()

        return queryset.order_by('created')


class PostFavAdd(APIView):
    """
    Add or remove a post to the favorites
    """
    permission_classes = [IsAuthenticated]
    bad_request_message = 'An error has occurred'

    def post(self, request):
        post = get_object_or_404(Post, pk=request.data.get('pk'))
        user = self.request.user
        if user not in post.favourites.all():
            post.favourites.add(user)
            return Response({'detail': 'User added to post'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        post = get_object_or_404(Post, pk=request.data.get('pk'))
        user = self.request.user
        if user in post.favourites.all():
            post.favourites.remove(user)
            return Response({'detail': 'User removed from post'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)

