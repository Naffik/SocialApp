import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
  private isDropdownOpen = false;

  private _activeDropdown = new BehaviorSubject<string | null>(null);
  private _contextMenuState = new BehaviorSubject<{ isOpen: boolean, postId: number | null }>({ isOpen: false, postId: null });
  contextMenuState$ = this._contextMenuState.asObservable();
  private _activeContextMenuId = new BehaviorSubject<number | null>(null);


  
  get activeDropdown() {
    return this._activeDropdown.asObservable();
  }

  openDropdown(id: string) {
    this.isDropdownOpen = true;
    this._activeDropdown.next(id);
  }

  closeDropdown() {
    if (this.isDropdownOpen) {
    this.isDropdownOpen = false;
    this._activeDropdown.next(null);
    }
  }

}
