import { Routes } from "@angular/router";
import { HomeComponent } from "./_component/home/home.component";
import { AccountComponent } from "./_component/account/account.component";
import { NotificationsComponent } from "./_component/notifications/notifications.component";
import { ContentComponent } from "./_component/content/content.component";
import { PostDetailsComponent } from "./_component/post-details/post-details.component";
import { AccountInfoComponent } from "./_component/account-info/account-info.component";
import { UsersBlockedComponent } from "./_component/users-blocked/users-blocked.component";
import { UserCommentListComponent } from "./_component/user-comment-list/user-comment-list.component";
import { UsersCombinedComponentComponent } from "./_component/users-combined-component/users-combined-component.component";
import { ChatViewComponent } from "./_component/chat-view/chat-view.component";
import { SearchComponent } from "./_component/search/search.component";
import { ChangePasswordComponent } from "./_component/change-password/change-password.component";

export const appRoutes: Routes = [
    {
        path: '', 
        component: HomeComponent,
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: ContentComponent },
            { path: 'account', component: AccountComponent },
            { path: 'account/password', component: ChangePasswordComponent },
            { path: 'notifications', component: NotificationsComponent},
            { path: 'account-info', component: AccountInfoComponent},
            { path: 'blocked', component: UsersBlockedComponent},
            { path: 'chat', component: ChatViewComponent},
            { path: 'search', component: SearchComponent},
            { path: ':username/followers', component: UsersCombinedComponentComponent},
            { path: ':username/following', component: UsersCombinedComponentComponent},
            { path: ':username/friends', component: UsersCombinedComponentComponent},
            { path: ':username/friends_requests', component: UsersCombinedComponentComponent},
            { path: ':username', component: UserCommentListComponent },
            { path: ':username/comments', component: UserCommentListComponent },
            { path: ':username/media', component: UserCommentListComponent },
            { path: ':username/likes', component: UsersCombinedComponentComponent },
            { path: 'post/:postId', component: PostDetailsComponent},
        ]
    },
    { path: '**', redirectTo: 'home' }
];