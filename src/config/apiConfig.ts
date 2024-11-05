export const API_BASE_URL = 'http://localhost:8080';

export const SOCKET_URL = `${API_BASE_URL}/ws-stomp`;

export const CHAT_API = {
    ROOMS: `${API_BASE_URL}/api/chat/rooms`,
    MESSAGES: (roomId: string) => `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`,
    JOIN: (roomId: string) => `${API_BASE_URL}/api/chat/rooms/${roomId}/join`,
};