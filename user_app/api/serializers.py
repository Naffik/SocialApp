from django.contrib.auth import get_user_model
from django.core import exceptions
import django.contrib.auth.password_validation as validators
from user_app.models import User
from rest_framework import serializers
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from friendship.models import FriendshipRequest, Follow, Block


class RegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']
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

        if password != password2:
            raise ValidationError({'error': 'Password should be same as Password2'})

        if User.objects.filter(email=self.validated_data['email']).exists():
            raise ValidationError({'error': 'Email already exists'})

        account = User(email=self.validated_data['email'],
                       username=self.validated_data['username'],
                       display_name=self.validated_data['username'])

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
    # followers = serializers.SerializerMethodField(read_only=True)
    # follows = serializers.SerializerMethodField(read_only=True)
    friends_count = serializers.IntegerField(read_only=True)
    followers_count = serializers.IntegerField(read_only=True)
    follows_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'display_name', 'email', 'first_name', 'last_name', 'date_of_birth', 'bio', 'avatar',
                  'friends_count', 'followers_count', 'follows_count')

    # def get_follows(self, instance):
    #     return instance.get_total_follows()
    #
    # def get_followers(self, instance):
    #     return instance.get_total_followers()

    def get_friends(self, instance):
        return instance.get_total_friends()


class BasicUserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(read_only=True)
    followers = serializers.SerializerMethodField(read_only=True)
    follows = serializers.SerializerMethodField(read_only=True)
    friends = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('username', 'display_name', 'bio', 'avatar', 'followers', 'follows', 'friends')

    def get_follows(self, instance):
        return instance.follows_count()

    def get_followers(self, instance):
        return instance.followers_count()

    def get_friends(self, instance):
        return instance.friends_count()


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = '__all__'


class ChatUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('display_name', 'username', 'avatar')


class FriendSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = get_user_model()
        fields = ('friend',)

    def get_friend(self, obj):
        user_serializer = BasicUserProfileSerializer(obj)
        return user_serializer.data


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
