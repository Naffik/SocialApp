import { Component, HostListener, OnInit, Inject } from '@angular/core';
import { DataService } from '../../_services/data.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


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
  userInfoCache: { [key: string]: any } = {};

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

    console.log(this.posts)
  }

  onUsernameEnter(username: string) {
    this.activeUsername = username;
    if (!this.userInfoCache[username]) {
      this.dataService.fetchUserInfo(username).subscribe(userInfo => {
        this.userInfoCache[username] = userInfo;
      });
    }
  }

  onUsernameLeave() {
    this.activeUsername = null;
  }

  getActiveUserInfo() {
    if (this.activeUsername) {
        return this.userInfoCache[this.activeUsername];
    }
    return null;
}

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      this.loadMorePosts();
    }
  }
}
