import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';



import { AppComponent } from './app.component';
import { AuthenticatorComponent } from './_component/authenticator/authenticator.component';
import { ContentComponent } from './_component/content/content.component';
import { HomeComponent } from './_component/home/home.component';
import { LoginComponent } from './_component/login/login.component';
import { RegisterComponent } from './_component/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateFormatPipe } from './_pipe/date-format.pipe';
import { TimeSincePipe } from './_pipe/time-since.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
// import { PostDetailComponent } from './_component/post-detail/post-detail.component';



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
    // PostDetailComponent,
  ],
  imports: [    
    HttpClientModule,
    BrowserModule,
    FormsModule,
    NgbModule,
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
