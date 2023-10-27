import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';
import { DataService } from 'src/app/_services/data.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { environment } from 'src/environments/environment.development';

@Component({
  selector: 'app-user-comment-list',
  templateUrl: './user-comment-list.component.html',
  styleUrls: ['./user-comment-list.component.css']
})
export class UserCommentListComponent {
  items: any[] = [];
  baseUrl = environment.apiUrl;
  isLoading: boolean = false;
  error = false;
  serverError = false;
  private nextUrl: string = '';
  loggedInUsername: string = ''; 
  username: string = '';
  viewType: 'posts' | 'comments' | 'media' | 'likes' = 'posts';

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
  }

  loadData() {
    if (!this.nextUrl || this.isLoading) return; 

    this.isLoading = true; 
    this.dataService.getData(this.nextUrl).subscribe(data => {
      if (this.items.length === 0) {
        this.items = [...data.results]; 
      } else {
        this.items = [...this.items, ...data.results]; 
      }
      this.nextUrl = data.next;
      this.isLoading = false; 
      this.serverError = false;
    }, error => {
      console.error("Error loading data:", error);
      this.isLoading = false;
      this.serverError = true;
    });
  }

  setViewType(type: 'posts' | 'comments' | 'media' | 'likes') {
    this.viewType = type;
    switch (type) {
      case 'posts':
        this.nextUrl = `${this.baseUrl}/api/post/${this.username}/`;
        break;
      case 'comments':
        this.nextUrl = `${this.baseUrl}/api/comments/${this.username}/`;
        break;
      case 'media':
        this.nextUrl = `${this.baseUrl}/api/post/${this.username}/media/`;
        break;
      case 'likes':
        this.nextUrl = `${this.baseUrl}/api/post/fav/${this.username}/`;
        break;
    }
    this.loadData();
  }

  onTabClick(type: 'posts' | 'comments' | 'media' | 'likes') {
    this.setViewType(type); // Ustawiamy odpowiedni typ widoku
    this.router.navigate(['/', this.username, type]); 
}
}