import { Component } from '@angular/core';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { Location } from '@angular/common';


@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {

  requests: any[] = [];
  baseUrl = environment.apiUrl;
  private nextUrl: string = '';
  isLoading: boolean = false;



  constructor(
    private dataService: DataService,
    private location: Location,

    ) { }

  ngOnInit(): void {
    this.nextUrl = `${this.baseUrl}/account/friends/requests/?page=1&size=10`; 
    this.getFriendRequest();
 }

 getFriendRequest() {
  if (!this.nextUrl || this.isLoading) return; 

  this.isLoading = true; 
  this.dataService.getData(this.nextUrl).subscribe(data => {
    if (this.requests.length === 0) {
      this.requests = [...data.results]; 
    } else {
      this.requests = [...this.requests, ...data.results]; 
    }
    this.nextUrl = data.next;
    this.isLoading = false; 
  }, error => {
    console.log(error, error.code)
    // if (error && error.error && error.error.code === "token_not_valid") {
    //   this.tokenError = true;
    // }
    console.error("Wystąpił błąd podczas ładowania postów:", error);
    this.isLoading = false;
  });
  }

  goBack(): void {
    this.location.back();
  }
  
  acceptRequest(requestId: number): void {
    this.dataService.acceptRequest(requestId).subscribe(response => {
      this.requests = this.requests.filter(request => request.id !== requestId);
    }, error => {
      console.error('Błąd podczas akceptacji zaproszenia:', error);
    });
  }

  rejectRequest(requestId: number): void {
    this.dataService.rejectRequest(requestId).subscribe(response => {
      this.requests = this.requests.filter(request => request.id !== requestId);
    }, error => {
      console.error('Błąd podczas odrzucenia zaproszenia:', error);
    });
  }

}
