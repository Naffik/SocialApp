import { Component, OnInit } from '@angular/core';
import { ValidatorsService } from 'src/app/_services/validators.service';
import { FormGroup } from '@angular/forms';
import { DataService } from 'src/app/_services/data.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  form: FormGroup; 
  successMessage: string = '';
  errorMessage: string = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private validatorsService: ValidatorsService, 
    private dataService: DataService,
    private location: Location
  ) {
    this.form = this.validatorsService.createChangePasswordForm(); 
  }

  ngOnInit(): void {}

  changePassword() {
    if (this.form.valid) {
      const passwords = {
        currentPassword: this.form.get('currentPassword')?.value,
        newPassword: this.form.get('newPassword')?.value,
        confirmNewPassword: this.form.get('confirmNewPassword')?.value
      };
      
      this.dataService.changePassword(passwords).subscribe(
        () => {
          this.successMessage = 'Hasło zostało zmienione';
          this.errorMessage = '';
          this.form.reset();
        },
        (error: any) => {
          if (error?.error?.message === "Nieprawidłowe hasło") {
            this.errorMessage = 'Podane hasło jest nieprawidłowe';
          } else {
            this.errorMessage = 'Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie później.';
          }
          this.successMessage = '';
        }
      );
    }
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goBack(): void {
    this.location.back();
  }
}
