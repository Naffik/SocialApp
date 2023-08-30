from web_app.models import Post, Comment
from rest_framework import serializers
from taggit.serializers import (TagListSerializerField, TaggitSerializer)


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
    display_name = serializers.StringRelatedField(read_only=True)
    post_author_avatar = serializers.SerializerMethodField(read_only=True)
    likes = serializers.SerializerMethodField(read_only=True)
    is_liked = serializers.BooleanField(read_only=True)
    is_favorite = serializers.BooleanField(read_only=True)

    class Meta:
        model = Post
        # exclude = ('number_of_comments',)
        # fields = "__all__"
        fields = ['id', 'tags', 'post_author', 'post_author_avatar', 'display_name', 'content', 'created', 'image',
                  'favorites', 'likes', 'is_liked', 'is_favorite', 'number_of_comments']

    def get_likes(self, instance):
        return instance.get_total_like()

    def get_display_name(self, instance):
        return instance.post_author.display_name

    def get_post_author_avatar(self, instance):
        return instance.post_author.avatar.url

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['post_author'] = instance.post_author.username
        representation['display_name'] = self.get_display_name(instance)
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
        exclude = ('number_of_comments', 'favorites')

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['post_author'] = instance.post_author.username
        if instance.image:
            representation['image'] = instance.image.url
        else:
            representation.pop('image', None)
        return representation


class PostFavSerializer(PostSerializer):

    class Meta:
        model = Post
        exclude = ('favorites',)
        