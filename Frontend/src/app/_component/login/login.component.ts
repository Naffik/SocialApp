import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth.service';
import { AlertifyService } from 'src/app/_services/alertify.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit{
  showPassword = false;
  model:any = {};
  obj:any;
  loginError: string = '';  


  constructor(
    private authService: AuthService, 
    private alertify: AlertifyService
  ){}

  ngOnInit(): void {
  }


  login() {
    this.authService.login(this.model).subscribe({
    error: (errorResponse) => {
      if (errorResponse.error.detail === 'No active account found with the given credentials') {
        this.loginError = 'Podano nieprawidłoy adres email lub hasło.';
        this.alertify.error('Wystąpił błąd logowania');
      }else {
        this.alertify.error('Wystąpił błąd logowania');
        this.loginError = 'Brak dostępu do serwisu.';
      }
    },
    complete: () => this.alertify.success('Logowanie pomyślne!')
    })
  }

  
}
