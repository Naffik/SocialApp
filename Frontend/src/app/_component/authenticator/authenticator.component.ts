import { Component } from '@angular/core';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-authenticator',
  templateUrl: './authenticator.component.html',
  styleUrls: ['./authenticator.component.css']
})
export class AuthenticatorComponent {
  state = AuthenticatorCompState.LOGIN;

  model:any ={};
  isVisible = false;

  constructor(private authService: AuthService){ }


  onLoginClick() {
    this.state = AuthenticatorCompState.LOGIN;
   }

  onRegisterClick() {
    this.state = AuthenticatorCompState.REGISTER;
   }

   isLoginState(){
    return this.state == AuthenticatorCompState.LOGIN;
   }

   isRegisterState(){
    return this.state == AuthenticatorCompState.REGISTER;
   }

   loggedIn(){
    const token = localStorage.getItem("access");
    return !!token;
  }

  logout(){
    localStorage.removeItem('access');
  }
}

  export enum AuthenticatorCompState {
    LOGIN,
    REGISTER
  }

