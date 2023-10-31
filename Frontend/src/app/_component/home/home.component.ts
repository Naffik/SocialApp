import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { environment } from 'src/environments/environment.development';
import { CreatePostModalComponent } from '../create-post-modal/create-post-modal.component';
import { AuthService } from 'src/app/_services/auth.service';
import { Router } from '@angular/router';
import { DropdownService } from 'src/app/_services/dropdown-service.service';
import { Observable, Subscription } from 'rxjs';
import { ContentComponent } from '../content/content.component';
import { PostService } from 'src/app/_services/post-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  @ViewChild(ContentComponent, { static: false }) contentComponent!: ContentComponent;
  modalRef: MdbModalRef<CreatePostModalComponent> | null = null;
  private subscriptions: Subscription[] = [];
  public currentUserData$: Observable<any>;
  public currentUserData: any;
  



  constructor(
    private alertify: AlertifyService, 
    private modalService: MdbModalService,
    public authService: AuthService,
    private router: Router,
    private dropdownService: DropdownService,
    private postService: PostService
  ){
    this.currentUserData$ = this.authService.userData$;
  }


  window = window;
  showSideMenu: boolean = false;
  baseUrl = environment.apiUrl;
  showDropdown: boolean = false;
  trends: any[] = [];
  loggedUsername: string = '';
  loggedAvatar: string = '';
  isOnChatRoute: boolean = false;
  searchQuery: string = '';




  ngOnInit(): void {
    this.authService.userData$.subscribe(data => {
      this.currentUserData = data;
    });
  
    const sub = this.dropdownService.activeDropdown.subscribe(activeId => {
      if (activeId !== 'homeDropdown') {
        this.showDropdown = false;
      } else {
        this.showDropdown = true;
      }
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  logout(){
    this.authService.logout();
  }
  openNav() {
    const sidenav = document.getElementById("mySidenav");
    if (sidenav) {
        sidenav.style.width = "250px";
    }
  }

  closeNav() {
      const sidenav = document.getElementById("mySidenav");
      if (sidenav) {
          sidenav.style.width = "0";
      }
  }
  

  toggleSideMenu() {
    this.showSideMenu = !this.showSideMenu;
  }

  redirectToSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { query: this.searchQuery } });
      this.searchQuery = ''; 
    }
  }


  openCreatePostModal() {
    this.modalRef = this.modalService.open(CreatePostModalComponent, {
      modalClass: 'custom-modal-width'
    });
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    if (this.showDropdown) {
      this.dropdownService.closeDropdown();
    } else {
      this.dropdownService.openDropdown('homeDropdown');
    }
  }
  
  onHomeIconClick() {
    if (window.scrollY === 0) {
      this.postService.triggerRefresh();
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
}

  @HostListener('document:click', ['$event'])
    clickOutside(event: Event) {
      this.dropdownService.closeDropdown();
    }
}
