from django.db.models import Exists, OuterRef
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.permissions import AllowAny, IsAuthenticated

from web_app.api.pagination import PostPagination
from web_app.api.permissions import IsPostUserOrReadOnly
from web_app.api.serializers import PostSerializer, PostCreateSerializer
from web_app.models import Post, Like


class PostList(generics.ListAPIView):
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
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        post_author = self.request.user
        serializer.save(post_author=post_author)


class PostDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsPostUserOrReadOnly]

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
    serializer_class = PostSerializer
    permission_classes = [AllowAny]
    pagination_class = PostPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['post_author__username', 'title', 'tags']
    search_fields = ['^title']
    ordering_fields = ['title', 'created', 'like']

    def get_queryset(self, *args, **kwargs):
        my_tags = []
        tags = self.request.data.get('tags')
        if tags is not None:
            for x in tags.split(','):
                my_tags.append(x)
            qs = Post.objects.filter(tags__name__in=my_tags)
        else:
            qs = Post.objects.all()

        return qs