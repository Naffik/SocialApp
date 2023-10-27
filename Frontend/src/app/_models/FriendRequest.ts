export class FriendRequest {
    avatarUrl: string;
    username: string;
    displayName: string;
    id: number;
    from_user: string;
    to_user: string;
    message: string;
    created: Date;
    rejected: any;  
    viewed: any;   

    constructor(data: any) {
        this.avatarUrl = data.avatar_url;
        this.username = data.username;
        this.displayName = data.display_name;
        this.id = data.id;
        this.from_user = data.from_user;
        this.to_user = data.to_user;
        this.message = data.message;
        this.created = new Date(data.created);
        this.rejected = data.rejected;
        this.viewed = data.viewed;
    }
}
