import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, FormGroup, ValidatorFn, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../_services/auth.service';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, switchMap, map, distinctUntilChanged, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {
  public emailStatusMessage: string = ''; 
  public emailStatusChange: Subject<string> = new Subject<string>();

  public usernameStatusMessage: string = ''; 
  public usernameStatusChange: Subject<string> = new Subject<string>();
  
  constructor(private fb: FormBuilder, private authService: AuthService) {}

  createRegisterForm(): FormGroup {
    return this.fb.group({
      accountDetails: this.fb.group({
        email: ['', [Validators.required], [this.emailAsyncValidator.bind(this)]],
        password: ['', [Validators.required, this.passwordComplexityValidator]],
        password2: ['', Validators.required]
      }, {
        validators: Validators.compose([
            this.passwordsMatchValidator,
        ])
    }),
      personalDetails: this.fb.group({
        username: ['', [Validators.required],[this.usernameAsyncValidator.bind(this)]],
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        date_of_birth: ['', [Validators.required],]
      })
    });
  }

passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value || '';
    let requirements: string[] = [];

    if (!value || value.length < 8) {
      requirements.push(`${8 - value.length} znaków`);
    }

    if (!value.match(/[A-Z]/)) {
      requirements.push('1 wielkiej litery');
    }

    if (!value.match(/\d/)) {
      requirements.push('1 cyfry');
    }

    if (!value.match(/[\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\\\|\,\.<>\/\?~]/)) {
      requirements.push('1 znaku specjalnego');
    } 

    if (requirements.length === 0) {
      return null;    
    }

    let errorMessage: string = 'Hasło wymaga jeszcze conajmniej';
    let formattedErrors = requirements.slice(0, -1).join(', ') + (requirements.length > 1 ? ', ' : '') + requirements.pop();
    errorMessage += ' ' + formattedErrors + '.';

    return { 'passwordErrors': errorMessage };
}

  passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const fg = control as FormGroup;
    const password = fg.get('password')?.value;
    const password2 = fg.get('password2')?.value;

    if (!password || !password2) {
        return { mismatch: true };
    }

    if (password !== password2) {
        return { mismatch: true };
    }

    return null;
  }

  changePasswordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get('newPassword')?.value;
    const confirmNewPassword = control.get('confirmNewPassword')?.value;
  
    if (!newPassword || !confirmNewPassword) {
        return { mismatch: true };
    }
  
    if (newPassword !== confirmNewPassword) {
        return { mismatch: true };
    }
  
    return null;
  }
  

  emailAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    if (!control.value || !emailPattern.test(control.value)) {
      this.emailStatusMessage = '';
        return of({ invalidEmail: true });
    }
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.emailStatusMessage = '';
        this.emailStatusChange.next(this.emailStatusMessage);
      }),  
      switchMap(email => this.authService.checkEmail(email)),
      map(res => {
          if (res === "Email jest już zajęty") {
            this.emailStatusMessage = 'Email jest już zajęty';
            control.markAsTouched();
            control.markAsDirty();
            this.emailStatusChange.next(this.emailStatusMessage);
            return { emailTaken: true };
          }else if (res === "Email jest dostępny") {
            this.emailStatusMessage = 'Email jest dostępny';
            this.emailStatusChange.next(this.emailStatusMessage);
            return { emailTaken: false };
          }else {
            this.emailStatusMessage = '';
            return null;  
          }
          
      }),
      catchError(err => {
        console.error("Wystąpił błąd podczas sprawdzania e-maila:", err);
        this.emailStatusMessage = 'Nie można sprawdzić adresu e-mail. Spróbuj ponownie później.'; 
        return of({ emailCheckFailed: true });
      })
    );
  }
 
  usernameAsyncValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const usernamePattern = /^[A-Za-z0-9]{5,15}$/;
    if (!control.value || !usernamePattern.test(control.value)) {
      this.usernameStatusMessage = '';
        return of({ invalidUsername: true });
    }
    return control.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.usernameStatusMessage = '';
        this.usernameStatusChange.next(this.usernameStatusMessage);
      }),  
      switchMap(username => this.authService.checkUsername(username)),
      map(res => {
          if (res === "Nazwa użytkownika jest już zajęta") {
            this.usernameStatusMessage = 'Nazwa użytkownika jest już zajęta';
            control.markAsTouched();
            control.markAsDirty();
            this.usernameStatusChange.next(this.usernameStatusMessage);
            return { usernameTaken: true };
          }else if (res === "Nazwa użytkownika jest dostępna") {
            this.usernameStatusMessage = 'Nazwa użytkownika jest dostępna';
            this.usernameStatusChange.next(this.usernameStatusMessage);
            return { usernameTaken: false };
          }else {
            this.usernameStatusMessage = '';
            return null;  
          } 
      }),
      catchError(err => {
        console.error("Wystąpił błąd podczas sprawdzania nazwę użytkownika", err);
        this.usernameStatusMessage = 'Nie można sprawdzić adresu nazwę użytkownika. Spróbuj ponownie później.'; 
        return of({ usernameCheckFailed: true });
      })
    );
  }

  dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    const dob = new Date(control.value);
    const today = new Date();
    if (dob > today) {
      return { futureDate: true };
    }
    return null;
  }

  createChangePasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, this.passwordComplexityValidator]],
      confirmNewPassword: ['', Validators.required]
    }, {
      validators: this.changePasswordMatchValidator
    });
}

  
}
