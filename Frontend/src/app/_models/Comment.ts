
export class Comment {
  id: number;
  post_id: number;
  user_name: string;
  avatar: string;
  display_name: string;
  created: Date;
  update_time: Date;
  content: string;
  hidden: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.post_id = data.post_id;
    this.content = data.content;
    this.user_name = data.comment_author;
    this.display_name = data.display_name;
    this.created = new Date(data.created);
    this.update_time = new Date(data.created);
    this.avatar = data.comment_author_avatar;
    this.hidden = data.hidden;
  }
}