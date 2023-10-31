from django.core.mail import EmailMessage
from user_app.models import Action
from django.utils import timezone
import datetime
import os


class Util:
    @staticmethod
    def send_email(data):
        email = EmailMessage(subject=data['email_subject'], body=data['email_body'], to=[data['mail_to']])
        email.send()


def create_action(user, verb, target=None):
    now = timezone.now()
    last_minute = now - datetime.timedelta(seconds=60)
    similar_action = Action.objects.filter(user_id=user.id, verb=verb, created__gte=last_minute)

    if not similar_action:
        action = Action(user=user, verb=verb, target=target)
        action.save()
        return True
    return False
