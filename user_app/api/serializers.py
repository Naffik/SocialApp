from datetime import datetime

from django.contrib.auth import get_user_model
from django.core import exceptions
import django.contrib.auth.password_validation as validators
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from user_app.models import User, Action
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from friendship.models import FriendshipRequest, Follow, Block


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super(CustomTokenObtainPairSerializer, self).validate(attrs)
        data.update({'first_name': self.user.first_name})
        data.update({'last_name': self.user.last_name})
        data.update({'avatar': self.user.avatar.url})
        return data


class RegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)
    date_of_birth = serializers.DateTimeField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'date_of_birth']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_password(self, value):
        errors = dict()
        try:
            validators.validate_password(password=value)

        except exceptions.ValidationError as e:
            errors = list(e.messages)

        if errors:
            raise serializers.ValidationError(errors)

        return value

    def save(self):
        password = self.validated_data['password']
        password2 = self.validated_data['password2']
        date_of_birth = self.validated_data['date_of_birth']
        print(date_of_birth)

        if password != password2:
            raise ValidationError({'error': 'Password should be same as Password2'})

        if User.objects.filter(email=self.validated_data['email']).exists():
            raise ValidationError({'error': 'Email already exists'})

        if not date_of_birth:
            date_of_birth = datetime.now()
        account = User(email=self.validated_data['email'],
                       username=self.validated_data['username'],
                       display_name=self.validated_data['username'],
                       first_name=self.validated_data['first_name'],
                       last_name=self.validated_data['last_name'],
                       date_of_birth=date_of_birth)

        account.set_password(password)
        account.save()

        return account


class RequestPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(min_length=2)

    class Meta:
        fields = ('email', )

    def validate(self, attrs):
        email = attrs['data'].get('email', '')
        return super().validate(attrs)


class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(min_length=6, max_length=70, write_only=True)
    token = serializers.CharField(min_length=1, write_only=True)
    uidb64 = serializers.CharField(min_length=1, write_only=True)

    class Meta:
        fields = ('password', 'token', 'uidb64')

    def validate(self, attrs):
        try:
            password = attrs.get('password')
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')

            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed('The reset link is invalid', 401)

            user.set_password(password)
            user.save()
            return user
        except Exception as e:
            raise AuthenticationFailed('The reset link is invalid', 401)

        return super().validate(attrs)


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)
    username = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField('get_avatar_url')
    friends_count = serializers.IntegerField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    follows_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'display_name', 'email', 'first_name', 'last_name', 'date_of_birth', 'bio', 'avatar_url',
                  'friends_count', 'followers_count', 'follows_count')

    def get_avatar_url(self, obj):
        return obj.avatar.url


class BasicUserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    bio = serializers.CharField(read_only=True)
    avatar_url = serializers.SerializerMethodField('get_avatar_url', read_only=True)
    friends_count = serializers.IntegerField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    follows_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'display_name', 'bio', 'avatar_url', 'friends_count', 'followers_count', 'follows_count')

    def get_avatar_url(self, obj):
        return obj.avatar.url

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        print(type(instance.is_friend))
        if type(instance.is_friend) == bool:
            representation['is_friend'] = instance.is_friend
        if type(instance.follow) == bool:
            representation['follow'] = instance.follow
        return representation


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = '__all__'


class ChatUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('display_name', 'username', 'avatar')


class ActionSerializer(serializers.ModelSerializer):
    user__username = serializers.ReadOnlyField(source='user.username')
    target_ct__username = serializers.ReadOnlyField(source='target_ct.username')

    class Meta:
        model = Action
        fields = ('user__username', 'verb', 'target_ct__username')


class FriendSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    avatar = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'display_name', 'avatar', 'first_name', 'last_name')


class FriendshipRequestSerializer(serializers.ModelSerializer):
    to_user = serializers.CharField()
    from_user = serializers.StringRelatedField()

    class Meta:
        model = FriendshipRequest
        fields = ('id', 'from_user', 'to_user', 'message',
                  'created', 'rejected', 'viewed')
        extra_kwargs = {
            'from_user': {'read_only': True},
            'created': {'read_only': True},
            'rejected': {'read_only': True},
            'viewed': {'read_only': True},
        }


class FriendshipRequestResponseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()

    class Meta:
        model = FriendshipRequest
        fields = ('id',)


class FollowSerializer(serializers.ModelSerializer):
    followee = serializers.CharField()
    follower = serializers.StringRelatedField()

    class Meta:
        model = Follow
        fields = ('id', 'follower', 'followee', 'created')
        extra_kwargs = {
            'followee': {'read_only': True},
            'created': {'read_only': True},
        }


class BlockSerializer(serializers.ModelSerializer):
    blocked = serializers.CharField()
    blocker = serializers.StringRelatedField()

    class Meta:
        model = Block
        fields = ('id', 'blocker', 'blocked', 'created')
        extra_kwargs = {
            'blocked': {'read_only': True},
            'created': {'read_only': True},
        }
