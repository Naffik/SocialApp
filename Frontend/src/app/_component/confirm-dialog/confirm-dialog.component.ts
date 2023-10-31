import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})

export class ConfirmDialogComponent {
  public user: any;
  public message?: SafeHtml;


  constructor(
    public modalRef: MdbModalRef<ConfirmDialogComponent>, 
    private modalCommService: ModalCommunicationService,
    private sanitizer: DomSanitizer
  ) {}


  ngOnInit(){
    this.modalCommService.modalMessage$.subscribe(rawMessage => {
      this.message = this.sanitizer.bypassSecurityTrustHtml(rawMessage);
    });
  }

  onConfirm() {
    this.modalCommService.confirm();
    document.body.classList.remove('modal-open');
    this.modalRef.close();
  }
  
}
