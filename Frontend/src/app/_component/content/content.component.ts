import { Component, HostListener, OnInit, ChangeDetectorRef} from '@angular/core';
import { DataService } from '../../_services/data.service';
import { BehaviorSubject, Observable, Subscription} from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { AuthService } from 'src/app/_services/auth.service';
import { PostService } from 'src/app/_services/post-service.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { CreatePostModalComponent } from '../create-post-modal/create-post-modal.component';
import { MediaModalComponent } from '../media-modal/media-modal.component';
import { DropdownService } from 'src/app/_services/dropdown-service.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { Location } from '@angular/common';
import { Post } from 'src/app/_models/Post';
import { User } from 'src/app/_models/User';




@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ])
    ])
  ]
})

export class ContentComponent implements OnInit {


  private subscriptions: Subscription[] = [];


  posts: Post[] = [];
  nextUrl: string = environment.apiUrl + '/api/post/?page=1&size=50';  
  
  tokenError: boolean = false;
  trends: any[] = [];
  baseUrl = environment.apiUrl;
  private firstUrl:string = this.baseUrl + '/api/post/';
  isLoading: boolean = false;
  activeUsername: string | null = null;
  showTooltip = false;
  private hideTimeoutId: any;
  loggedInUsername: string = ''; 
  isUserDataLoading: boolean = false;
  userDataLoadError: boolean = false;
  invitationSent: boolean = false;
  showContextMenu: any[] = [];


  modalRef: MdbModalRef<ConfirmDialogComponent> | MdbModalRef<CreatePostModalComponent> | MdbModalRef<MediaModalComponent> | null = null;

  activePopover: number | null = null;
  userInfoToShow$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private userCache: { [username: string]: any } = {};

  visiblePopovers: { [username: string]: boolean } = {};

  activePost: any = null; 
  private isMouseInsidePopover: boolean = false;

  constructor(
    private dataService: DataService,  
    private cdRef: ChangeDetectorRef, 
    public modalService: MdbModalService,
    private modalCommService: ModalCommunicationService,
    private authService: AuthService,
    private postService: PostService,
    private router: Router,
    private dropdownService: DropdownService,
    private alertify: AlertifyService,
    private location: Location,    
  ) {}

