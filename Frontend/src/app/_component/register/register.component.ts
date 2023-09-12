import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { ValidatorsService } from 'src/app/_services/validators.service';
import { AlertifyService } from 'src/app/_services/alertify.service';



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent implements OnInit{
  showPassword = false;
  showPassword2 = false;
  model:any = {};
  errorMessages:any = {};
  obj:any;
  currentPage = 1;
  passwordTouched = false;
  passwordIsValid: boolean = false;
  usernameStatusMessage: string ="";
  emailStatusMessage: string ="";
  public emailErrorMessage: string = '';
  public isNextButtonDisabled: boolean = true;
  public isRegisterButtonDisabled: boolean = true;
  private emailStatusSubscription!: Subscription;
  private usernameStatusSubscription!: Subscription;

  passwordCheckMessage: string | null = null;


  registerForm!: FormGroup;

  constructor( private authService: AuthService, private validatorsService: ValidatorsService, private alertify: AlertifyService ) { }

  ngOnInit(): void {
    this.registerForm = this.validatorsService.createRegisterForm();

    this.emailStatusSubscription = this.validatorsService.emailStatusChange.subscribe(() => {
      this.updateEmailButtonState();
    });

    this.usernameStatusSubscription = this.validatorsService.usernameStatusChange.subscribe(() => {
      this.updateUsernameButtonState();
    });
  }

  get registerMode(): boolean {
    return this.authService.registerMode;
  }

  registerToggle(): void {
    this.authService.registerToggle();
  }

  get emailMessage(): string {
    return this.validatorsService.emailStatusMessage;
  }

  get usernameMessage(): string {
    return this.validatorsService.usernameStatusMessage;
  }

  updateEmailButtonState() {
    this.isNextButtonDisabled = !(
      this.validatorsService.emailStatusMessage === 'Email jest dostępny' 
    );
    console.log("isNextButtonDisabled", this.isNextButtonDisabled);
  }
  
  updateUsernameButtonState() {
    this.isRegisterButtonDisabled = !(
      this.validatorsService.usernameStatusMessage === 'Nazwa użytkownika jest dostępna' 
    );
    console.log("isRegisterButtonDisabled", this.isRegisterButtonDisabled);
  }
  
  onPasswordChange() {
    const passwordControl = this.registerForm.get('accountDetails.password');
    this.passwordIsValid = passwordControl ? !passwordControl.hasError('passwordErrors') : false;

  }

  goToPage(pageNumber: number): void {
    this.currentPage = pageNumber;
  }

  isPersonalDetailsIncomplete(): boolean {
    const personalDetails = this.registerForm.get('personalDetails');
    return !personalDetails?.get('username')?.value ||
           !personalDetails?.get('first_name')?.value ||
           !personalDetails?.get('last_name')?.value ||
           !personalDetails?.get('date_of_birth')?.value ||
           personalDetails?.invalid ||
           this.isRegisterButtonDisabled;
  }
  

  register() {
    const formValue = this.registerForm.value;
    const formData = {
      ...formValue.accountDetails,
      ...formValue.personalDetails
    };    
    
    this.authService.register(formData).subscribe({
      error: () => this.alertify.error('Wystąpił błąd rejestracji!'),
      complete: () => this.alertify.success('Rejestracja udana!')
    })
  }

  ngOnDestroy(): void {
    this.emailStatusSubscription.unsubscribe();
    this.usernameStatusSubscription.unsubscribe();
  }
}
