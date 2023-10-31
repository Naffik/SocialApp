import { Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-authenticator',
  templateUrl: './authenticator.component.html',
  styleUrls: ['./authenticator.component.css']
})
export class AuthenticatorComponent {

  @ViewChild('loginForm')
  loginForm!: ElementRef;
  @ViewChild('registerForm')
  registerForm!: ElementRef;

  model:any ={};
  isVisible = false;

  constructor(private authService: AuthService){ }

  get registerMode(): boolean {
    return this.authService.registerMode;
  }

  scrollToForm(): void {
    if (this.authService.registerMode) {
      this.registerForm.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.loginForm.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  registerToggle(): void {
    this.authService.registerToggle();
  }
}
