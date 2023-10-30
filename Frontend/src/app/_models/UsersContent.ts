export class UsersContent {
    main_id: number;
    tags: string[];
    author: string;
    avatar: string;
    content: string;
    created: string;
    number_of_favorites: number;
    likes: any[];
    number_of_likes: number;
    is_liked: boolean;
    is_favorite: boolean;
    number_of_comments: number;
    display_name: string;

    post_id?: string;   
    hidden: boolean;

    constructor(data:any){
        this.main_id = data?.main_id || 0;
        this.tags = data?.tags || [];
        this.author = data?.post_author || data?.comment_author || '';
        this.avatar = data?.post_author_avatar || data?.comment_author_avatar || '';
        this.content = data?.content || '';
        this.created = data?.created || '';
        this.number_of_favorites = data?.number_of_favorites || 0;
        this.likes = data?.likes || [];
        this.number_of_likes = data?.number_of_likes || 0;
        this.is_liked = data?.is_liked || false;
        this.is_favorite = data?.is_favorite || false;
        this.number_of_comments = data?.number_of_comments || 0;
        this.display_name = data?.display_name || '';
        this.post_id = data?.post_id || '';
        this.hidden = data?.hidden || false;
    }
}
