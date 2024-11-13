export const BASE_URL = 'http://3.39.12.17:8080';

export const CHAT_API = {
    // 채팅방 목록 조회
    getAllRooms: `${BASE_URL}/ws/chat/`,

    // 새로운 채팅방 생성
    createRoom: `${BASE_URL}/ws/chat/create`,

    // 특정 채팅방 정보 조회
    getRoom: (roomId: string) => `${BASE_URL}/ws/chat/room/${roomId}`,

    // 채팅방에 사용자 추가
    addUserToRoom: (roomId: string) => `${BASE_URL}/ws/chat/room/${roomId}/participants`,

    // 채팅방에서 사용자 제거
    removeUserFromRoom: (roomId: string) => `${BASE_URL}/ws/chat/room/${roomId}/participants`
};

export const WS_URL = 'ws://3.39.12.17:8080/ws';