from django.utils import timezone

import redis
from django.db.models import Exists, OuterRef
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters, status
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from taggit.serializers import TaggitSerializer

from user_app.models import User
from web_app.api.pagination import PostPagination
from web_app.api.permissions import IsPostUserOrReadOnly, IsCommentUserOrReadOnly
from web_app.api.serializers import PostSerializer, PostCreateSerializer, CommentSerializer, PostFavSerializer
from web_app.models import Post, Like, Comment
from friendship.models import Friend, Follow, Block


redis_instance = redis.StrictRedis(host='localhost', port=6379, db=0)


class PostListView(generics.ListAPIView):
    """
    List view for post model
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination

    def get_queryset(self):
        user = self.request.user
        cache_key = f"post_list:{user.id if user.is_authenticated else 'anonymous'}"
        cached_data = cache.get(cache_key)

        if cached_data:
            return cached_data
        else:
            if user.is_authenticated:
                blocked = Block.objects.blocking(user=user)
                posts = Post.objects.exclude(post_author__in=blocked)\
                    .annotate(is_liked=Exists(Like.objects.filter(users=user, post=OuterRef('pk'))),
                              is_favorite=Exists(Post.objects.filter(favorites=user))).order_by('-created')
            else:
                posts = Post.objects.all().order_by('-created')

            cache.set(cache_key, posts, 1)
            return posts


class PostCreateView(generics.CreateAPIView):
    """
    Create new post with POST data

    - tags
    - content
    """
    serializer_class = PostCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        post_author = self.request.user
        serializer.save(post_author=post_author)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
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
                                         is_favorite=Exists(Post.objects.filter(favorites=user)))
        else:
            post = Post.objects.filter(pk=self.kwargs.get('pk'))
        return post

    def perform_destroy(self, instance):
        instance.image.delete()
        instance.delete()

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get('pk')
        response = super(PostDetailView, self).update(request, pk=pk)
        return response

    def perform_update(self, serializer):
        post = Post.objects.filter(slug=self.kwargs.get('slug'))
        try:
            post.image.delete()
        except FileNotFoundError:
            pass
        serializer.save()


class PostSearchView(generics.ListAPIView):
    """
    Search list of post model
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
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


class PostFavAddView(APIView):
    """
    Add or remove a post to the favorites
    """
    permission_classes = [IsAuthenticated]
    bad_request_message = 'An error has occurred'

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = self.request.user
        if user not in post.favorites.all():
            post.favorites.add(user)
            return Response({'detail': 'User added to post'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = self.request.user
        if user in post.favorites.all():
            post.favorites.remove(user)
            return Response({'detail': 'User removed from post'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)


class PostLikeAddView(APIView):
    """
    Add or remove a like
    """
    permission_classes = [IsAuthenticated]
    bad_request_message = 'An error has occurred'

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = self.request.user
        like = Like.objects.get(post=post)
        if not like.users.filter(username=user):
            like.users.add(user)
            return Response({'detail': 'User added like'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        user = self.request.user
        like = Like.objects.get(post=post)
        if like.users.filter(username=user):
            like.users.remove(user)
            return Response({'detail': 'User removed like'}, status=status.HTTP_200_OK)
        return Response({'detail': self.bad_request_message}, status=status.HTTP_400_BAD_REQUEST)


class PostFavListView(generics.ListAPIView):
    """
    List of request user posts added to favorites
    """
    serializer_class = PostFavSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination
    lookup_field = 'user__username'

    def get_queryset(self, *args, **kwargs):
        username = self.kwargs.get('username')
        user = self.request.user
        if user.username != username:
            return Post.objects.none()
        return Post.objects.filter(favorites=user)

    def list(self, request, *args, **kwargs):
        username = self.kwargs.get('username')
        user = self.request.user
        if user.username != username:
            return Response({'detail': 'Permissions denied'}, status=status.HTTP_400_BAD_REQUEST)
        return super(PostFavListView, self).list(request, *args, **kwargs)


class PostMediaListView(generics.ListAPIView):
    """
    List of request user posts added to favorites
    """
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PostPagination

    def get_queryset(self, *args, **kwargs):
        username = self.kwargs.get('username')
        media = Post.objects.filter(post_author__username=username).exclude(image="")
        return media


class CommentListView(generics.ListAPIView):
    """
    List view for Comment model
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAdminUser]
    pagination_class = PostPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['comment_author__username', 'post__id']

    # def get_queryset(self):
    #     user = self.request.user
    #     print(user)
    #     if user.is_authenticated:
    #         comments = Comment.objects.exclude(comment_author__in=blocked)
    #     else:
    #         comments = Comment.objects.all()
    #     return comments


class UserCommentListView(generics.ListAPIView):
    """
    List view for Comment model for given user
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PostPagination

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            comments = Comment.objects.filter(comment_author=user)\
                .annotate(is_liked=Exists(Like.objects.filter(users=user, post=OuterRef('pk'))),
                          is_favorite=Exists(Post.objects.filter(favorites=user))).order_by('-created')
        else:
            comments = Comment.objects.all()
        return comments


class CommentCreateView(generics.CreateAPIView):
    """
    Create new comment with POST data

    - id
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        pk = self.kwargs.get('pk')
        post = Post.objects.get(pk=pk)
        comment_user = self.request.user
        post.number_of_comments = post.number_of_comments + 1
        post.save()

        serializer.save(post=post, comment_author=comment_user)


class PostCommentListView(generics.ListAPIView):
    """
    List view for Post's comments
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PostPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['comment_author__username', 'post__content']

    def get_queryset(self, *args, **kwargs):
        pk = self.kwargs.get('pk')
        user = self.request.user
        if user.is_authenticated:
            blocked = Block.objects.blocking(user=user)
            comments = Comment.objects.exclude(comment_author__in=blocked).filter(post=pk)
        else:
            comments = Comment.objects.filter(post=pk)
        return comments


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve/Update/Destroy ViewSet for Comment model
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsCommentUserOrReadOnly]

    def perform_destroy(self, instance):
        post = Post.objects.get(pk=instance.post.pk)
        post.number_of_comments = post.number_of_comments - 1
        post.save()
        instance.delete()


class PopularTagsView(APIView):
    """
    List of most popular tags
    """

    def get(self, request, *args, **kwargs):
        tags_count = request.query_params.get('tags_count')
        time_in_hours = request.query_params.get('time_in_hours')
        if not time_in_hours:
            time_in_hours = 1
        time_delta = timezone.now() - timezone.timedelta(days=time_in_hours)

        recent_posts = Post.objects.filter(created__gte=time_delta)

        tag_count = {}
        for post in recent_posts:
            for tag in post.tags.all():
                tag_count[tag.name] = tag_count.get(tag.name, 0) + 1

        sorted_tags = sorted(tag_count.items(), key=lambda x: x[1], reverse=True)

        popular_tags = [tag[0] for tag in sorted_tags[:tags_count]]

        return Response({'popular_tags': popular_tags})
