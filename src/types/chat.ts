// types/chat.ts
export interface ChatRoomInfo {
    roomId: string;
    roomName: string;
    userCount: number;
    type: "TEXT";
    userList: {
        [key: string]: string;
    }
}

export interface ChatMessage {
    type: 'JOIN' | 'TALK' | 'LEAVE';
    roomId: string;
    sender: string;
    message: string;
    timestamp: string;
}

export interface ChatRoomProps {
    roomId: string;
    roomInfo: ChatRoomInfo;
    username: string;
    onExit: () => void;
}

export interface ChatListProps {
    onRoomSelect: (roomId: string, roomInfo: ChatRoomInfo) => void;
    username: string;
}

export interface CreateRoomRequest {
    roomName: string;
    type: "TEXT";
}