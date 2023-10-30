import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/_services/auth.service';
import { ModalCommunicationService } from 'src/app/_services/modal-communication-service.service';
import { PasswordConfirmModalComponent } from '../password-confirm-modal/password-confirm-modal.component';
import { Router } from '@angular/router';
import { DataService } from 'src/app/_services/data.service';


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {


  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    private modalCommService: ModalCommunicationService, 
    private router: Router,
    private dataService: DataService
  ){}

  ngOnInit(){
  
  }
  
  openDeactivateModal() {
    const modalRef = this.modalService.open(PasswordConfirmModalComponent);
    modalRef.result.then((passwordConfirmed) => {
      if (passwordConfirmed) {
        this.openDeleteConfirmationModal();
      }
    });
  }
  openDeleteConfirmationModal() {
    this.modalCommService.openModalWithAction(
      'Czy na pewno chcesz usunąć konto?', 
      () => {
        const username = this.authService.decodedToken.username;
        this.dataService.deleteAccount(username).subscribe(
            () => {
              this.authService.logout();
              this.router.navigate(['/home']);
            },
            error => {
              console.error('Wystąpił błąd podczas usuwania konta:', error);
            }
        );
      }
    );
  }
}
