import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }
  baseUrl: string = 'http://127.0.0.1:8000';

  getPosts(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  fetchUserInfo(username: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/profile/${username}`);
  }

//   getPostById(postId: number): Observable<any> {
//     return this.http.get(`${this.baseUrl}/api/posts/${postId}`);
// }

// getCommentsForPost(postId: number): Observable<any> {
//     return this.http.get(`${this.baseUrl}/api/posts/${postId}/comments`);
// }

  // fetchUserInfo(username: string): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/account/profile/${username}`);
  // }
}
