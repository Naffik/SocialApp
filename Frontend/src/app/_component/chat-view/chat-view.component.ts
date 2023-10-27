import { ChangeDetectorRef, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { Chat } from 'src/app/_models/Chat';
import { AuthService } from 'src/app/_services/auth.service';
import { ChatService } from 'src/app/_services/chat.service';
import { WebsocketService } from 'src/app/_services/web-socket.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css']
})
export class ChatViewComponent {
  selectedUser: any = {
    name: '',
    lastName: '',
    username: '',
    avatarUrl: '',
    messages: []
  };
  newMessage: string = '';
  errorMessage: string | null = null;

  private messagesSubscription!: Subscription;
  loggedInUsername = '';
  isLoadingMessages = false;
  currentChatSubject: any;


  selectedChat: Chat | null = null;
  private chatSubscription!: Subscription;


  constructor(
    private websocketService: WebsocketService,
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private location: Location

  ) {}

  ngOnInit(): void {
    this.loggedInUsername = this.authService.decodedToken.username;

    this.chatService.currentChat$.subscribe(chat => {
      if (chat) {
        const otherUser = chat.members.find(member => member.username !== this.loggedInUsername);
        if (otherUser) {
          this.selectedUser.name = otherUser.name;
          this.selectedUser.lastName = otherUser.lastName;
          this.selectedUser.username = otherUser.username;
          this.selectedUser.avatarUrl = otherUser.avatar;
        }
      }
    });

    this.chatSubscription = this.chatService.currentChat$.subscribe(chat => {
      this.selectedChat = chat;
    });

    this.messagesSubscription = this.websocketService.messagesData$.subscribe((data: any) => {
      this.cdr.detectChanges();

      if (data.history && Array.isArray(data.history)) {
        const previousMessages = data.history.map(this.mapMessageData.bind(this));
        this.selectedUser.messages = [...previousMessages, ...this.selectedUser.messages];
      }

      if (data.soloMessage) {
        this.selectedUser.messages.push(this.mapMessageData(data.soloMessage));
      }
    });

    this.chatService.resetMessages$.subscribe(shouldReset => {
      if (shouldReset) {
        this.selectedUser.messages = [];
      }
    });
  }

  
  goBack(): void {
    this.selectedChat = null;
  }

  private mapMessageData(messageData: { user: string, message: string, isCurrentUser?: boolean }) {
    const sender = messageData.user;
    return {
        sender: sender,
        text: messageData.message,
        isCurrentUser: messageData.isCurrentUser
    };
  }  

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  sendMessage() {
    if (!this.websocketService.isConnected()) {
        this.errorMessage = "Nie jesteś połączony z serwerem. Spróbuj ponownie później.";
        return; 
    }

    if (this.newMessage.trim()) {
        const newMsg = { id: Date.now(), sender: this.loggedInUsername, text: this.newMessage.trim() };  // Przykładowe ID to timestamp
        this.selectedUser.messages.unshift(newMsg);
        const textMessage = {
          action: "message",
          message: this.newMessage.trim()
      };
      this.websocketService.sendAction(textMessage);

        setTimeout(() => {
            const chatContentElement = document.querySelector('.chat-content');
            if (chatContentElement) {
                chatContentElement.scrollTop = chatContentElement.scrollHeight;
            }
        });

        this.newMessage = '';
    }
  }


  addImage() {
  }

  selectUser(user: any) {
    this.websocketService.clearMessages();

    this.selectedUser.messages = [];  
    console.log("asdasdas0",this.selectedUser.messages);
    if (this.selectedUser && this.selectedUser === user) {
      this.selectedUser = null;
    } else {
      this.selectedUser = user;
    }
  }

  // adjustTextareaHeight(event: any) {
  //   const textarea = event.target as HTMLTextAreaElement;
  //   if (textarea.scrollHeight > 100) {  
  //     textarea.style.height = '100px';
  //   } else {
  //     textarea.style.height = 'auto';
  //     textarea.style.height = textarea.scrollHeight + 'px';
  //   }
  // }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(); 
    }
  }

  public loadPreviousMessages(): void {
    console.log('loadPreviousMessages function has been called!');  // Dodaj tę linię

    const previousMessageRequest = {
        "action": "previous",
        start: 10,
        end: 20
    };
    this.websocketService.sendAction(previousMessageRequest);
  }

  public getCurrentChatValue(): Chat | null {
    return this.currentChatSubject.value;
  }


  handleScroll(event: any): void {
    const scrollTop = event.target.scrollTop;

    if (scrollTop <= 0 && !this.isLoadingMessages) {
        this.loadPreviousMessages();
    }
  }

}