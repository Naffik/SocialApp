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


  constructor(private authService: AuthService, private alertify: AlertifyService){}

  ngOnInit(): void {
    
  }


 scrollToElement() {
  //  const element = this.login.nativeElement;
  //  const rect = element.getBoundingClientRect();
  //  console.log(element);
  //  if (element) {
  //    element.scrollIntoView({
  //      behavior: 'smooth' });
  //  }
  //  console.log(rect.top + window.scrollY);
 }

  login() {
    // event.();
    this.authService.login(this.model).subscribe({
    // next: () => console.log(this.model),
    error: (errorResponse) => {
      console.log(errorResponse)
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
