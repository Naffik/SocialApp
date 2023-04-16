from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from user_app.models import User, UserNickname, OnlineUser

fields = list(UserAdmin.fieldsets)
fields[0] = ('Login info', {'fields': ('email', 'password')})
fields[1] = ('Personal info', {'fields': ('first_name', 'last_name', 'username', 'display_name', 'bio', 'avatar')})
UserAdmin.fieldsets = tuple(fields)

admin.site.register(User, UserAdmin)
admin.site.register(UserNickname)
admin.site.register(OnlineUser)
