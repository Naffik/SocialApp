
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Post } from '../_models/Post';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private _postAddedSource = new Subject<Post>();
  postAdded$ = this._postAddedSource.asObservable();

  private refreshTriggeredSource = new Subject<void>();
  refreshTriggered$ = this.refreshTriggeredSource.asObservable();

  triggerRefresh() {
    this.refreshTriggeredSource.next();
  }

  postAdded(dataPost: any) {
    this._postAddedSource.next(dataPost);
  }
}
