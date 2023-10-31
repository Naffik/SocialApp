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

  constructor(private authService: AuthService){ }

  get registerMode(): boolean {
    return this.authService.registerMode;
  }

  registerToggle(): void {
    this.authService.registerToggle();
  }
}
