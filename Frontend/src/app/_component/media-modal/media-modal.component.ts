import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { environment } from 'src/environments/environment.development';


@Component({
  selector: 'app-media-modal',
  templateUrl: './media-modal.component.html',
  styleUrls: ['./media-modal.component.css']
})

export class MediaModalComponent implements OnInit {
  
  post: any;
  isFullscreen: boolean = false;
  baseUrl = environment.apiUrl;
  imageError: boolean = false;
  isLoading: boolean = true;
  imageLoadError: boolean = false;


  imageUrl: string | null = null;
  postId: number | null = null;


  constructor(
    private modalDataService: ModalCommunicationService,
  ) {
    this.modalDataService._mediaModal$.subscribe(data => {
      this.imageUrl = data.imageUrl;
      if (this.imageUrl) {
          this.modalDataService.disableAppScroll();
          this.isLoading = true;
      } else {
          this.modalDataService.enableAppScroll();
      }
    });
  }



  ngOnInit(): void {}

  closeMediaModal() {
    this.modalDataService.closeMediaModal();
    this.modalDataService.enableAppScroll();
    this.isLoading = true;
    this.imageLoadError = false;
  }


  onImageLoad() {
    this.isLoading = false;
    this.imageLoadError = false;
  }

  onImageError() {
      this.isLoading = false;
      this.imageLoadError = true;
  }

  retryImageLoad(event:Event) {
    event.stopPropagation();
    this.isLoading = true;
    this.imageLoadError = false;
    this.imageUrl = this.imageUrl;
  }
}
