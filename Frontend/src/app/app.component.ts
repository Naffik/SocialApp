import { Component, OnInit } from '@angular/core';
import { AuthService } from './_services/auth.service';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'SocialApp.SPA';

  jwtHelper = new JwtHelperService();

  constructor(
    private authService: AuthService
  ){}

  ngOnInit(): void{
    const access = localStorage.getItem('access');
    if (access){
      this.authService.decodedToken = this.jwtHelper.decodeToken(access);
    }
  }
}
