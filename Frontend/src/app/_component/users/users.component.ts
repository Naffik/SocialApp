import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_models/User';
import { Location } from '@angular/common';




@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {

  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  profileData: User | null = null;
  error = false;
  public serverError: boolean = false;
  public userExists: boolean = true;
  public username: string = '';
  public loggedInUsername: string = '';
  public tokenError = false
  userBlocked = false;
  userHasBlockedYou: boolean = false;
  showContextMenu: boolean = false;
  private subscriptions: Subscription[] = [];


  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private modalCommService: ModalCommunicationService,
    private alertify: AlertifyService,
    private location: Location,
  ) { }

  ngOnInit() {
    this.loggedInUsername = this.authService.decodedToken.username;
    this.route.params.subscribe(params => {
      this.username = params['username'];
      if (this.username) {
        this.getAccountDetails(this.username);
      } else {
        this.error = true;
      }
    });
    this.subscriptions.push(
      this.modalCommService.profileUpdated.subscribe(() => {
        this.getAccountDetails(this.username);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getAccountDetails(username: string) {
    this.isLoading = true;
    this.dataService.getUserByUsername(username)
      .subscribe({
        next: (data) => this.handleSuccess(data),
        error: (e) => this.handleError(e),
      });
  }

  private handleSuccess(data: any) {
    this.profileData = new User(data);
    this.userExists = true;
    this.isLoading = false;
  }

  private handleError(error: any) {
    this.isLoading = false;
    switch (error.status) {
      case 404:
        this.userExists = false;
        break;
      case 401:
        this.tokenError = true;
        break;
      case 0:
        this.serverError = true;
        break;
      case 403:
        this.handle403Error(error);
        break;
      default:
        console.error("Nieobsługiwany błąd:", error);
    }
  }

  private handle403Error(error: any) {
    if (error.error && error.error.message === "You have blocked this user") {
      this.userBlocked = true;
      this.profileData = error.error;  // Aktualizujemy dane profilowe z błędem
    } else if (error.error && error.error.message === "You have been blocked by this user") {
      this.userHasBlockedYou = true;
      this.profileData = error.error;  // Aktualizujemy dane profilowe z błędem
    }
  }


  refreshPage(): void {
    window.location.reload();
  }

  openEditModal() {
    const modalRef = this.modalService.open(EditProfileModalComponent, { backdrop: 'static' });
    modalRef.componentInstance.userData = this.profileData;
    console.log(this.profileData)
  }


  unBlockUser() {
    this.dataService.unBlockUser(this.username).subscribe(
      response => {
        this.userBlocked = false;
        this.getAccountDetails(this.username);
        this.alertify.success("Użytkownik @" + this.username + "został odblokwoany.")
      },
      error => {
        this.alertify.error('Wystąpił błąd, spróbuj ponownie później.')
      }
    );
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

  toggleFriendship(user: any) {
    if (user.is_friend) {
      console.log
      this.dataService.removeFriend(user.username).subscribe(response => {
        // po pomyślnym usunięciu znajomego
        user.is_friend = false;
        user.request_friendship_sent = false;  // resetuj, gdy użytkownik nie jest już znajomym
      });
    } else if (!user.request_friendship_sent) {
      this.dataService.addFriend(user.username).subscribe(response => {
        // po pomyślnym wysłaniu zaproszenia
        user.request_friendship_sent = true;
      });
    }
  }

  toggleFollow(user: any) {
    if (user.follow) {
      this.dataService.dataFollow(user.username, this.baseUrl + '/account/friends/remove_follow/').subscribe(response => {
        user.follow = false;
      });
    } else {
      this.dataService.dataFollow(user.username, this.baseUrl + '/account/friends/add_follow/').subscribe(response => {
        user.follow = true;
      });
    }
  }

  openAvatarModal() {
    if (this.profileData) {
      console.log(this.profileData.avatar_url);
      this.modalCommService.openMediaModal(this.profileData.avatar_url);
    }
  }


  goBack(): void {
    this.location.back();
  }
  closeImageModal() {
    // this.router.navigate(['post', postId]);
    this.modalCommService.closeMediaModal();
  }
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


