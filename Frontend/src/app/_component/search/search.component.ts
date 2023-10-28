import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { DataService } from 'src/app/_services/data.service';
import { environment } from 'src/environments/environment.development';
import { AuthService } from 'src/app/_services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { User } from 'src/app/_models/User';
import { DropdownService } from 'src/app/_services/dropdown-service.service';
import { AlertifyService } from 'src/app/_services/alertify.service';


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {
  public searchQuery: string = '';
  public searchResults: any[] = [];
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







  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dataService: DataService,
    private authService: AuthService,
    private dropdownService: DropdownService,
    private alertify: AlertifyService

  ) { }

  ngOnInit(): void {
    this.loggedInUsername = this.authService.decodedToken.username;

    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      if (this.searchQuery) {
        // Pobierz wyniki z serwera za pomocą zapytania
        // Na razie zakładam, że masz tu jakieś dane
        this.searchResults = []; // Pobierz dane z serwera na podstawie searchQuery
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.router.navigate(['/explore']);
    } else {console.log(this.searchQuery)
      this.router.navigate(['/search'], { queryParams: { query: this.searchQuery } });
      this.loadSearchResults();
    }
  }

  loadSearchResults(page: number = 1, size: number = 20): void {
    const url = `/api/post/search/?search=${this.searchQuery}&page=${page}&size=${size}`;
    this.isLoading = true;
    
    this.dataService.getData(this.baseUrl+ url).subscribe(data => {
      this.searchResults = [...this.searchResults, ...data.results];
      this.nextUrl = data.next;
      this.isLoading = false;
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


  toggleContextMenu(postId: number) {
    this.showContextMenu[postId] = !this.showContextMenu[postId];
    if (this.showContextMenu[postId]) {
        this.dropdownService.openDropdown('contentComponent');
    } else {
        this.dropdownService.closeDropdown();
    }
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

  goBack(): void {
    this.location.back();
  }
}
