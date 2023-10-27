import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { DataService } from 'src/app/_services/data.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { environment } from 'src/environments/environment.development';


@Component({
  selector: 'app-user-post-list',
  templateUrl: './user-post-list.component.html',
  styleUrls: ['./user-post-list.component.css']
})
export class UserPostListComponent {
  users: any[] = [];
  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  profileData: any;
  error = false;
  private nextUrl: string = '';
  public serverError: boolean = false; 
  public userExists: boolean = true; 
  public loggedInUsername: string = ''; 
  public username: string='';
  public tokenError = false;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private modalCommService: ModalCommunicationService

  ){}

  ngOnInit(){
    this.loggedInUsername = this.authService.decodedToken.username; 
    this.route.params.subscribe(params => {
      this.username = params['username'];
      if (this.username) {
        this.nextUrl = `${this.baseUrl}/account/friends/followers/?page=1&size=10&username=${this.username}`; 
        this.loadMoreFollowers();
      } else {
          this.error=true;
      }
    });
    this.modalCommService.friendRemoved$.subscribe;
  }
  
  loadMoreFollowers() {
    if (!this.nextUrl || this.isLoading) return; 

    this.isLoading = true; 
    this.dataService.getData(this.nextUrl).subscribe(data => {
      if (this.users.length === 0) {
        this.users = [...data.results]; 
      } else {
        this.users = [...this.users, ...data.results]; 
      }
      this.nextUrl = data.next;
      this.isLoading = false; 
      this.serverError = false;

    }, error => {
      console.log(error, error.code)
      if (error && error.error && error.error.code === "token_not_valid") {
        this.tokenError = true;
      }
      console.error("Wystąpił błąd podczas ładowania postów:", error);
      this.isLoading = false;
      this.serverError = true;

    });
  }

  refreshPage(): void {
    window.location.reload();
  }

  toggleFriendship(user: any) {
    if (user.is_friend) {
        this.dataService.removeFriend(user.username).subscribe(response => {
            user.is_friend = false;
            user.request_friendship_sent = false;  
        });
    } else if (!user.request_friendship_sent) {
        this.dataService.addFriend(user.username).subscribe(response => {
            user.request_friendship_sent = true;
        });
    }
  }
  
  toggleFollow(user: any) {
    if (user.follow) {
        this.dataService.dataFollow(user.username, this.baseUrl+'/account/friends/remove_follow/').subscribe(response => {
            user.follow = false;
        });
    } else {
        this.dataService.dataFollow(user.username, this.baseUrl+'/account/friends/add_follow/').subscribe(response => {
            user.follow = true;
        });
    }
  }

  removeFriend(user: any) {
    const message = `Czy na pewno chcesz usunąć tego znajomego? <strong>@${user.username}</strong>`;

    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.removeFriend(user.username).subscribe(response => {
        user.is_friend = false;
      }, error => {
        console.error("Błąd podczas usuwania znajomego:", error);
      });
    });
  }
}
