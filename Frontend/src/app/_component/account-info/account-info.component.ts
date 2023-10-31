import { Component } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '@angular/common';



@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css']
})
export class AccountInfoComponent {

  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  profileData: any;
  error = false;
  public serverError: boolean = false; 
  public userExists: boolean = true; 
  public username: string='';
  public loggedInUsername: string = ''; 
  public tokenError = false


  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private location: Location
  ){}


  ngOnInit(){
    this.loggedInUsername = this.authService.decodedToken.username;
    this.getAccountDetails()
  }

  getAccountDetails(){
    this.isLoading = true;
    this.dataService.getUserByUsername(this.loggedInUsername).subscribe(data => {
      this.profileData = data;
      this.isLoading = false;
    }, error => {
      console.log(error);
      if (error.status === 404) {
        this.userExists = false; 
        this.isLoading = false;
      } else if(error.status === 401){
        this.tokenError = true;
        this.isLoading = false;
      } else if (error.status === 0) {
        this.serverError = true;
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  getAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
