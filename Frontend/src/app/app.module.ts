import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { JwtModule } from "@auth0/angular-jwt";

import { AuthenticatorComponent } from './_component/authenticator/authenticator.component';
import { ContentComponent } from './_component/content/content.component';
import { HomeComponent } from './_component/home/home.component';
import { LoginComponent } from './_component/login/login.component';
import { RegisterComponent } from './_component/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateFormatPipe } from './_pipe/date-format.pipe';
import { TimeSincePipe } from './_pipe/time-since.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { AuthService } from './_services/auth.service';
import { AlertifyService } from './_services/alertify.service';
import { DataService } from './_services/data.service';
import { ValidatorsService } from './_services/validators.service';
import { ChatComponent } from './_component/chat/chat.component';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './_component/confirm-dialog/confirm-dialog.component';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { CreatePostModalComponent } from './_component/create-post-modal/create-post-modal.component';
import { NotificationsComponent } from './_component/notifications/notifications.component';
import { UsersComponent } from './_component/users/users.component';
import { AccountComponent } from './_component/account/account.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './routes';
import { LinkifyPipe } from './_pipe/linkify.pipe';
import { PostDetailsComponent } from './_component/post-details/post-details.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { TrendsComponent } from './_component/trends/trends.component';
import { MediaModalComponent } from './_component/media-modal/media-modal.component';
import { EditProfileModalComponent } from './_component/edit-profile-modal/edit-profile-modal.component';
import { AccountInfoComponent } from './_component/account-info/account-info.component';
import { UsersBlockedComponent } from './_component/users-blocked/users-blocked.component';
import { UsersCombinedComponentComponent } from './_component/users-combined-component/users-combined-component.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ProfilePopoverComponent } from './_component/profile-popover/profile-popover.component';
import { ChatViewComponent } from './_component/chat-view/chat-view.component';
import { SearchComponent } from './_component/search/search.component';
import { PasswordConfirmModalComponent } from './_component/password-confirm-modal/password-confirm-modal.component';
import { ChangePasswordComponent } from './_component/change-password/change-password.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthenticatorComponent,
    ContentComponent,
    HomeComponent,
    RegisterComponent,
    LoginComponent,
    DateFormatPipe,
    TimeSincePipe,
    ChatComponent,
    ConfirmDialogComponent,
    CreatePostModalComponent,
    NotificationsComponent,
    UsersComponent,
    AccountComponent,
    LinkifyPipe,
    PostDetailsComponent,
    TrendsComponent,
    MediaModalComponent,
    EditProfileModalComponent,
    AccountInfoComponent,
    UsersBlockedComponent,
    UsersCombinedComponentComponent,
    ProfilePopoverComponent,
    ChatViewComponent,
    SearchComponent,
    PasswordConfirmModalComponent,
    ChangePasswordComponent,
  ],
  imports: [    
    HttpClientModule,
    BrowserModule,
    FormsModule,
    NgbModule,
    CommonModule,
    ReactiveFormsModule,
    MdbModalModule,
    BrowserAnimationsModule,
    InfiniteScrollModule,
    RouterModule.forRoot(appRoutes),
    ImageCropperModule

  ],
  providers: [
    AuthService,
    AlertifyService, 
    DataService,
    ValidatorsService,
  { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
