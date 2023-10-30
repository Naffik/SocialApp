import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  
  private messagesDataSubject = new BehaviorSubject<any[]>([]);
  public messagesData$ = this.messagesDataSubject.asObservable();

  private webScoketUrl: string = "ws://127.0.0.1:8000/c/";
  

  public connect(chatUuid: string, loggedInUsername: string): void {
    if (!this.socket$ || this.socket$.closed) {
      const token = localStorage.getItem('access'); 
      const url = this.webScoketUrl + `${chatUuid}/?authorization=${token}`;

      this.socket$ = webSocket(url);
      this.socket$.subscribe({
        next: (msg) => {
          const currentMessages = [...this.messagesDataSubject.value];
          
          if (Array.isArray(msg.message)) {
              currentMessages.unshift(...msg.message);
          } else {
              msg.isCurrentUser = msg.user === loggedInUsername; 
              currentMessages.unshift(msg);
          }
          
          this.messagesDataSubject.next(currentMessages);
        },
        
        error: (err) => {
            console.error('WebSocket error:', err);
        }
      });
    }
  }    

  public resetMessages(): void {
    console.log(this.messagesDataSubject);
    this.messagesDataSubject.next([]);
    console.log(this.messagesDataSubject);

  }


  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  public isConnected(): boolean {
    return !!this.socket$ && !this.socket$.closed;
  }

  public sendAction(message: any): void {
    if (!this.isConnected()) {
      throw new Error('You are not connected to the channel, cannot send the message.');
    }
    this.socket$!.next(message);
  }
}