import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../_services/auth.service';
import { Subject, Subscription, debounceTime } from 'rxjs';

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
  emailStatusMessage: string ="";
  

  private usernameSubject = new Subject<string>();
  private usernameSubscription: Subscription | undefined;


  hasError = {
    username: false,
    email: false,
    password: false,
    password2: false
  };
  

  constructor(private authService: AuthService){}

  ngOnInit(): void {
    this.usernameSubscription = this.usernameSubject.pipe(
      debounceTime(1000)
    ).subscribe(username => {
      this.authService.checkUsername(username).subscribe(isTaken => {
        console.log(isTaken);
        this.emailStatusMessage = isTaken;
        console.log(this.emailStatusMessage);

      });
    });
  }



  goToPage(pageNumber: number): void {
    this.currentPage = pageNumber;
  }

  register() {
    this.authService.register(this.model).subscribe({
      error: (e) => console.error('Wystąpił błąd logowania', e),
      complete: () => alert('Zarejestrowałeś się, brawo!')
    })
  }

  // onUsernameInput(): void {
  //   if (this.model.username) {
  //     this.authService.checkUsername(this.model.username).subscribe(isTaken => {
  //       this.isUsernameTaken = isTaken;
  //     });
  //   }
  // }

  ngOnDestroy(): void {
    if (this.usernameSubscription) {
      this.usernameSubscription.unsubscribe();
    }
  }

  onUsernameInput(): void {
    this.usernameSubject.next(this.model.email);
  }
  
  getMessageClass() {
    return this.emailStatusMessage === 'Error' ? 'error-style' : 'success-style';
  }


}
