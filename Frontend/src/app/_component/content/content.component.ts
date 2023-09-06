import { Component, HostListener, OnInit, Inject } from '@angular/core';
import { DataService } from '../../_services/data.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, Subject, tap } from 'rxjs';


@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {

  posts: any[] = [];
  nextUrl: string | undefined;
  baseUrl: string = 'http://127.0.0.1:8000';
  isLoading: boolean = false;
  activeUsername: string | null = null;
  showTooltip = false;
  userInfoToShow$: BehaviorSubject<any> = new BehaviorSubject(null);
  isPopoverVisible = false;
  popoverTop: string = '0px';
  popoverLeft: string = '0px';
  activePopover: string | null = null;
  visiblePopovers: { [username: string]: boolean } = {};
  private userCache: { [username: string]: any } = {};


  activePost: any = null; // przechowuje aktywny post zamiast nazwy użytkownika


  

  constructor(private dataService: DataService, private http: HttpClient) { }

  ngOnInit() {
    this.nextUrl = 'http://127.0.0.1:8000/api/post/?page=1&size=10';
    this.loadMorePosts();

  }

  loadMorePosts() {
    if (!this.nextUrl || this.isLoading) return; // Check for loading state

    this.isLoading = true; // Set loading state to true

    this.dataService.getPosts(this.nextUrl).subscribe(data => {
      if (this.posts.length === 0) {
        this.posts = [...data.results];
      } else {
        this.posts = [...this.posts, ...data.results];
      }
      this.nextUrl = data.next;
      this.isLoading = false; // Set loading state to false
    }, error => {
      console.error("Wystąpił błąd podczas ładowania postów:", error);
      this.isLoading = false;
    });
  }

  isActivePost(post: any): boolean {
    return this.activePopover === post.post_author;
 }

  onUsernameEnter(post: any, event: MouseEvent): void {
    this.activePost = post;
    this.isPopoverVisible=true;
    this.activePopover = post.id; // Używamy ID posta zamiast post.post_author
    console.log("Active Popover: ", this.activePopover);
    console.log('isPopoverVisible set to:', this.isPopoverVisible); // Dodaj to
    this.fetchUserInfo(post.post_author).subscribe(
      userInfo => {
        console.log('Fetched user info:', userInfo); // Dodaj to
        this.userInfoToShow$.next(userInfo);
        this.setPopoverPosition(event);
      },
      err => {
        console.error(err);
      }
    );
  }

  hidePopover(): void {
    this.activePost = null;
    this.userInfoToShow$.next(null);
  }

  setPopoverPosition(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    this.popoverTop = (targetElement.getBoundingClientRect().bottom + window.scrollY) + 'px';
    this.popoverLeft = (targetElement.getBoundingClientRect().left + window.scrollX) + 'px';
    console.log(targetElement)
  }


  fetchUserInfo(username: string): Observable<any> {
    if (this.userCache[username]) {
      return of(this.userCache[username]);
  }
    return this.http.get<any>(`${this.baseUrl}/account/profile/${username}/`).pipe(
      tap(userInfo => {
        this.userCache[username] = userInfo;
        this.addToCache(username, userInfo);
      })
    );
  }

private addToCache(username: string, data: any): void {
  this.userCache[username] = data;
  setTimeout(() => {
      delete this.userCache[username];
  }, 60000); // Usuń z pamięci podręcznej po 60 sekundach
}

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      this.loadMorePosts();
    }
  }
}
