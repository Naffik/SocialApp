import { Component } from '@angular/core';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/_services/auth.service';


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {


  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
  ){}

  ngOnInit(){
  
  }
  
  openDeactivateModal() {
    const modalRef = this.modalService.open(EditProfileModalComponent);
  }
}
