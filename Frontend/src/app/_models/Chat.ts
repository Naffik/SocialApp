export class Member {
    avatar: string;
    displayName: string;
    username: string;
    name: string;
    lastName: string;

    constructor(data: any) {
        this.avatar = data.avatar;
        this.displayName = data.display_name;
        this.username = data.username;
        this.name = data.first_name;
        this.lastName = data.last_name;
    }
}

export class Chat {
    chatUuid: string;
    members: Member[];

    constructor(data: any) {
        this.chatUuid = data.chat_uuid;
        this.members = data.member.map((memberData: Member) => new Member(memberData));
    }
}
