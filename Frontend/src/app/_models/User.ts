export class User {
    username: string;
    display_name: string;
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
    friends_count: number;
    followers_count: number;
    follows_count: number;
    is_friend: boolean;
    follow: boolean;
    request_friendship_sent: boolean;
    is_blocked: boolean;
  
    constructor(data: any) {
      this.username = data.username ;
      this.display_name = data.display_name ;
      this.first_name = data.first_name ;
      this.last_name = data.last_name;
      this.bio = data.bio;
      this.avatar_url = data.avatar_url;
      this.friends_count = data.friends_count;
      this.followers_count = data.followers_count;
      this.follows_count = data.follows_count;
      this.is_friend = data.is_friend;
      this.follow = data.follow;
      this.request_friendship_sent = data.request_friendship_sent
      this.is_blocked = data.is_blocked;

  }
}