from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
from django.utils.datastructures import MultiValueDictKeyError
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
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
                                      CustomTokenObtainPairSerializer, ActionSerializer, BlockUserSerializer,
                                      FriendUserProfileSerializer, SetNewPasswordSerializer2)
from django.contrib.sites.shortcuts import get_current_site
from django.conf import settings
import jwt
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.hashers import check_password
from django.utils.encoding import smart_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse

from .pagination import DefaultPagination
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
        username = request.query_params.get('username')
        username = username.lower()
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
        email = request.query_params.get('email')
        if not email:
            return Response({'message': 'Email cannot be empty'})
        if not User.objects.filter(email__exact=email).exists():
            return Response({'message': 'Email is available'})
        return Response({'message': 'Email is already used'})


class CheckPasswordView(APIView):
    """
    Check whether a password is correct
    """

    def post(self, request, *args, **kwargs):
        password = request.data.get('password')
        if check_password(password, request.user.password):
            return Response({'message': True})
        else:
            return Response({'message': False})


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
    serializer_class = SetNewPasswordSerializer2
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        old_password = request.data.get('old_password')
        if check_password(old_password, request.user.password):
            serializer = self.serializer_class(data=request.data, context={'id': request.user.id})
            serializer.is_valid(raise_exception=True)
            return Response({'success': True, 'message': 'Password reset success'}, status=status.HTTP_200_OK)
        else:
            return Response({'success': False, 'message': 'Something went wrong'}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve/Update/Destroy ViewSet for User model
    """
    throttle_classes = [UserProfileDetailThrottle]
    permission_classes = [IsProfileUserOrReadOnly]
    lookup_field = 'username'

    def get_serializer_class(self):
        username = self.kwargs.get('username')
        try:
            if self.request is not None and self.request.user.username == username:
                return UserProfileSerializer
            if Friend.objects.are_friends(self.request.user, User.objects.get(username=username)):
                return FriendUserProfileSerializer
        except Exception as e:
            Exception(f"Something went wrong in UserProfileDetailView {e}")
        return BasicUserProfileSerializer

    def get_object(self, *args, **kwargs):
        request_user = self.request.user
        username = self.kwargs.get('username')
        try:
            user = User.objects.get(username=username)
            if not request_user.is_authenticated or request_user.username == username:
                return user
            blocked = Block.objects.blocked(user=request_user)
            if user in blocked:
                raise PermissionDenied({'message': 'You have been blocked by this user',
                                        'username': user.username,
                                        'display_name': user.display_name,
                                        'avatar_url': user.avatar.url
                                        })
            blocking = Block.objects.blocking(user=request_user)
            if user in blocking:
                raise PermissionDenied({'message': 'You have blocked this user',
                                        'username': user.username,
                                        'display_name': user.display_name,
                                        'avatar_url': user.avatar.url
                                        })
            user.is_friend = user.is_friend(request_user, user)
            user.follow = user.follow(request_user, user)
            user.request_friendship_sent = user.request_friendship_sent(request_user, user)
            return user
        except User.DoesNotExist:
            raise NotFound("User not found")

    def update(self, request, *args, **kwargs):
        try:
            user = User.objects.get(username=request.user.username)
        except ObjectDoesNotExist:
            return super(UserProfileDetailView, self).update(request, *args, **kwargs)

        avatar = None
        # date_of_birth = None

        try:
            avatar = request.FILES['avatar']
        except MultiValueDictKeyError:
            pass
        if avatar:
            if user.avatar != 'profile_images/default.jpg':
                user.avatar.delete()
            user.avatar = avatar
            user.save()

        # try:
        #     date_of_birth = request.data.get('date_of_birth')
        # except Exception as e:
        #     pass
        # if date_of_birth:
        #     user.date_of_birth = date_of_birth

        user.save()
        response = super(UserProfileDetailView, self).update(request)
        return response

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except PermissionDenied as e:
            return Response(e.detail, status=status.HTTP_403_FORBIDDEN)

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
    pagination_class = DefaultPagination

    def get_queryset(self):
        user = self.request.user
        actions = Action.objects.exclude(user=user)
        follows = Follow.objects.following(user=user)
        if follows:
            actions = Action.objects.exclude(user=user).filter(user_id__in=follows)
            return actions
        return actions


class FriendViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Friend model
    """
    permission_classes = [IsAuthenticated]
    pagination_class = DefaultPagination
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
        username = self.request.query_params.get('username')
        if not username:
            user = request.user
            friends = Friend.objects.friends(user=user)
        else:
            user = get_object_or_404(User, username=username)
            friends = Friend.objects.friends(user=user)
        friend_list = []
        for friend in friends:
            follow_data = {
                "is_friend": user.is_friend(request.user, friend),
                "follow": user.follow(request.user, friend),
                "request_friendship_sent": user.request_friendship_sent(request.user, friend)
            }
            follow_data.update(BasicUserProfileSerializer(friend, context=follow_data).data)
            friend_list.append(follow_data)
        self.queryset = friend_list
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(friend_list)
        if page is not None:
            return self.get_paginated_response(friend_list)
        return Response(FriendSerializer(friends, many=True).data)

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
        user = request.user
        friend_requests = Friend.objects.unrejected_requests(user=user)
        friend_requests_list = []
        for request in friend_requests:
            request_data = {
                "avatar_url": request.from_user.avatar.url,
                "username": request.from_user.username,
                "display_name": request.from_user.display_name,
            }
            request_data.update(FriendshipRequestSerializer(request, context=request_data).data)
            friend_requests_list.append(request_data)

        self.queryset = friend_requests
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(friend_requests_list)
        if page is not None:
            return self.get_paginated_response(friend_requests_list)
        return Response(FriendshipRequestSerializer(friend_requests, many=True).data)

    @ action(detail=False)
    def sent_requests(self, request):
        """
        Returns a list of user's sent friend requests
        """
        user = request.user
        friend_requests = Friend.objects.sent_requests(user=user)
        friend_requests_list = []
        for request in friend_requests:
            request_data = {
                "avatar_url": request.to_user.avatar.url,
                "username": request.to_user.username,
                "display_name": request.to_user.display_name,
            }
            request_data.update(FriendshipRequestSerializer(request, context=request_data).data)
            friend_requests_list.append(request_data)

        self.queryset = friend_requests
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(friend_requests_list)
        if page is not None:
            return self.get_paginated_response(friend_requests_list)
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
        create_action(request.user, 'zaakceptowałeś zaproszenie do znajomych od użytkownika',
                      friendship_request.from_user)

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

        friendship_request.cancel()
        # friendship_request.delete()
        create_action(request.user, 'odrzuciłeś zaproszenie do znajomych od użytkownika', friendship_request.from_user)

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
    def followers(self, request, username=None):
        """
        Returns a list of all user's followers
        """
        username = self.request.query_params.get('username')
        if not username:
            user = request.user
            followers = Follow.objects.followers(user=user)
        else:
            user = get_object_or_404(User, username=username)
            followers = Follow.objects.followers(user=user)
        followed_list = []
        for followed in followers:
            follow_data = {
                "is_friend": user.is_friend(request.user, followed),
                "follow": user.follow(request.user, followed),
                "request_friendship_sent": user.request_friendship_sent(request.user, followed)
            }
            follow_data.update(BasicUserProfileSerializer(followed, context=follow_data).data)
            followed_list.append(follow_data)
        self.queryset = followed_list
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(followed_list)
        if page is not None:
            return self.get_paginated_response(followed_list)
        return Response(BasicUserProfileSerializer(followers, many=True).data)


    @action(detail=False)
    def following(self, request):
        """
        Returns a list of users the given user follows
        """
        username = self.request.query_params.get('username')
        if not username:
            user = request.user
            following = Follow.objects.following(user=user)
        else:
            user = get_object_or_404(User, username=username)
            following = Follow.objects.following(user=user)
        following_list = []
        for follow in following:
            # print(follow)
            follow_data = {
                "is_friend": user.is_friend(request.user, follow),
                "follow": user.follow(request.user, follow),
                "request_friendship_sent": user.request_friendship_sent(request.user, follow)
            }
            follow_data.update(BasicUserProfileSerializer(follow, context=follow_data).data)
            following_list.append(follow_data)
        self.queryset = following_list
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(following_list)
        if page is not None:
            return self.get_paginated_response(following_list)
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
        page = self.paginate_queryset(blocked)
        if page is not None:
            serializer = BlockUserSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        return Response(BlockUserSerializer(blocked, many=True).data)

    @action(detail=False)
    def blocking(self, request):
        """
        Returns a list of users the given user blocks
        """
        blocking = Block.objects.blocking(user=request.user)
        self.queryset = blocking
        self.http_method_names = ['get', 'head', 'options', ]
        page = self.paginate_queryset(blocking)
        blocked_list = []
        for blocked in blocking:
            block_data = {
                "is_blocked": True,
            }
            block_data.update(BlockUserSerializer(blocked, context=block_data).data)
            blocked_list.append(block_data)
        if page is not None:
            return self.get_paginated_response(blocked_list)
        return Response(BlockUserSerializer(blocking, many=True).data)
