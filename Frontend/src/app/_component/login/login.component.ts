import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit{
  showPassword = false;
  model:any = {};
  obj:any;

  constructor(private authService: AuthService){}

  ngOnInit(): void {}


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

  // register(event: any) {
  //   event.preventDefault();
  //   this.authService.register(this.model).subscribe(next => {
  //     alert('Konto zostało stworzone, brawo!');
  //   }, error => {
  //     console.log('Wystąpił błąd rejestracji', error);
  //   });
  // }



  login() {
    // event.preventDefault();
    this.authService.login(this.model).subscribe({
    next: (v) => console.log(this.model),
    error: (e) => console.error('Wystąpił błąd logowania', e),
    complete: () => alert('Zalogowałęś się, brawo!')
    })
  }
}
