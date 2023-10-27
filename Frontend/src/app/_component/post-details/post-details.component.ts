import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../_services/data.service';
import { environment } from 'src/environments/environment.development';
import { AuthService } from 'src/app/_services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PostService } from 'src/app/_services/post-service.service';
import { User } from 'src/app/_models/User';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { DropdownService } from 'src/app/_services/dropdown-service.service';
import { Post } from 'src/app/_models/Post';


@Component({
  selector: 'app-post-details',
  templateUrl: './post-details.component.html',
  styleUrls: ['./post-details.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class PostDetailsComponent implements OnInit {

  private subscriptions: Subscription[] = [];


  public postImage: File | null = null;
  title: string | null = null;
  postText: string = '';
  maxCharacters: number = 300;
  tags: string[] = [];
  showTagTooltip: boolean = false;
  textareaExpanded = false;
  characterCount = 0;
  maxCharacterCount = 300;
  private hideTimeoutId: any;
  showContextMenu: any[] = [];
  showTooltip = false;
  public postImagePreview: string | null = null; // Dodane dla podglądu obrazu




  isButtonDisabled = true;

  baseUrl = environment.apiUrl;
  loggedInUsername: string = ''; 
  isUserDataLoading: boolean = false;
  userDataLoadError: boolean = false;
  activePopover: number | null = null;
  userInfoToShow$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  private userCache: { [username: string]: any } = {};
  private isMouseInsidePopover: boolean = false;


  post: any;
  comments: any[] = [];
  isLoading: boolean = false;
  isDataLoading: boolean = false;
  isPostSending: boolean = false;
  isPostError: boolean = false;
  postExists: boolean = true;
  private nextUrl: string = '';
  private postId: number | null = null;

  public currentUserData$: Observable<any>;
  public currentUserData: any;

  constructor(
    private route: ActivatedRoute, 
    private dataService: DataService,
    public authService: AuthService,
    private alertify: AlertifyService,
    private modalCommService: ModalCommunicationService,
    private cdRef: ChangeDetectorRef, 
    private dropdownService: DropdownService,
    private router: Router
  ) { 
      this.currentUserData$ = this.authService.userData$;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.postId = params['postId'];
      if(this.postId) {
        this.nextUrl = this.baseUrl + `/api/post/${this.postId}/comments/?page=1&size=15`; 
        this.loadPostDetails(this.postId);
        this.loadMoreComments();
      } else {
          // this.error=true;
      }
    });
    this.authService.userData$.subscribe(data => {
      this.currentUserData = data;
    });

    this.loggedInUsername = this.authService.decodedToken.username;

    const friendRemovedSubscription = this.modalCommService.friendRemoved$.subscribe(username => {
      this.refreshUserData(username);
    });

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

  loadPostDetails(postId: number) {
    if (this.isDataLoading) return; 
    
    this.isDataLoading = true;

    this.dataService.getData(`${this.baseUrl}/api/post/${postId}/`).subscribe(data => {
      this.post = data;
      this.isDataLoading=false;
    }, error => {
      if (error.status === 404) {
        this.postExists = false;
      }
      console.error("Wystąpił błąd podczas ładowania szczegółów postu:", error);
      this.isDataLoading=false;
    });
  }

  loadMoreComments() {
    if (!this.nextUrl || this.isLoading) return;
  
    this.isLoading = true;
  
    this.dataService.getData(this.nextUrl).subscribe(data => {
      if (this.comments.length === 0) {
        this.comments = [...data.results];
      } else {
        this.comments = [...this.comments, ...data.results];
      }
      this.nextUrl = data.next;
      this.isLoading = false;
    }, error => {
      // obsługa błędów
      this.isLoading = false;
    });
  }
  
  removeImage() {
    this.postImage = null;
    this.postImagePreview = null;
    this.updateCharacterCount();  
}

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
        this.postImage = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.postImagePreview = e.target.result;
            this.updateCharacterCount();  // Aktualizuj stan przycisku
        };
        reader.readAsDataURL(file);
    }
  }


  
  imageChanged(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.postImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.postImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }


  isContextMenuShow(postId: number) {
    return this.showContextMenu[postId];
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

  hideContextMenu(postId: number) {
    this.showContextMenu[postId] = false;
  }

  addFollow(user: any) {
    this.dataService.dataFollow(user.username, this.baseUrl + "/account/friends/add_follow/").subscribe(() => {
        user.follow = true;
        this.refreshUserData(user.username); 
        this.cdRef.detectChanges();  
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

  toggleAction(post: any, actionType: 'like' | 'favorite') {
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

  blockUser(username: string, postId: number ) {
    const message = `Czy na pewno chcesz zablokować tego użytkownika? <strong>@${username}</strong>`;
    const post = this.post.find((p: Post) => p.id === postId);
    if (!post) return;
  
    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.blockUser(username).subscribe(response => {
        this.post = this.post.filter((p: Post) => p.post_author !== post.post_author);
        this.alertify.success(`Użytkownik @` + username + ` został zablokowany.`);
        
      }, error => {
        console.error('Error blocking user:', error);
      });
    });
  }

  deleteRecord(type: string, id: number) {
    const message = `Czy na pewno chcesz usunąć ten wpis?`
    this.modalCommService.openModalWithAction(message, () => {
      if(type==="post"){
        this.dataService.deletePost(id).subscribe(() => {
          this.alertify.success("Wpis został pomyślnie usunięty.");
          this.router.navigateByUrl('/home');
        }, error => {
          this.alertify.error("Wystąpił błąd podczas usuwania wpisu.");
        });
      }else if(type==="comment"){
        this.dataService.deleteComment(id).subscribe(() => {
          this.comments = this.comments.filter(comment => comment.id !== id);
          this.alertify.success("Wpis został pomyślnie usunięty.");
        }, error => {
          this.alertify.error("Wystąpił błąd podczas usuwania wpisu.");
        });

      }
    });
  }

  toggleContextMenu(postId: number) {
    this.showContextMenu[postId] = !this.showContextMenu[postId];
    if (this.showContextMenu[postId]) {
        this.dropdownService.openDropdown('contentComponent');
    } else {
        this.dropdownService.closeDropdown();
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

  private refreshUserData(username: string): void {
    this.dataService.getUserByUsername(username).subscribe(responseData => {
        const user = new User(responseData);
        this.userInfoToShow$.next(user);  
        this.userCache[username] = user;
    }, error => {
        console.error("Błąd podczas odświeżania danych użytkownika:", error);
    });
  }

  
  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  adjustTextareaHeight(event: any) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; // reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // adjust to content
  }

  remainingCharacters(): number {
    return this.maxCharacters - this.postText.length;
  }

  isOverLimit(): boolean {
    return this.postText.length > this.maxCharacters;
  }

  circleOffset(): string {
    const percentage = (this.postText.length / this.maxCharacters) * 150;
    return `${150 - percentage}px`;
  }

  addTagToText(tag: string) {
    this.postText += ' ' + tag;
  }

  onPublish() {
    this.isPostSending = true;

    const trimmedText = this.postText.trim();

    if (this.postId !== null && trimmedText.length > 0  || this.postImage) {
      const formData = new FormData();
      if (this.postImage) {
        formData.append('image', this.postImage, this.postImage.name);
      }
      formData.append('content', trimmedText);
  

      this.dataService.createComment(this.postId as number, formData)
      .subscribe({
        next: (response) => this.handleCommentPublishSuccess(response),
        error: (e) => this.handleCommentPublishError(e)
      });
    }
  }

  private handleCommentPublishSuccess(response: any) {
      this.isPostSending = false;
      this.isPostError = false;
      this.postText = ''; 
      this.updateCharacterCount();
      this.post.number_of_comments++;
      this.comments.unshift(response);
      this.alertify.success('Komentarz dodany!');
  }

  private handleCommentPublishError(error: any) {
      this.isPostSending = false;
      this.isPostError = true;
      this.alertify.error('Wystąpił błąd, spróbuj ponownie później!');
  }

  

  toggleLike(post: any) {
    if (post.is_liked) {
      // Jeśli post jest już polubiony, usuń polubienie
      this.dataService.removeLike(post.id).subscribe(() => {
        post.number_of_likes--; // Zmniejsz liczbę polubień
        post.is_liked = false; // Ustaw flagę polubienia na false
      }, error => {
        console.error("Błąd podczas usuwania polubienia:", error);
      });
    } else {
      // Jeśli post nie jest polubiony, dodaj polubienie
      this.dataService.addLike(post.id).subscribe(() => {
        post.number_of_likes++; // Zwiększ liczbę polubień
        post.is_liked = true; // Ustaw flagę polubienia na true
      }, error => {
        console.error("Błąd podczas dodawania polubienia:", error);
      });
    }
  }
  

  expandTextarea() {
    const textarea = document.querySelector('textarea');
    textarea?.classList.add('active');
    this.textareaExpanded = true;

  }

  updateCharacterCount() {
    this.isButtonDisabled = !(this.postText.trim().length > 0 || !!this.postImagePreview);
  }

  shrinkTextarea() {
    const textarea = document.querySelector('textarea');
    textarea?.classList.remove('active');
  }

  openMediaModal(imageUrl: string) {
    this.modalCommService.openMediaModal(imageUrl);
  }

  closeImageModal() {
    this.modalCommService.closeMediaModal();
  }

  isActivePost(post: any): boolean {
    return this.activePopover === post.post_author;
  }
  
  showPopover(postId: number, username: string): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }
    if (this.activePopover !== postId) {
      this.activePopover = null; 
      setTimeout(() => {
        this.activePopover = postId; 
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
        this.userDataLoadError = true; 
      });
    }
  }
  
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.activePopover = null; 
    this.showTooltip = false;
  }  

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.showContextMenu) {
      this.dropdownService.closeDropdown();
    }
  }

}
  
  