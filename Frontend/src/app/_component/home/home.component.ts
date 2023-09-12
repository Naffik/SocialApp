import { ChangeDetectorRef, Component } from '@angular/core';
import { AlertifyService } from 'src/app/_services/alertify.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor(private alertify: AlertifyService){}

  firstName: string = '';
  lastName: string = '';
  avatarUrl: string = '';
  baseUrl: string = 'http://127.0.0.1:8000';

  ngOnInit(): void {
    
  }

  loggedIn(){
    const token = localStorage.getItem("access");
    this.firstName = localStorage.getItem('first_name') || '';
    this.lastName = localStorage.getItem('last_name') || '';
    this.avatarUrl = localStorage.getItem('avatar') || '/assets/profile-pic.png';
    return !!token;
  }

  logout(){
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('first_name');
    localStorage.removeItem('last_name');
    localStorage.removeItem('avatar');
    this.alertify.message("Wylogowano pomyslnie.");
  }

}
