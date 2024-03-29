# Generated by Django 4.1.1 on 2023-08-20 11:35

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('web_app', '0002_delete_category'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='comment',
            options={'ordering': ['created']},
        ),
        migrations.RemoveField(
            model_name='post',
            name='favourites',
        ),
        migrations.AddField(
            model_name='post',
            name='favorites',
            field=models.ManyToManyField(blank=True, default=None, related_name='favorite', to=settings.AUTH_USER_MODEL),
        ),
        migrations.DeleteModel(
            name='DisLike',
        ),
    ]
