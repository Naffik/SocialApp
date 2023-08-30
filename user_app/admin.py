from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from user_app.models import User, OnlineUser, Action

fields = list(UserAdmin.fieldsets)
fields[0] = ('Login info', {'fields': ('email', 'password',)})
fields[1] = ('Personal info', {'fields': ('first_name', 'last_name', 'username', 'display_name', 'bio', 'avatar')})
UserAdmin.fieldsets = tuple(fields)


@admin.register(Action)
class ActionAdmin(admin.ModelAdmin):
    list_display = ('user', 'verb', 'target', 'created')
    list_filter = ('created', )
    search_fields = ('verb', )


admin.site.register(User, UserAdmin)
admin.site.register(OnlineUser)
