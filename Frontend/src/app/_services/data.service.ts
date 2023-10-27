import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.development';


@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private http: HttpClient
  ) { }
  baseUrl = environment.apiUrl;


  public sendHttpRequest(
    type: string,
    url: string,
    data?: any
  ): Observable<any> {
    return this.http.request(type, url, { body: data });
  }


  getData(url: string): Observable<any> {
    return this.http.get<any>(url);
  }

  getUserByUsername(username: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/profile/${username}/`);
  }

  dataFollow(username: string, url: string) {
    return this.http.post(url, { followee: username });
  }

  addFriend(username: string) {
    return this.http.post(this.baseUrl + "/account/friends/add_friend/", { to_user: username });
  }

  removeFriend(username: string) {
    return this.http.post(this.baseUrl + "/account/friends/remove_friend/", { to_user: username });
  }

  addLike(post_id: number) {
    return this.http.post(`${this.baseUrl}/api/post/${post_id}/like/`, {});
  }

  removeLike(post_id: number) {
    return this.http.delete(`${this.baseUrl}/api/post/${post_id}/like/`);
  }

  addToFavorites(postId: number) {
    return this.http.post(`${this.baseUrl}/api/post/${postId}/fav/`, {});
  }

  removeFromFavorites(postId: number) {
    return this.http.delete(`${this.baseUrl}/api/post/${postId}/fav/`);
  }

  getFriendRequests(): Observable<any> {
    return this.http.get(this.baseUrl + "/account/friends/requests/");
  }

  // getFriendRequests2(): Observable<any> {
  //   return this.http.get(this.baseUrl+"/account/friends/sent_requests/");
  // }

  acceptRequest(requestId: number) {
    return this.http.post(this.baseUrl + "/account/friends/accept_request/", { id: requestId });
  }

  rejectRequest(requestId: number) {
    return this.http.post(this.baseUrl + "/account/friends/reject_request/", { id: requestId });
  }

  createPost(postData: any): Observable<any> {
    return this.http.post(this.baseUrl + '/api/post/create/', postData);
  }

  deletePost(postId: number) {
    return this.http.delete(this.baseUrl + '/api/post/' + postId + '/');
  }
  
  deleteComment(postId: number) {
    return this.http.delete(this.baseUrl + '/api/comments/' + postId + '/');
  }

  createComment(postId: number, commentData: any): Observable<any> {
    return this.http.post(this.baseUrl + `/api/post/${postId}/create-comment/`, commentData);
  }

  checkPasswordResetLink(uidb64: string, token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/account/password-reset/${uidb64}/${token}/`);
  }

  // toggleBlockUser(url: string, username: string): Observable<any> {
  //   return this.http.post(url,{blocked: username});
  // }

  blockUser(username: string): Observable<any> {
    return this.http.post(this.baseUrl + `/account/friends/add_block/`, { blocked: username });
  }

  unBlockUser(username: string): Observable<any> {
    return this.http.post(this.baseUrl + `/account/friends/remove_block/`, { blocked: username });
  }


  // Resetowanie hasła
  resetPassword(password: string, token: string, uidb64: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/account/password-reset-complete/`, {
      password,
      token,
      uidb64
    });
  }

  // Pobieranie profilu użytkownika
  getUserProfile(username: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/account/profile/${username}/`);
  }

  // Aktualizacja profilu użytkownika
  updateUserProfile(username: string, updatedData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/account/profile/${username}/`, updatedData);
  }

  // Częściowa aktualizacja profilu użytkownika
  partialUpdateUserProfile(username: string, updatedData: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/account/profile/${username}/`, updatedData);
  }

  // Usuwanie profilu użytkownika
  deleteUserProfile(username: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/account/profile/${username}/`);
  }


  updateProfile(username: string, profileData: any) {
    const url = `${this.baseUrl}/account/profile/${username}/`;
    return this.http.put(url, profileData);
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
