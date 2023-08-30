import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit{
  showPassword = false;
  model:any = {};
  obj:any;

  constructor(private authService: AuthService){}

  ngOnInit(): void {}

  register() {
    // event.preventDefault();
    this.authService.login(this.model).subscribe({
    next: (v) => console.log(this.model),
    error: (e) => console.error('Wystąpił błąd logowania', e),
    complete: () => alert('Zalogowałęś się, brawo!')
    })
  }



}
