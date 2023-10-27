import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { DataService } from './data.service';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ConfirmDialogComponent } from '../_component/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ModalCommunicationService {
  modalRef: MdbModalRef<ConfirmDialogComponent> | null = null;
  private _modalMessage = new BehaviorSubject<string>('');
  modalMessage$ = this._modalMessage.asObservable();
  friendRemoved$ = new Subject<string>();
  

  private _userData = new BehaviorSubject<any>(null);
  private _mediaModal = new Subject<{ imageUrl: string | null }>();

  userData$ = this._userData.asObservable();
  _mediaModal$ = this._mediaModal.asObservable();

  
  private _confirmAction = new Subject<void>();
  confirmAction$ = this._confirmAction.asObservable();

  public profileUpdated: Subject<void> = new Subject<void>();

  constructor(
    private modalService: MdbModalService,
  ) {}



  confirm() {
    this._confirmAction.next();
  }

  setUserData(user: any) {
    this._userData.next(user);
  }

  openModalWithAction(message: string, action: () => void) {
    this._modalMessage.next(message);
    document.body.classList.add('modal-open');
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {
      modalClass: 'modal-dialog-centered'
    });

    const subscription = this.confirmAction$.subscribe(() => {
      action(); // Wywołanie przekazanej funkcji
      subscription.unsubscribe();
    });
  }

  openMediaModal(imageUrl: string) {
    console.log(imageUrl)
    this._mediaModal.next({ imageUrl});
  } 

  closeMediaModal() {
    this._mediaModal.next({ imageUrl: null});
  }

  
  disableAppScroll() {
    document.body.style.overflow = 'hidden';
}

  enableAppScroll() {
      document.body.style.overflow = '';
  }
}
