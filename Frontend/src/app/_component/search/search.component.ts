import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { AuthService } from 'src/app/_services/auth.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User } from 'src/app/_models/User';
import { DropdownService } from 'src/app/_services/dropdown-service.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { Post } from 'src/app/_models/Post';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  public searchQuery: string = '';
  public searchResults: any[] = [];
  noResultsFound: boolean = false;
  public nextUrl: string | null = null;
  public isLoading: boolean = false;
  baseUrl = environment.apiUrl;
  loggedInUsername: string = '';
  private hideTimeoutId: any;
  activePopover: number | null = null;
  private isMouseInsidePopover: boolean = false;
  private userCache: { [username: string]: any } = {};
  isUserDataLoading: boolean = false;
  userDataLoadError: boolean = false;
  userInfoToShow$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  showContextMenu: any[] = [];
  private subscriptions: Subscription[] = [];
  showTooltip = false;



  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dataService: DataService,
    private authService: AuthService,
    private dropdownService: DropdownService,
    private alertify: AlertifyService,
    private modalCommService: ModalCommunicationService,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loggedInUsername = this.authService.decodedToken.username;

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      if (this.searchQuery) {
        this.searchResults = [];
        this.loadSearchResults();
      }
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


  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.router.navigate(['/explore']);
    } else {
      this.router.navigate(['/search'], { queryParams: { query: this.searchQuery } });
      this.loadSearchResults();
    }
  }

  loadSearchResults(page: number = 1, size: number = 30): void {
    const url = `/api/post/search/?search=${this.searchQuery}&page=${page}&size=${size}`;
    this.isLoading = true;

    this.dataService.getData(this.baseUrl + url).subscribe(data => {

      this.searchResults = [...this.searchResults, ...data.results];
      this.nextUrl = data.next;
      this.isLoading = false;

      this.noResultsFound = data.count === 0;
    }, error => {
      this.isLoading = false;
    });
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
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


  isContextMenuShow(postId: number) {
    return this.showContextMenu[postId];
  }


  loadMoreResults() {
    if (!this.nextUrl || this.isLoading) return;

    this.isLoading = true;

    this.dataService.getData(this.nextUrl).subscribe(data => {
      this.searchResults = [...this.searchResults, ...data.results];
      this.nextUrl = data.next;
      this.isLoading = false;
    }, error => {
      this.isLoading = false;
    });
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
    }, 5000);
  }

  private fetchUserData(username: string): void {
    this.isUserDataLoading = true;
    this.userDataLoadError = false;
    if (this.userCache[username]) {
      this.userInfoToShow$.next(new User(this.userCache[username]));
      this.isUserDataLoading = false;
    } else {
      this.dataService.sendHttpRequest('GET', `${this.baseUrl}/account/profile/${username}/`).subscribe(user => {
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

  openPostInNewTab(postId: number) {
    const a = document.createElement('a');
    a.href = `/post/${postId}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  goBack(): void {
    this.location.back();
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

  onTagClick(trend: string): void {
    this.router.navigate(['/search'], { queryParams: { query: trend } });
  }

  deleteRecord(id: number) {
    const message = `Czy na pewno chcesz usunąć ten wpis?`
    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.deletePost(id).subscribe(() => {
        this.alertify.success("Wpis został pomyślnie usunięty.");
        this.router.navigateByUrl('/home');
      }, error => {
        this.alertify.error("Wystąpił błąd podczas usuwania wpisu.");
      });
    });
  }

  blockUser(username: string, postId: number ) {
    const message = `Czy na pewno chcesz zablokować tego użytkownika? <strong>@${username}</strong>`;
    const post = this.searchResults.find((p: Post) => p.id === postId);
    if (!post) return;
  
    this.modalCommService.openModalWithAction(message, () => {
      this.dataService.blockUser(username).subscribe(response => {
        this.searchResults = this.searchResults.filter((p: Post) => p.post_author !== post.post_author);
        this.alertify.success(`Użytkownik @` + username + ` został zablokowany.`);
        
      }, error => {
        console.error('Error blocking user:', error);
      });
    });
  }

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

  private refreshUserData(username: string): void {
    this.dataService.getUserByUsername(username).subscribe(responseData => {
        const user = new User(responseData);
        this.userInfoToShow$.next(user);  
        this.userCache[username] = user;
    }, error => {
        console.error("Błąd podczas odświeżania danych użytkownika:", error);
    });
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

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(event: any) {
    this.activePopover = null; 
    this.showTooltip = false;
  }  

}
