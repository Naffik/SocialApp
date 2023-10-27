import { Component } from '@angular/core';
import { DataService } from 'src/app/_services/data.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { environment } from 'src/environments/environment.development';
import { Location } from '@angular/common';
import { User } from 'src/app/_models/User';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { take } from 'rxjs';


@Component({
  selector: 'app-users-blocked',
  templateUrl: './users-blocked.component.html',
  styleUrls: ['./users-blocked.component.css']
})
export class UsersBlockedComponent {
  users: User[] = [];
  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  profileData: any;
  error = false;
  serverError = false;;
  private nextUrl: string = '';
  loggedInUsername: string = ''; 
  username: string = '';


  constructor(
    private dataService: DataService,
    private location: Location,
    private alertify: AlertifyService,
    private modalCommService: ModalCommunicationService
  ){}

  ngOnInit(){
    this.nextUrl = `${this.baseUrl}/account/friends/blocking/`; // Zaktualizuj nextUrl tutaj
    this.loadMoreBlockedAccounts();
  }

  loadMoreBlockedAccounts() {
    if (!this.nextUrl || this.isLoading) return; 

    this.isLoading = true; 

    this.dataService.getData(this.nextUrl).subscribe(data => {
      const newUsers = data.results.map((result: any) => new User(result));
      if (this.users.length === 0) {
        this.users = newUsers;
      } else {
        this.users = [...this.users, ...newUsers];
      }
      this.nextUrl = data.next;
      this.isLoading = false; 
      this.serverError = false;
    }, error => {
      console.error("Wystąpił błąd podczas ładowania zablokowanych użytkowników:", error);
      this.isLoading = false;
      this.serverError = true;
    });
}

  get hasBlockedAccounts(): boolean {
    return this.users.length > 0;
  }
  
  goBack(): void {
    this.location.back();
  }

  toggleBlock(user: any, event: Event) {
    event.stopPropagation();
    
    const message = user.isBlocked ? 
        `Czy na pewno chcesz odblokować użytkownika <strong>@${user.username}</strong>?` :
        `Czy na pewno chcesz zablokować użytkownika <strong>@${user.username}</strong>?`;
    
    this.modalCommService.openModalWithAction(message, () => {
        this.modalCommService.confirmAction$.pipe(take(1)).subscribe(() => {
            if (user.isBlocked) {
                this.dataService.unBlockUser(user.username).subscribe(response => {
                    user.isBlocked = false;
                    this.alertify.success("Odblokowałeś użytkownika " + user.username);
                }, error => {
                    console.error('Error unblocking user:', error);
                });
            } else {
                this.dataService.blockUser(user.username).subscribe(response => {
                    user.isBlocked = true;
                    this.alertify.success("Zablokowałeś użytkownika " + user.username);
                }, error => {
                    console.error('Error blocking user:', error);
                });
            }
        });
    });
}



  refreshPage() {
    window.location.reload();
  }
  
  // getFriendsList(){
  //   if (this.isLoading) return; // Check for loading state

  //   this.isLoading = true; // Set loading state to true

  //   this.dataService.getData(this.baseUrl + '/account/friends/').subscribe(
  //     data => {
  //       this.users = data;
  //       this.isLoading = false; // Set loading state to false
  //     },
  //     error => {
  //       console.error('Wystąpił błąd podczas pobierania listy znajomych:', error);
  //       this.isLoading = false; // Set loading state to false
  //     }
  //   );
  // }
}

