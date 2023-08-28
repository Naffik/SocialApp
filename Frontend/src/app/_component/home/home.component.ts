import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  loggedIn(){
    const token = localStorage.getItem("access");
    return !!token;
  }

  logout(){
    localStorage.removeItem('access');
  }

}
