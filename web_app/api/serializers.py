from web_app.models import Post, Comment
from rest_framework import serializers
from taggit.serializers import (TagListSerializerField,
                                TaggitSerializer)


class CommentSerializer(serializers.ModelSerializer):
    comment_author = serializers.StringRelatedField(read_only=True)
    post = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        # exclude = ('post',)
        fields = "__all__"


class PostSerializer(TaggitSerializer, serializers.ModelSerializer):
    # comments = CommentSerializer(many=True, read_only=True)
    tags = TagListSerializerField()
    post_author = serializers.StringRelatedField(read_only=True)
    likes = serializers.SerializerMethodField(read_only=True)
    dislikes = serializers.SerializerMethodField(read_only=True)

    is_liked = serializers.BooleanField(read_only=True)
    is_disliked = serializers.BooleanField(read_only=True)
    is_favourite = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        # exclude = ('number_of_comments',)
        # fields = "__all__"
        fields = ['id', 'tags', 'post_author.username', 'title', 'slug', 'created', 'image', 'status', 'favourites',
                  'likes', 'dislikes', 'is_liked', 'is_disliked', 'is_favourite']

    def get_likes(self, instance):
        return instance.get_total_like()

    def get_dislikes(self, instance):
        return instance.get_total_dislike()

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            representation['image'] = instance.image.url
        else:
            representation.pop('image', None)
        return representation


class PostCreateSerializer(TaggitSerializer, serializers.ModelSerializer):
    tags = TagListSerializerField()
    post_author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Post
        exclude = ('number_of_comments', 'favourites')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['post_author'] = instance.post_author.username
        if instance.image:
            representation['image'] = instance.image.url
        else:
            representation.pop('image', None)
        return representation


class PostFavSerializer(serializers.ModelSerializer):

    class Meta:
        model = Post
        exclude = ('status', 'favourites', 'number_of_comments', )
