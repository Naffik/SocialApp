import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit {

  baseUrl = "http://127.0.0.1:8000/";

  values:any;
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // this.getValues();
  }

  login(model:any){
    return this.http.post(this.baseUrl + "account/api/token/", model)
      .pipe(map((response: any) =>{
        const user = response;
        if(user){
          localStorage.setItem('access', user.access);
          localStorage.setItem('refresh', user.refresh);
        }
    }))
  }

  register(model:any){
    return this.http.post(this.baseUrl + "account/register/", model)
  }

  checkUsername(email: string): Observable<string> {
    return this.http.get<boolean>(this.baseUrl + "account/email-check/", { params: { email } }).pipe(
      map((response: any) => {    
        console.log(response.message);
        if (response.message === "Email is available") {
          return "Email jest dostępny";
        } else {
          return "Email jest już zajęty";
        }
      }),
      catchError(() => of("Error occurred"))
    );
  }

    // checkUsername(email: string): Observable<string> {
  //   console.log(email);
  //   return this.http.get<boolean>(this.baseUrl + "account/email-check/", { params: { email } }).pipe(
  //     map((response: any) => {
  //       return response.message 
  //     }),
  //     catchError(() => of("Error occurred"))
  //   );
  // }  
}
