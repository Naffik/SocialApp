import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnInit {

  values:any;
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    // this.getValues();
  }

  login(model:any){
    return this.http.post("http://127.0.0.1:8000/account/api/token/", model)
      .pipe(map((response: any) =>{
        const user = response;
        if(user){
          localStorage.setItem('access', user.access);
          localStorage.setItem('refresh', user.refresh);
        }
    }))
  }

  register(model:any){
    return this.http.post("http://127.0.0.1:8000//account/register/", model)
      .pipe(map((response: any) =>{
        const user = response;
    }))
  }
}
