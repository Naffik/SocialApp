import { Component } from '@angular/core';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-authenticator',
  templateUrl: './authenticator.component.html',
  styleUrls: ['./authenticator.component.css']
})
export class AuthenticatorComponent {

  model:any ={};
  isVisible = false;
  registerMode = false;

  constructor(private authService: AuthService){ }


   registerToggle(){
    this.registerMode = !this.registerMode;
   }

   loggedIn(){
    const token = localStorage.getItem("access");
    return !!token;
  }

  logout(){
    localStorage.removeItem('access');
  }
}
