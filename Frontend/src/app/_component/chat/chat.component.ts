import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Chat } from 'src/app/_models/Chat';
import { AuthService } from 'src/app/_services/auth.service';
import { ChatService } from 'src/app/_services/chat.service';
import { DataService } from 'src/app/_services/data.service';
import { WebsocketService } from 'src/app/_services/web-socket.service';
import { environment } from 'src/environments/environment.development';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent {
  baseUrl = environment.apiUrl;
  messages: any[] = [];
  newMessage: string = '';
  selectedChat!: Chat | null;
  chats: Chat[] = [];
  isLoading: boolean = false;
  error = false;
  serverError = false;
  loggedInUsername: string = '';
  searchTerm: string = '';
  hasFriends = false;
  



  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private websocketService: WebsocketService,
    private router: Router,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.loggedInUsername = this.authService.decodedToken.username;
    this.loadFirends();
  }

  loadFirends() {
    this.dataService.getData(`${this.baseUrl}/chat/`).subscribe(data => {
      this.chats = data.map((chatData: any) => new Chat(chatData));
      if (this.chats.length > 0) {
        this.hasFriends = true;
      }
    }, error => {
      this.error = true;
      console.error("Błąd podczas ładowania listy czatów:", error);
    });
  }

  selectChat(chat: Chat): void {
    this.websocketService.resetMessages();  
    this.chatService.setCurrentChat(chat);
    if (this.selectedChat && this.selectedChat === chat) {
      if (this.websocketService.isConnected()) {
        this.websocketService.disconnect();
      }
      this.selectedChat = null;
      this.router.navigate(['/home']);
    } else {
      if (this.websocketService.isConnected()) {
        this.websocketService.disconnect();
      }
      this.selectedChat = chat;
      this.websocketService.connect(chat.chatUuid, this.loggedInUsername);
      this.router.navigate(['/chat']);
    }
  }

  getSelectedChatUserName(): string {
    if (this.selectedChat) {
      const otherUser = this.selectedChat.members.find(member => member.username !== this.loggedInUsername);
      return otherUser ? `${otherUser.name} ${otherUser.lastName}` : '';
    }
    return '';
  }

  get filteredChats(): Chat[] {
    return this.chats.filter(chat => {
      const otherUser = chat.members.find(member => member.username !== this.loggedInUsername);
      if (!otherUser) return false;
      const fullName = `${otherUser.name} ${otherUser.lastName}`.toLowerCase();
      const username = otherUser.username.toLowerCase();
      return fullName.includes(this.searchTerm.toLowerCase()) || username.includes(this.searchTerm.toLowerCase());
    });
  }
}