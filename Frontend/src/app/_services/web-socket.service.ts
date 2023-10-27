import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket$: WebSocketSubject<any> | null = null;
  
  private messagesDataSubject = new BehaviorSubject<{ history: any[], soloMessage: any }>({
    history: [],
    soloMessage: null
  });
  public messagesData$ = this.messagesDataSubject.asObservable();

  public connect(chatUuid: string, loggedInUsername: string): void {
    this.clearMessages();


  if (!this.socket$ || this.socket$.closed) {
    const token = localStorage.getItem('access'); 
    const url = `ws://127.0.0.1:8000/c/${chatUuid}/?authorization=${token}`;

    this.socket$ = webSocket(url);
    this.socket$.subscribe(
      msg => {
          console.log('Received raw message: ', msg); 
          const currentData = this.messagesDataSubject.value;
  
          if (Array.isArray(msg.message)) {
              currentData.history = [...currentData.history, ...msg.message];
          } else {
              console.log('Processing as single message');
              msg.isCurrentUser = msg.user === loggedInUsername; // Dodajemy flagę isCurrentUser
              currentData.history.unshift(msg);
          }
        
          this.messagesDataSubject.next(currentData);
          console.log('Updated messages data:', this.messagesDataSubject.value);
      },
      
      err => {
          console.error('WebSocket error:', err);
      },
      () => console.log('WebSocket connection closed')
    );      
  }
}    

  public clearMessages(): void {
    this.messagesDataSubject.next({ history: [], soloMessage: null });
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
