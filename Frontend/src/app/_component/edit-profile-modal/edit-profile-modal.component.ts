import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { environment } from 'src/environments/environment.development';
import { DataService } from 'src/app/_services/data.service';
import { AuthService } from 'src/app/_services/auth.service';
import { AlertifyService } from 'src/app/_services/alertify.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { User } from 'src/app/_models/User';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.css']
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  profileForm: FormGroup;
  baseUrl = environment.apiUrl;
  selectedAvatarFile: File | null = null;
  avatarPreview: string | null | undefined
  imageChangedEvent: any = '';
  isCropping: boolean = false;
  private loggedUsername: string = '';

  @Input() userData!: User;
  cd: any;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private alertify: AlertifyService,
    private modalCommService: ModalCommunicationService
  ) {
    this.profileForm = this.initForm();
  }

  ngOnInit(): void {
    if (this.userData) {
      this.updateFormValues(this.userData);
    }
    this.loggedUsername = this.authService.decodedToken.username;
  }

  ngOnChanges(): void {
    if (this.userData) {
      this.updateFormValues(this.userData);
    }
  }

  initForm(data?: User): FormGroup {
    return this.fb.group({
        first_name: [data?.first_name || '', [Validators.required, Validators.maxLength(15)]],
        last_name: [data?.last_name || '', [Validators.required, Validators.maxLength(15)]],
        display_name: [data?.display_name || '', [Validators.required, Validators.minLength(5), Validators.maxLength(15)]],
        bio: [data?.bio || ''],
        avatar_url: [data?.avatar_url || '']
    });
  }

  updateFormValues(data: User) {
    this.profileForm.patchValue({
      first_name: data.first_name,
      last_name: data.last_name,
      display_name: data.display_name,
      bio: data.bio,
      avatar_url: data.avatar_url
    });
  }

  onAvatarSelected(event: any) {
    this.imageChangedEvent = event;
    this.isCropping = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.avatarPreview = event.objectUrl;
    if(event.blob) {
      const timestamp = Date.now();
      const newAvatarName = `${this.loggedUsername}_avatar_${timestamp}.png`;
      this.selectedAvatarFile = new File([event.blob], newAvatarName, { type: "image/png" });
    }
  }

  imageLoaded() {
  }

  cropperReady() {
  }

  loadImageFailed() {
    this.alertify.error('Nie udało się przesłać obrazka. Spróbuj ponownie.');
  }

  applyCroppedImage() {
    this.isCropping = false;
  }

  cancelCropping() {
    this.isCropping = false;
    this.imageChangedEvent = null;
    this.avatarPreview = null;
  }

  chooseAvatar() {
    document.getElementById('avatarInput')?.click();
  }

  closeModal() {
    this.activeModal.close();
  }

  onSave() {
    const formData = new FormData();

    if (this.selectedAvatarFile) {
      formData.append('avatar', this.selectedAvatarFile, this.selectedAvatarFile.name);
        console.log(formData);
    }

    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      if (control) {
        formData.append(key, control.value);
        console.log(formData);
      }
    });
  
    this.dataService.updateProfile(this.loggedUsername, formData)
    .subscribe({
      next: (response) => {
        this.authService.setUserData(response); 
      },
      complete: () => {
        this.alertify.success('Profil zaktualizowany pomyślnie!');
        this.modalCommService.profileUpdated.next();
        this.closeModal();
      },
      error: (e) => {
        this.alertify.error('Błąd podczas aktualizacji profilu:');
      }
    });
  }
}