  ngOnInit() {
    this.nextUrl = this.baseUrl + '/api/post/?page=1&size=50'
    this.loggedInUsername = this.authService.decodedToken.username; 
    this.loadMorePosts();

    const refreshSubscription = this.postService.refreshTriggered$.subscribe(() => {
      this.refreshTopPosts();
    });

    const postAddedSubscription = this.postService.postAdded$.subscribe((postData) => {
      this.posts.unshift(postData);
    });

    this.subscriptions.push(postAddedSubscription);

    const friendRemovedSubscription = this.modalCommService.friendRemoved$.subscribe(username => {
      this.refreshUserData(username);
    });

    this.subscriptions.push(friendRemovedSubscription);

    const dropdownSubscription = this.dropdownService.activeDropdown.subscribe(id => {
      if (id !== 'contentComponent') {
          Object.keys(this.showContextMenu).forEach(key => {
              this.hideContextMenu(+key);
          });
      }
    });

    this.subscriptions.push(dropdownSubscription);

  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  loadMorePosts() {
    if (!this.nextUrl || this.isLoading) return;

    this.isLoading = true;

    this.dataService.sendHttpRequest('GET', this.nextUrl)
      .subscribe({
        next: (data) => this.handlePostsSuccess(data),
        error: (e) => this.handlePostsError(e)
      });
    }

  private handlePostsSuccess(data: any) {
      if (this.posts.length === 0) {
          this.posts = [...data.results];
      } else {
          this.posts = [...this.posts, ...data.results];
      }
      this.nextUrl = data.next;
      this.isLoading = false;
  }

  private handlePostsError(error: any) {
      this.isLoading = false;
      if (error && error.error && error.error.code === "token_not_valid") {
          this.tokenError = true;
      } else {
          console.error("Nieobsługiwany błąd:", error);
      }
  }

  isActivePost(post: any): boolean {
    return this.activePopover === post.post_author;
 }

  showPopover(postId: number, username: string): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }
    if (this.activePopover !== postId) {
      this.activePopover = null; // Ukryj obecny popover
      setTimeout(() => {
        this.activePopover = postId; // Pokaż nowy popover po krótkim opóźnieniu
        this.fetchUserData(username);
      }, 300);
    } else {
      this.fetchUserData(username);
    }
  }

  hidePopover(): void {
    this.hideTimeoutId = setTimeout(() => {
      if (!this.isMouseInsidePopover) {
        this.activePopover = null;
      }
    }, 300);
  }

  enterPopover(): void {
    this.isMouseInsidePopover = true;
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }
  }
  
  leavePopover(): void {
    this.isMouseInsidePopover = false;
    this.hidePopover();
  }

  private addToCache(username: string, data: any): void {
    this.userCache[username] = data;
    setTimeout(() => {
      delete this.userCache[username];
    }, 5000 );
  }

  private fetchUserData(username: string): void {
    this.isUserDataLoading = true;
    this.userDataLoadError = false; 
    if (this.userCache[username]) {
      this.userInfoToShow$.next(new User(this.userCache[username]));
      this.isUserDataLoading = false;
    } else {
      this.dataService.sendHttpRequest('GET',`${this.baseUrl}/account/profile/${username}/`).subscribe(user => {
        this.addToCache(username, user);
        this.userInfoToShow$.next(new User(user));
        this.isUserDataLoading = false;
      }, error => {
        console.error("Błąd podczas wczytywania danych użytkownika:", error);
        this.isUserDataLoading = false;
        this.userDataLoadError = true;  // Ustaw stan błędu na true w przypadku błędu
      });
    }
  }


  addFollow(user: any) {
    this.dataService.dataFollow(user.username, this.baseUrl + "/account/friends/add_follow/").subscribe(() => {
        user.follow = true;
        this.refreshUserData(user.username);  // Ponownie wczytaj dane użytkownika
        this.cdRef.detectChanges();  // Wymuś aktualizację widoku
    }, error => {
        console.error("Błąd podczas dodawania obserwacji:", error);
    });
  }

  removeFollow(userOrPost: any) {
    console.log(userOrPost)

    const username = userOrPost.username || userOrPost.post_author;
    if (!username) {
      console.error("Nie można znaleźć nazwy użytkownika ani autora postu.");
      return;
    }

    this.dataService.dataFollow(username, this.baseUrl + "/account/friends/remove_follow/").subscribe(() => {
        userOrPost.follow = false;
        this.refreshUserData(username);  
        this.cdRef.detectChanges();  
    }, error => {
        console.error("Błąd podczas usuwania obserwacji:", error);
    });
  }

  addFriend(user: any) {
    this.dataService.addFriend(user.username).subscribe(() => {
      user.request_friendship_sent = false;
      this.refreshUserData(user.username);  
      this.cdRef.detectChanges();  
    }, error => {
      console.error("Błąd podczas dodawania obserwacji:", error);
    });
  }

  // openModalRemoveFriends(user: any) {
  //   this.modalCommService.openModalRemoveFriends(user);
  // }


  goToPostDetails(postId: number, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (this.isContextMenuShow(postId)) {
      this.hideContextMenu(postId);
      return;
    }
    const selectedText = window!.getSelection()!.toString();
    if (selectedText && selectedText.length > 0) {
      return;
    }
    this.router.navigate(['/post', postId]);
  } 


  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  private refreshUserData(username: string): void {
    this.dataService.getUserByUsername(username).subscribe(responseData => {
        const user = new User(responseData);
        this.userInfoToShow$.next(user);  
        this.userCache[username] = user;
    }, error => {
        console.error("Błąd podczas odświeżania danych użytkownika:", error);
    });
  }

  openPostInNewTab(postId: number) {
    const a = document.createElement('a');
    a.href = `/post/${postId}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }



  openMediaModal(imageUrl: string) {
    this.modalCommService.openMediaModal(imageUrl);
  }

  closeImageModal() {
    this.modalCommService.closeMediaModal();
  }

  hideContextMenu(postId: number) {
    this.showContextMenu[postId] = false;
  }

  toggleContextMenu(postId: number) {
    this.showContextMenu[postId] = !this.showContextMenu[postId];
    if (this.showContextMenu[postId]) {
        this.dropdownService.openDropdown('contentComponent');
    } else {
        this.dropdownService.closeDropdown();
    }
  }

  // toggleLike(post: Post) {
  //   if (post.is_liked) {
  //       this.dataService.removeLike(post.id).subscribe({
  //           next: () => {
  //               post.number_of_likes--; 
  //               post.is_liked = false; 
  //           },
  //           error: (e) => {
  //               console.error("Błąd podczas usuwania polubienia:", e);
  //           }
  //       });
  //   } else {
  //       this.dataService.addLike(post.id).subscribe({
  //           next: () => {
  //               post.number_of_likes++; 
  //               post.is_liked = true; 
  //           },
  //           error: (e) => {
  //               console.error("Błąd podczas dodawania polubienia:", e);
  //           }
  //       });
  //   }
  // }


  // toggleFavorite(post: Post) {
  //   if (post.is_favorite) {
  //       this.dataService.removeFromFavorites(post.id).subscribe({
  //           next: () => {
  //               post.is_favorite = false;
  //               this.alertify.success("Usunięto post z ulubionych.");
  //           },
  //           error: (e) => {
  //               this.alertify.error("Błąd podczas usuwania z ulubionych.");
  //           }
  //       });
  //   } else {
  //       this.dataService.addToFavorites(post.id).subscribe({
  //           next: () => {
  //               post.is_favorite = true;
  //               this.alertify.success("Dodano post do ulubionych.");
  //           },t
  //           error: (e) => {
  //               this.alertify.error("Błąd podczas dodawania do ulubionych.");
  //           }
  //       });
  //   }
  // }


  toggleAction(post: Post, actionType: 'like' | 'favorite') {
    switch (actionType) {
        case 'like':
            if (post.is_liked) {
                this.dataService.removeLike(post.id).subscribe({
                    next: () => {
                        post.number_of_likes--; 
                        post.is_liked = false; 
                    },
                    error: (e) => {
                        this.alertify.error("Błąd podczas usuwania polubienia:");
                    }
                });
            } else {
                this.dataService.addLike(post.id).subscribe({
                    next: () => {
                        post.number_of_likes++; 
                        post.is_liked = true; 
                    },
                    error: (e) => {
                      this.alertify.error("Błąd podczas dodawania polubienia:");
                    }
                });
            }
            break;
        case 'favorite':
            if (post.is_favorite) {
                this.dataService.removeFromFavorites(post.id).subscribe({
                    next: () => {
                        post.is_favorite = false;
                        this.alertify.success("Usunięto post z ulubionych.");
                    },
                    error: (e) => {
                        this.alertify.error("Błąd podczas usuwania z ulubionych.");
                    }
                });
            } else {
                this.dataService.addToFavorites(post.id).subscribe({
                    next: () => {
                        post.is_favorite = true;
                        this.alertify.success("Dodano post do ulubionych.");
                    },
                    error: (e) => {
                        this.alertify.error("Błąd podczas dodawania do ulubionych.");
                    }
                });
            }
            break;
        default:
            console.error('Nieznany typ akcji:', actionType);
            break;
    }
  }



  sharePost(postId: number) {
    const postUrl = `${window.location.origin}/post/${postId}`;

    if (!postId) 
      return;
    this.copyToClipboard(postUrl);
    this.alertify.success('Link do postu został skopiowany do schowka!');
  }

  copyToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  } 

  removeFriend(user: any) {
    const message = `Czy na pewno chcesz usunąć tego znajomego? <strong>@${user.username}</strong>`;

    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.removeFriend(user.username).subscribe(response => {
        user.is_friend = false;
        this.refreshUserData(user.username);
      }, error => {
        console.error("Błąd podczas usuwania znajomego:", error);
      });
    });
  }
  
  deletePost(postId: number) {
    const message = `Czy na pewno chcesz usunąć ten post?`
    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.deletePost(postId).subscribe(() => {
        this.posts = this.posts.filter(post => post.id !== postId);
        this.alertify.success("Wpis został pomyślnie usunięty.");
      }, error => {
        this.alertify.error("Wystąpił błąd podczas usuwania wpisu.");
      });
    });
  }
  
  blockUser(username: string, postId: number ) {
    const message = `Czy na pewno chcesz zablokować tego użytkownika? <strong>@${username}</strong>`;
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
  
    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.blockUser(username).subscribe(response => {
        this.posts = this.posts.filter(p => p.post_author !== post.post_author);
        this.alertify.success(`Użytkownik @` + username + ` został zablokowany.`);
        this.loadMorePosts();
      }, error => {
        console.error('Error blocking user:', error);
      });
    });
  }
  
  isContextMenuShow(postId: number) {
    return this.showContextMenu[postId];
  }

  refreshTopPosts() {
    this.dataService.getData(this.firstUrl).subscribe(data => {
      const newPosts: any[] = data.results;
      const uniquePosts = newPosts.filter((newPost: any) => !this.posts.some((existingPost: any) => existingPost.id === newPost.id));
      this.posts.unshift(...uniquePosts);
    });
  }


  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.activePopover = null; 
    this.showTooltip = false;
  }  

  @HostListener('mouseup', ['$event'])
  handleMiddleClick(event: MouseEvent) {
    if (event.button === 1) { 
      event.preventDefault();
        const postElement = (event.target as HTMLElement).closest('.post');
        if (postElement) {
        const postId = postElement.getAttribute('data-post-id');
        if (postId) {
          this.openPostInNewTab(+postId); 
        }
      }
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.showContextMenu) {
      this.dropdownService.closeDropdown();
    }
  }

  @HostListener('mousedown', ['$event'])
  handleMouseDown(event: MouseEvent) {
    if (event.button === 1) { 
      event.preventDefault(); 
    }
  }

  //////
  renewToken(){
    const refreshToken = localStorage.getItem('refresh');
    if (refreshToken) {
      this.authService.renewToken(refreshToken).subscribe(response => {
        // Zaktualizuj tokeny w localStorage lub gdziekolwiek je przechowujesz
        localStorage.setItem('access', response.access);
        localStorage.setItem('refresh', response.refresh);
        this.tokenError = false;
        this.loadMorePosts();
        console.log(response.access, response.refresh)
      }, error => {
        console.error("Wystąpił błąd podczas odnawiania tokenu:", error);
      });
    } 
    else {
      console.error("Nie znaleziono tokenu odświeżania w localStorage.");
    }
  }

}
