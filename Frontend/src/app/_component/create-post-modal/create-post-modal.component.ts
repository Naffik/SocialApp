import { Component } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { DataService } from 'src/app/_services/data.service';
import { PostService } from 'src/app/_services/post-service.service';
import { AlertifyService } from 'src/app/_services/alertify.service';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.css']
})
export class CreatePostModalComponent {
  public postImage: File | null = null;
  public postImagePreview: string | null = null; // Dodane dla podglądu obrazu
  title: string | null = null;
  postText: string = '';
  maxCharacters: number = 300;
  tags: string[] = [];
  showTagTooltip: boolean = false;
  isPostSending: boolean = false;
  isError: boolean = false;

  constructor(
    public modalRef: MdbModalRef<CreatePostModalComponent>,
    private dataService: DataService,
    private postService: PostService,
    private alertify: AlertifyService
  ) {}
  

  adjustTextareaHeight(event: any) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto'; 
    textarea.style.height = textarea.scrollHeight + 'px'; 
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

  addNewTag() {
    const newTag = prompt('Wprowadź nowy tag:');
    if (newTag) {
        this.tags.push(newTag);
    }
  }

  removeTag(tagToRemove: string) {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }

  onImageSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.postImage = file;

      const reader = new FileReader();
      reader.onload = (e: any) => this.postImagePreview = e.target.result;
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

  removeImage() {
    this.postImage = null;
    this.postImagePreview = null;
  }


  onPublish() {
    if (this.tags.length === 0) {
      this.showTagTooltip = true;
    } else {
      this.showTagTooltip = false;
      this.isPostSending = true;

      const formData = new FormData();
      if (this.postImage) {
        formData.append('image', this.postImage, this.postImage.name);
      }
      this.tags.forEach(tag => formData.append('tags', tag));
      formData.append('content', this.postText);
  
      this.dataService.createPost(formData)
        .subscribe({
          next: (response) => { 
            this.handlePublishSuccess(response);
          },
          error: (e) => this.handlePublishError(e)
        });
    }
  }

  
  
  private handlePublishSuccess(response: any) {
    this.isPostSending = false;
    this.postService.postAdded(response);
    this.alertify.success('Post został opublikowany!');
    this.modalRef.close();
  }
  
  private handlePublishError(error: any) {
    this.isPostSending = false;
    this.isError = true;
    this.alertify.error('Wystąpił błąd, spróbuj ponownie później!');
  }
  
}
