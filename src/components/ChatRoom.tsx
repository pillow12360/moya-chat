// components/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ChatMessage, ChatRoomInfo, ChatRoomProps } from '../types/chat';
import { CHAT_API, WS_URL } from '../config/apiConfig';

const ChatRoom: React.FC<ChatRoomProps> = ({
                                               roomId,
                                               roomInfo: initialRoomInfo,
                                               username,
                                               onExit
                                           }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [roomInfo, setRoomInfo] = useState<ChatRoomInfo>(initialRoomInfo);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isExiting, setIsExiting] = useState(false);

    // 방 정보 주기적 업데이트
    const fetchRoomInfo = async () => {
        try {
            const response = await fetch(CHAT_API.getRoom(roomId), {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('방 정보를 불러오는데 실패했습니다.');
            }
            const data = await response.json();
            setRoomInfo(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch room info:', error);
            setError('방 정보를 불러오는데 실패했습니다.');
        }
    };

    // WebSocket 연결 설정
    useEffect(() => {
        const client = new Client({
            brokerURL: WS_URL,
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: async () => {
                console.log('Connected to STOMP');
                setIsConnected(true);
                setError(null);

                // 채팅방 구독
                client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                    const receivedMessage: ChatMessage = JSON.parse(message.body);
                    setMessages(prev => [...prev, receivedMessage]);
                });

                // 입장 메시지 전송
                client.publish({
                    destination: '/pub/chat/join',
                    body: JSON.stringify({
                        type: 'JOIN',
                        roomId,
                        sender: username,
                        message: `${username}님이 입장하셨습니다.`,
                        timestamp: new Date().toISOString()
                    })
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from STOMP');
                setIsConnected(false);
                if (!isExiting) {
                    setError('채팅 서버와의 연결이 끊어졌습니다.');
                }
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
                setError('채팅 연결에 실패했습니다.');
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.active && !isExiting) {
                handleExit();
            }
        };
    }, [roomId, username]);

    // 메시지 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 방 정보 갱신
    useEffect(() => {
        if (isConnected) {
            const interval = setInterval(fetchRoomInfo, 5000);
            return () => clearInterval(interval);
        }
    }, [isConnected, roomId]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !clientRef.current || !isConnected) return;

        const chatMessage: ChatMessage = {
            type: 'TALK',
            roomId,
            sender: username,
            message: messageInput,
            timestamp: new Date().toISOString()
        };

        clientRef.current.publish({
            destination: '/pub/chat/sendMessage',
            body: JSON.stringify(chatMessage)
        });

        setMessageInput('');
    };

    const handleExit = async () => {
        try {
            setIsExiting(true);

            // 1. WebSocket 연결 종료 메시지 전송
            if (clientRef.current?.active) {
                clientRef.current.publish({
                    destination: '/pub/chat/leave',
                    body: JSON.stringify({
                        type: 'LEAVE',
                        roomId,
                        sender: username,
                        message: `${username}님이 퇴장하셨습니다.`,
                        timestamp: new Date().toISOString()
                    })
                });
                clientRef.current.deactivate();
            }

            // 2. REST API를 통한 참여자 제거
            const response = await fetch(CHAT_API.removeUserFromRoom(roomId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userUUID: username })
            });

            if (!response.ok) {
                throw new Error('퇴장 처리에 실패했습니다.');
            }

            onExit();
        } catch (error) {
            console.error('Failed to exit room:', error);
            setError('퇴장 처리에 실패했습니다.');
        } finally {
            setIsExiting(false);
        }
    };

    // 엔터 키로 메시지 전송
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {error && (
                <div className="p-4 bg-red-100 text-red-700">
                    {error}
                </div>
            )}

            {/* 채팅방 헤더 */}
            <div className="bg-white shadow-md p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">
                            {roomInfo.roomName}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isConnected ? `참여자 ${roomInfo.userCount}명` : '연결 중...'}
                        </p>
                    </div>
                    <button
                        onClick={handleExit}
                        className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        disabled={isExiting}
                    >
                        {isExiting ? '나가는 중...' : '나가기'}
                    </button>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            msg.sender === username ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.type === 'JOIN' || msg.type === 'LEAVE'
                                    ? 'bg-gray-200 text-gray-600 mx-auto'
                                    : msg.sender === username
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-800'
                            }`}
                        >
                            {msg.type !== 'JOIN' && msg.type !== 'LEAVE' && (
                                <p className="text-xs mb-1">{msg.sender}</p>
                            )}
                            <p className="break-words">{msg.message}</p>
                            <p className="text-xs text-right mt-1 opacity-70">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력 */}
            <div className="bg-white p-4 shadow-lg">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isConnected}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!isConnected || !messageInput.trim()}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors
                                 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;