# Generated by Django 4.1.1 on 2022-10-21 13:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_app', '0002_alter_user_data_of_birth'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='data_of_birth',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
