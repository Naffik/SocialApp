import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MdbModalRef } from 'mdb-angular-ui-kit/modal';
import { DataService } from 'src/app/_services/data.service';

@Component({
  selector: 'app-password-confirm-modal',
  templateUrl: './password-confirm-modal.component.html',
  styleUrls: ['./password-confirm-modal.component.css']
})
export class PasswordConfirmModalComponent {
  public password: string = '';
  public incorrectPassword: boolean = false;
  public errorMessage: string = '';


  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService
  ) {}

  checkPassword() {
    if (!this.password.trim()) {
        this.errorMessage = "Hasło nie może być puste!";
        return;
    }
    
    this.dataService.checkPassword(this.password).subscribe((response: any) => {
      if (response.message) { 
        this.activeModal.close(true);
      } else {
        this.incorrectPassword = true;
      }
    }, error => {
      this.errorMessage = "Brak połączenia z serwerem. Spróbuj ponownie później.";
    });
  }    

  onCancel() {
    this.activeModal.close(false);
  }
}
