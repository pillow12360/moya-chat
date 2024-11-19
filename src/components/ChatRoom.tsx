// components/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ChatMessage, ChatRoomInfo, ChatRoomProps, MessageType } from '../types/chat';
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
    const [isExiting, setIsExiting] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 방 정보 주기적 업데이트
    const fetchRoomInfo = async () => {
        try {
            const data = await CHAT_API.getRoom(roomId);
            setRoomInfo(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch room info:', error);
            setError('방 정보를 불러오는데 실패했습니다.');
        }
    };
    useEffect(() => {
        console.log('Initializing WebSocket connection...');

        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => console.log('STOMP:', str),
            onConnect: () => {
                console.log('Connected to STOMP');
                setIsConnected(true);
                setError(null);

                try {
                    // 채팅방 구독
                    client.subscribe(`/sub/chat/room/${roomId}`, (message) => {
                        console.log('Raw message received:', message);
                        try {
                            const receivedMessage: ChatMessage = JSON.parse(message.body);
                            console.log('Parsed message:', receivedMessage);
                            setMessages(prev => [...prev, receivedMessage]);
                        } catch (error) {
                            console.error('Message parsing error:', error);
                            setError('메시지 처리 중 오류가 발생했습니다.');
                        }
                    });

                    // 입장 메시지 전송
                    const joinMessage = {
                        type: MessageType.JOIN,
                        roomId,
                        sender: username,
                        message: '',
                        timestamp: new Date().toISOString()
                    };

                    console.log('Sending join message:', joinMessage);
                    client.publish({
                        destination: '/pub/chat/message',
                        body: JSON.stringify(joinMessage)
                    });
                } catch (error) {
                    console.error('STOMP operation error:', error);
                    setError('채팅방 연결 중 오류가 발생했습니다.');
                }
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
                setError('채팅 연결에 실패했습니다.');
            },
            onDisconnect: () => {
                console.log('Disconnected from STOMP');
                setIsConnected(false);
                if (!isExiting) {
                    setError('채팅 서버와의 연결이 끊어졌습니다.');
                }
            }
        });

        console.log('Activating STOMP client...');
        client.activate();
        clientRef.current = client;

        // 클린업 함수
        return () => {
            console.log('Cleaning up WebSocket connection...');
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
            fetchRoomInfo();
            const interval = setInterval(fetchRoomInfo, 5000);
            return () => clearInterval(interval);
        }
    }, [isConnected]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !clientRef.current || !isConnected) return;

        const chatMessage: ChatMessage = {
            type: MessageType.CHAT,
            roomId,
            sender: username,
            message: messageInput,
            timestamp: new Date().toISOString()
        };

        console.log('Sending chat message:', chatMessage);
        clientRef.current.publish({
            destination: '/pub/chat/message',
            body: JSON.stringify(chatMessage)
        });

        setMessageInput('');
    };

    const handleExit = async () => {
        try {
            console.log('Exiting room...');
            setIsExiting(true);

            if (clientRef.current?.active) {
                const leaveMessage = {
                    type: MessageType.LEAVE,
                    roomId,
                    sender: username,
                    message: '',
                    timestamp: new Date().toISOString()
                };

                console.log('Sending leave message:', leaveMessage);
                clientRef.current.publish({
                    destination: '/pub/chat/message',
                    body: JSON.stringify(leaveMessage)
                });

                clientRef.current.deactivate();
            }

            onExit();
        } catch (error) {
            console.error('Exit error:', error);
            setError('퇴장 처리에 실패했습니다.');
        } finally {
            setIsExiting(false);
        }
    };
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
                            } shadow`}
                        >
                            {msg.type !== 'JOIN' && msg.type !== 'LEAVE' && (
                                <p className="text-xs mb-1">
                                    {msg.sender}
                                </p>
                            )}
                            <p className="break-words">
                                {msg.message || (
                                    msg.type === 'JOIN'
                                        ? `${msg.sender}님이 입장하셨습니다.`
                                        : msg.type === 'LEAVE'
                                            ? `${msg.sender}님이 퇴장하셨습니다.`
                                            : msg.message
                                )}
                            </p>
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