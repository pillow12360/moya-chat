// types/chat.ts
export enum MessageType {
    ENTER = 'ENTER',
    TALK = 'TALK',
    LEAVE = 'LEAVE'
}

export interface ChatMessage {
    type: MessageType;
    roomId: string;
    sender: string;
    message: string;
    time: string;
}

export interface Room {
    roomId: string;
    name: string;
}

export interface User {
    username: string;
    isActive: boolean;
}