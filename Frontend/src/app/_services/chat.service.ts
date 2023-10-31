import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Chat } from '../_models/Chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  
  constructor() { }

  private currentChatSubject = new BehaviorSubject<Chat | null>(null);
  public currentChat$ = this.currentChatSubject.asObservable();

  private resetMessagesSubject = new BehaviorSubject<boolean>(false);
  public resetMessages$ = this.resetMessagesSubject.asObservable();


  public setCurrentChat(chat: Chat | null): void {
    this.currentChatSubject.next(chat);
  }

  public resetMessages(): void {
    this.resetMessagesSubject.next(true);
  }
  
}
