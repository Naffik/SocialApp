import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { DataService } from 'src/app/_services/data.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { environment } from 'src/environments/environment.development';

@Component({
  selector: 'app-users-combined-component',
  templateUrl: './users-combined-component.component.html',
  styleUrls: ['./users-combined-component.component.css']
})
export class UsersCombinedComponentComponent {
  users: any[] = [];
  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  error = false;
  serverError = false;
  private nextUrl: string = '';
  loggedInUsername: string = ''; 
  username: string = '';
  viewType: 'friends' | 'following' | 'followers' | 'friends_requests' = 'friends';

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,  
    private modalCommService: ModalCommunicationService
  ) {}

  ngOnInit() {
    this.loggedInUsername = this.authService.decodedToken.username; 
    this.route.params.subscribe(params => {
      this.username = params['username'];
      this.setViewType(this.route.snapshot.url[1]?.path as any); 
    });
    this.modalCommService.friendRemoved$.subscribe;
  }

  loadData() {
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
      console.error("Wystąpił błąd podczas ładowania danych:", error);
      this.isLoading = false;
      this.serverError = true;
    });
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

  setViewType(type: 'friends' | 'following' | 'followers' | 'friends_requests') {
    this.viewType = type;
    switch (type) {
      case 'friends':
        this.nextUrl = `${this.baseUrl}/account/friends/?page=1&size=10&username=${this.username}`;
        break;
      case 'followers':
        this.nextUrl = `${this.baseUrl}/account/friends/followers/?page=1&size=10&username=${this.username}`;
        break;
      case 'following':
        this.nextUrl = `${this.baseUrl}/account/friends/following/?page=1&size=10&username=${this.username}`;
        break;
      case 'friends_requests':
        if(this.username === this.loggedInUsername) {
          this.nextUrl = `${this.baseUrl}/account/friends/sent_requests/?page=1&size=10`; 
        } else {
          this.router.navigate(['/friends']); // Przekierowanie użytkowników, którzy nie są właścicielami profilu
        }
        break;
    }
    this.loadData();
  }

  onTabClick(type: 'friends' | 'following' | 'followers' | 'friends_requests') {
    this.router.navigate([this.username, type]); // Zmieniamy URL bez przeładowania całego komponentu
  }
}
