from django.db.models.signals import post_save
from django.dispatch import receiver
from friendship.models import Block, Friend, Follow


@receiver(post_save, sender=Block)
def remove_friend_and_follow_signal(sender, instance,  created, **kwargs):
    """
    Remove friend and follow relationship between blocked and blocking user
    """
    if created:
        try:
            user_1 = instance.blocker
            user_2 = instance.blocked
            Friend.objects.remove_friend(user_1, user_2)
            Follow.objects.remove_follower(user_1, user_2)
            Follow.objects.remove_follower(user_2, user_1)
        except Exception as e:
            raise Exception(f"Something went wrong in remove friend and follow signal {e}")
