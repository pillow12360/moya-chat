// config/apiConfig.ts
import axios from 'axios';
import { ChatRoomInfo, CreateRoomRequest } from '../types/chat';

export const BASE_URL = 'https://api.moyastudy.com';
export const WS_URL = 'wss://api.moyastudy.com/ws-stomp';

// axios 인스턴스 생성
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => {
        if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        // 개발 환경에서 디버깅
        if (process.env.NODE_ENV === 'development') {
            console.log('API Request:', config);
        }

        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => {
        // 개발 환경에서 디버깅
        if (process.env.NODE_ENV === 'development') {
            console.log('API Response:', response);
        }
        return response.data;
    },
    (error) => {
        if (error.response) {
            console.error('API Error:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Request error:', error.message);
        }
        return Promise.reject(error);
    }
);

export const CHAT_API = {
    // 채팅방 목록 조회
    getAllRooms: () =>
        axiosInstance.get<never, ChatRoomInfo[]>('/ws/chat'),

    // 새로운 채팅방 생성
    createRoom: (data: CreateRoomRequest) =>
        axiosInstance.post<never, ChatRoomInfo>('/ws/chat/create', data),

    // 특정 채팅방 정보 조회
    getRoom: (roomId: string) =>
        axiosInstance.get<never, ChatRoomInfo>(`/ws/chat/room/${roomId}`)
} as const;