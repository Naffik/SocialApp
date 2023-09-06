from django.db.models import Count, Exists
from django.http import Http404
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from user_app.models import User, Action
from user_app.api.serializers import (RegistrationSerializer, RequestPasswordResetSerializer, SetNewPasswordSerializer,
                                      UserProfileSerializer, BasicUserProfileSerializer, FollowSerializer,
                                      UserSerializer, BlockSerializer, FriendSerializer,
                                      CustomTokenObtainPairSerializer, ActionSerializer)
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings
import jwt
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse

from .pagination import PostPagination
from .permissions import IsProfileUserOrReadOnly
from .throttling import UserProfileDetailThrottle
from .utils import Util, create_action
from friendship.models import Friend, FriendshipRequest, Follow, Block
from friendship.exceptions import AlreadyExistsError, AlreadyFriendsError
from user_app.api.serializers import FriendshipRequestSerializer, FriendshipRequestResponseSerializer\



class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_scope = 'token_obtain_pair'
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    throttle_scope = 'token_refresh'


class RegisterView(generics.GenericAPIView):
    """
    Create new user with POST data

    - username
    - email
    - password
    - password2
    - first_name
    - last_name
    - date_of_birth
    """
    serializer_class = RegistrationSerializer
    throttle_scope = 'register'

    def post(self, request):
        user = request.data
        serializer = self.serializer_class(data=user)
        print(self.request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user_data = serializer.data

        user = User.objects.get(username=user_data['username'])

        token = RefreshToken.for_user(user).access_token

        current_site = get_current_site(request).domain
        relative_link = reverse('email-verify')
        abs_url = 'http://' + current_site + relative_link + "?token=" + str(token)
        email_body = 'Hi ' + user.username + ' please verify your email address using below link \n' + abs_url
        data = {
            'email_body': email_body,
            'email_subject': 'Verify your email address',
            'mail_to': user_data['email']
        }
        # Util.send_email(data)

        return Response(user_data, status=status.HTTP_201_CREATED)


class CheckUsernameView(APIView):
    """
    Check whether a username is available
    """

    def get(self, request, *args, **kwargs):
        username = request.data.get('username')
        if not username:
            return Response({'message': 'Username cannot be empty'})
        if not User.objects.filter(username__exact=username).exists():
            return Response({'message': 'Username is available'})
        return Response({'message': 'Username is already taken'})


class CheckEmailView(APIView):
    """
    Check whether an email is available
    """

    def get(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email cannot be empty'})
        if not User.objects.get(email__exact=email).exists():
            return Response({'message': 'Email is available'})
        return Response({'message': 'Email is already used'})


class VerifyEmail(APIView):
    """
    Verify created user email address
    """
    throttle_scope = 'email-verify'

    def get(self, request):
        token = request.GET.get('token')
        try:
            payload = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(id=payload['user_id'])
            if not user.is_active:
                user.is_active = True
                user.save()
            return Response({'email': 'Successfully verified'}, status=status.HTTP_200_OK)
        except jwt.ExpiredSignatureError as e:
            return Response({'error': 'Activation link expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.exceptions.DecodeError as e:
            return Response({'error': 'Invalid Token'}, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetView(generics.GenericAPIView):
    """
    Sends an email with password reset link
    """
    throttle_scope = 'request-password-reset'
    serializer_class = RequestPasswordResetSerializer

    def post(self, request):
        email = request.data['email']
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            current_site = get_current_site(request=request).domain
            relative_link = reverse('password-reset', kwargs={'uidb64': uidb64, 'token': token})
            abs_url = 'http://' + current_site + relative_link
            email_body = 'Hi, please use link below to reset your password\n' + abs_url
            data = {
                'email_body': email_body,
                'email_subject': 'Reset your password',
                'mail_to': user.email
            }
            Util.send_email(data)
        return Response({'success': 'Email to reset your password has been sent'}, status=status.HTTP_200_OK)


class PasswordTokenCheckView(APIView):
    """
    Checks if password reset link is valid
    """
    throttle_scope = 'password-reset'

    def get(self, request, uidb64, token):

        try:
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Token is no valid, please request a new one'},
                                status=status.HTTP_401_UNAUTHORIZED)

            return Response({'success': True, 'message': 'Credentials valid', 'uidb64': uidb64, 'token': token},
                            status=status.HTTP_200_OK)

        except DjangoUnicodeDecodeError as e:
            if not PasswordResetTokenGenerator():
                return Response({'error': 'Token is no valid, please request a new one'},
                                status=status.HTTP_401_UNAUTHORIZED)


class SetNewPasswordView(generics.GenericAPIView):
    """
    Reset password with POST data

    - password
    - token
    - uidb64
    """
    throttle_scope = 'password-reset-complete'
    serializer_class = SetNewPasswordSerializer

    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'success': True, 'message': 'Password reset success'}, status=status.HTTP_200_OK)


class UserProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve/Update/Destroy ViewSet for User model
    """
    throttle_classes = [UserProfileDetailThrottle]
    permission_classes = [IsProfileUserOrReadOnly]
    lookup_field = 'username'

    def get_serializer_class(self, request=None):
        if self.request is None:
            return BasicUserProfileSerializer
        elif self.request.user.username == self.kwargs.get('username'):
            print("test")
            return UserProfileSerializer
        return BasicUserProfileSerializer

    def get_queryset(self, *args, **kwargs):
        try:
            return User.objects.filter(username=self.kwargs.get('username'))
        except User.DoesNotExist:
            raise Http404

    def perform_destroy(self, instance):
        if not instance.avatar == 'profile_images/default.jpg':
            instance.avatar.delete()
        instance.delete()


class UserListView(generics.ListAPIView):
    """
    List view for user model
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.all()


class ActionView(generics.ListAPIView):
    """
    List view for action model
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ActionSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        user = self.request.user
        actions = Action.objects.exclude(user=user)
        follows = Follow.objects.following(user=user)
        if follows:
            actions = Action.filter(user_id__in=follows)
            return actions
        return actions


class FriendViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Friend model
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BasicUserProfileSerializer
    lookup_field = 'pk'

    def create(self, request):
        """
        This method is not allowed
        """
        response = {'detail': 'Method \"POST\" not allowed.'}
        return Response(response, status=status.HTTP_403_FORBIDDEN)

    def update(self, request):
        """
        This method is not allowed
        """
        response = {'detail': 'Method \"PUT\" not allowed.'}
        return Response(response, status=status.HTTP_403_FORBIDDEN)

    def partial_update(self, request, pk=None):
        """
        This method is not allowed
        """
        response = {'detail': 'Method \"PATCH\" not allowed.'}
        return Response(response, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, pk=None):
        """
        This method is not allowed
        """
        response = {'detail': 'Method \"DELETE\" not allowed.'}
        return Response(response, status=status.HTTP_403_FORBIDDEN)

    def list(self, request):
        """
        Returns list of user's friends
        """
        friends = Friend.objects.friends(user=request.user)
        self.queryset = friends
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(FriendSerializer(self.queryset, many=True).data)

    def retrieve(self, request, pk=None):
        """
        Return detail info of user's friend with id specified in the URL
        """
        self.queryset = Friend.objects.friends(user=request.user)
        requested_user = get_object_or_404(User, pk=pk)
        if Friend.objects.are_friends(request.user, requested_user):
            self.http_method_names = ['get', 'head', 'options', ]
            return Response(BasicUserProfileSerializer(requested_user, many=False).data)
        else:
            return Response({'message': "Friend relationship not found for user."}, status.HTTP_400_BAD_REQUEST)

    @ action(detail=False)
    def requests(self, request):
        """
        Returns a list of user's received friend requests
        """
        friend_requests = Friend.objects.unrejected_requests(user=request.user)
        self.queryset = friend_requests
        return Response(FriendshipRequestSerializer(friend_requests, many=True).data)

    @ action(detail=False)
    def sent_requests(self, request):
        """
        Returns a list of user's sent friend requests
        """
        friend_requests = Friend.objects.sent_requests(user=request.user)
        self.queryset = friend_requests
        return Response(FriendshipRequestSerializer(friend_requests, many=True).data)

    @ action(detail=False)
    def rejected_requests(self, request):
        """
        Returns a list of rejected friend requests
        """
        friend_requests = Friend.objects.rejected_requests(user=request.user)
        self.queryset = friend_requests
        return Response(FriendshipRequestSerializer(friend_requests, many=True).data)

    @ action(detail=False, serializer_class=FriendshipRequestSerializer, methods=['post'])
    def add_friend(self, request, username=None):
        """
        Creates a friend request from POST data:

        - to_user
        - message
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_user = get_object_or_404(User, username=serializer.validated_data.get('to_user'))

        try:
            friend_obj = Friend.objects.add_friend(request.user, to_user, message=request.data.get('message', ''))
            create_action(request.user, 'wysłałeś zaproszenie do znajomych użytkownikowi', to_user)
            return Response(FriendshipRequestSerializer(friend_obj).data, status.HTTP_201_CREATED)
        except (AlreadyExistsError, AlreadyFriendsError) as e:
            return Response({"message": str(e)}, status.HTTP_400_BAD_REQUEST)

    @ action(detail=False, serializer_class=FriendshipRequestSerializer, methods=['post'])
    def remove_friend(self, request):
        """
        Deletes a friend relationship.

        The username specified in the POST data will be
        removed from the current user's friends.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_user = get_object_or_404(User, username=serializer.validated_data.get('to_user'))

        if Friend.objects.remove_friend(request.user, to_user):
            message = 'Friend deleted.'
            create_action(request.user, 'usunąłeś ze znajomych użytkownika', to_user)
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Friend not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response({"message": message}, status=status_code)

    @ action(detail=False, serializer_class=FriendshipRequestResponseSerializer, methods=['post'])
    def accept_request(self, request, pk=None):
        """
        Accepts a friend request

        The request id specified in the URL will be accepted
        """
        pk = request.data.get('id', None)
        friendship_request = get_object_or_404(FriendshipRequest, pk=pk)

        if not friendship_request.to_user == request.user:
            return Response({"message": "Request for current user not found."}, status.HTTP_400_BAD_REQUEST)

        friendship_request.accept()
        create_action(request.user, 'zaakceptowałeś zaproszenie do znajomych od użytkownika', friendship_request)

        return Response({"message": "Request accepted, user added to friends."}, status.HTTP_201_CREATED)

    @ action(detail=False, serializer_class=FriendshipRequestResponseSerializer, methods=['post'])
    def reject_request(self, request, pk=None):
        """
        Rejects a friend request

        The request id specified in the URL will be rejected
        """
        pk = request.data.get('id', None)
        friendship_request = get_object_or_404(FriendshipRequest, pk=pk)

        if not friendship_request.to_user == request.user:
            return Response({"message": "Request for current user not found."}, status.HTTP_400_BAD_REQUEST)

        friendship_request.reject()
        create_action(request.user, 'odrzuciłeś zaproszenie do znajomych od użytkownika', friendship_request)

        return Response({"message": "Request rejected, user NOT added to friends."}, status.HTTP_201_CREATED)

    @action(detail=False, serializer_class=FollowSerializer, methods=['post'])
    def add_follow(self, request):
        """
        Add a follow from POST data:

        - folowee
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        followee = get_object_or_404(User, username=serializer.validated_data.get('followee'))
        follower = request.user
        try:
            follow_obj = Follow.objects.add_follower(follower, followee)
            create_action(request.user, 'zacząłeś obserwować użytkownika', followee)
            return Response(FollowSerializer(follow_obj).data, status.HTTP_201_CREATED)
        except AlreadyExistsError as e:
            return Response({"message": str(e)}, status.HTTP_400_BAD_REQUEST)

    @action(detail=False, serializer_class=FollowSerializer, methods=['post'])
    def remove_follow(self, request):
        """
        Remove a follow from POST data:

        - followee
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        followee = get_object_or_404(User, username=serializer.validated_data.get('followee'))

        if Follow.objects.remove_follower(request.user, followee):
            message = 'Follow deleted.'
            create_action(request.user, 'przestałeś obserwować użytkownika', followee)
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Follow not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response({"message": message}, status=status_code)

    @action(detail=False)
    def followers(self, request):
        """
        Returns a list of all user's followers
        """
        followers = Follow.objects.followers(user=request.user)
        self.queryset = followers
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BasicUserProfileSerializer(followers, many=True).data)

    @action(detail=False)
    def following(self, request):
        """
        Returns a list of users the given user follows
        """
        following = Follow.objects.following(user=request.user)
        self.queryset = following
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BasicUserProfileSerializer(following, many=True).data)

    @action(detail=False, serializer_class=BlockSerializer, methods=['post'])
    def add_block(self, request):
        """
        Add a block from POST data:

        - blocked
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blocked = get_object_or_404(User, username=serializer.validated_data.get('blocked'))
        blocker = request.user
        try:
            block_obj = Block.objects.add_block(blocker, blocked)
            create_action(request.user, 'zablokowałeś użytkownika', blocked)
            return Response(BlockSerializer(block_obj).data, status.HTTP_201_CREATED)
        except AlreadyExistsError as e:
            return Response({"message": str(e)}, status.HTTP_400_BAD_REQUEST)

    @action(detail=False, serializer_class=BlockSerializer, methods=['post'])
    def remove_block(self, request):
        """
        Remove a blocked from POST data:

        - blocked
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        blocked = get_object_or_404(User, username=serializer.validated_data.get('blocked'))

        if Block.objects.remove_block(request.user, blocked):
            message = 'Block deleted.'
            create_action(request.user, 'przestałeś blokować użytkownika', blocked)
            status_code = status.HTTP_204_NO_CONTENT
        else:
            message = 'Block not found.'
            status_code = status.HTTP_400_BAD_REQUEST

        return Response({"message": message}, status=status_code)

    @action(detail=False)
    def blockers(self, request):
        """
        Returns a list of all user's blocked users
        """
        blocked = Block.objects.blocked(user=request.user)
        self.queryset = blocked
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BasicUserProfileSerializer(blocked, many=True).data)

    @action(detail=False)
    def blocking(self, request):
        """
        Returns a list of users the given user blocks
        """
        blocking = Block.objects.blocking(user=request.user)
        self.queryset = blocking
        self.http_method_names = ['get', 'head', 'options', ]
        return Response(BasicUserProfileSerializer(blocking, many=True).data)
