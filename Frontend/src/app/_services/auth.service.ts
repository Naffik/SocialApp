import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { catchError} from 'rxjs/operators';
import { environment } from 'src/environments/environment.development';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { AlertifyService } from './alertify.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService{
  jwtHelper = new JwtHelperService();
  decodedToken: any;
  tokenError: boolean = false;
  private tokenExpiryTime: number | null = null;

  private userDataSubject = new BehaviorSubject<any>(null);
  public userData$ = this.userDataSubject.asObservable();


  baseUrl = environment.apiUrl + '/account/';

  values:any;
  registerMode = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertify: AlertifyService
  ) {
      this.retrieveUserDataFromLocalStorage();

   }

  registerToggle(){
    this.registerMode = !this.registerMode;
  }

  register(model:any){
    return this.http.post(this.baseUrl + "register/", model)
  }


  checkUsername(username: string): Observable<string> {
    return this.http.get<boolean>(this.baseUrl + "username-check/", { params: { username } }).pipe(
      map((response: any) => {    
        if (response.message === "Username is available") {
          return "Nazwa użytkownika jest dostępna";
        } else {
          return "Nazwa użytkownika jest już zajęta";
        }
      }),
      catchError(() => of("Error occurred"))
    );
  }

  checkEmail(email: string): Observable<string> {
    return this.http.get<boolean>(this.baseUrl + "email-check/", { params: { email } }).pipe(
      map((response: any) => {    
        if (response.message === "Email is available") {
          return "Email jest dostępny";
        } else {
          return "Email jest już zajęty";
        }
      }),
      catchError(() => of("Error occurred"))
    );
  }

  login(model: any) {
    return this.http.post(this.baseUrl + "api/token/", model)
      .pipe(map((response: any) => {
        const user = response;
        if (user) {
          localStorage.setItem('access', user.access);
          localStorage.setItem('refresh', user.refresh);
          this.decodedToken = this.jwtHelper.decodeToken(user.access);
          this.tokenExpiryTime = this.decodedToken.exp * 1000; // token.exp jest w sekundach, więc przelicz na milisekundy
          // this.scheduleTokenRefresh();

          this.setUserData(this.decodedToken);
        }
      }))
  }

  setUserData(decodedToken: any) {
    const userData = {
        username: decodedToken.username,
        avatar: decodedToken.avatar || decodedToken.avatar_url,
        name: decodedToken.name,
        lastName: decodedToken.last
    };
    console.log(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
    this.userDataSubject.next(userData);
}


  retrieveUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.userDataSubject.next(userData);
    }
  }

  logout(){
    window.localStorage.clear();
    this.alertify.message("Wylogowano pomyslnie.");
  }
  
  renewToken(refreshToken: string): Observable<any> {
    const body = { refresh: refreshToken };
    return this.http.post(this.baseUrl+ "api/token/refresh/", body);
  }

  // setToken(token: any): void {
  //   this.tokenExpiryTime = token.exp * 1000; // token.exp jest w sekundach, więc przelicz na milisekundy
  //   this.scheduleTokenRefresh();
  // }

  getUserData(): any {
    if (!this.userDataSubject.value) {   // <-- Changed to userDataSubject
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (storedUserData && storedUserData.username) {
        return storedUserData;
      }
    } else {
      return this.userDataSubject.value;  // <-- Changed to userDataSubject
    }
    return null;
  }
  

  loggedIn() {
    const token = localStorage.getItem("access");
    const isLoggedIn = !!token;
    return isLoggedIn;
}

  //??//
  // private scheduleTokenRefresh(): void {
  //   if (!this.tokenExpiryTime) return;

  //   const now = Date.now();
  //   const tokenDuration = this.tokenExpiryTime - now;
  //   const refreshBeforeExpiry = 60000;
  //   const accessToken = localStorage.getItem('access');

  //   if (accessToken) {
  //     const expirationDate = this.jwtHelper.getTokenExpirationDate(accessToken);
  //     if (expirationDate) {
  //         this.tokenExpiryTime = expirationDate.getTime();
  //     } else {
  //         console.error("Unable to get token expiration date.");
  //         return;
  //     }
  //   } else {
  //       console.error("Access token is null or undefined.");
  //   }
  //   if (tokenDuration > refreshBeforeExpiry) {
  //     setTimeout(() => {
  //       const refreshToken = localStorage.getItem('refresh');
  //       if (refreshToken) {
  //         this.renewToken(refreshToken).subscribe(newToken => {
  //           localStorage.setItem('access', newToken.access);
  //           localStorage.setItem('refresh', newToken.refresh);
  //           this.decodedToken = this.jwtHelper.decodeToken(newToken.access);
  //           this.scheduleTokenRefresh();
  //           console.log("XD");
  //         }, error => {
  //           console.error("Error renewing the token:", error);
  //         });
  //       }
  //     }, tokenDuration - refreshBeforeExpiry);
  //   }
// }

}
