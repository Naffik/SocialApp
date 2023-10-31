import { User } from './User'; 

export class Post {
  id: number;
  post_author: string;
  post_author_avatar: string;
  content: string;
  created: Date;
  number_of_favorites: number;
  likes: Array<User>;
  number_of_likes: number;
  is_liked: boolean;
  is_favorite: boolean;
  number_of_comments: number;
  display_name: string;
  tags: Array<string>;
  image: string; 

  constructor(data: any) {
    this.id = data.id;
    this.post_author = data.post_author;
    this.post_author_avatar = data.post_author_avatar;
    this.content = data.content;
    this.created = new Date(data.created);
    this.number_of_favorites = data.number_of_favorites;
    this.likes = data.likes;
    this.number_of_likes = data.number_of_likes;
    this.is_liked = data.is_liked;
    this.is_favorite = data.is_favorite;
    this.number_of_comments = data.number_of_comments;
    this.display_name = data.display_name;
    this.tags = data.tags;
    this.image = data.image; 
  }
}
