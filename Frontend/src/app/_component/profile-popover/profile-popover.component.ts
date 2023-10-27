import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'src/app/_models/User';
import { AuthService } from 'src/app/_services/auth.service';
import { environment } from 'src/environments/environment.development';

@Component({
  selector: 'app-profile-popover',
  templateUrl: './profile-popover.component.html',
  styleUrls: ['./profile-popover.component.css']
})
export class ProfilePopoverComponent {
  @Input() user: User | null = null;
  @Output() follow = new EventEmitter<User | null>();
  @Output() addFriend = new EventEmitter<User | null>();
  @Output() removeFriend = new EventEmitter<User | null>();
  @Output() removeFollow = new EventEmitter<User | null>();
  

  baseUrl = environment.apiUrl;
  inputData: any;
  loggedInUsername: string = '';
  
  constructor(
    private authService: AuthService
  ){}
  ngOnInit(){
    this.loggedInUsername = this.authService.decodedToken.username;
  }


  onFollow() {
    this.follow.emit(this.user);
  }

  onAddFriend() {
    this.addFriend.emit(this.user);
  }

  onRemoveFriend() {
    this.removeFriend.emit(this.user);
  }

  onRemoveFollow() {
    this.removeFollow.emit(this.user);
  }
}