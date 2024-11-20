// components/ChatRoom.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ChatMessage, ChatRoomInfo, ChatRoomProps, MessageType } from '../types/chat';
import { CHAT_API, WS_URL } from '../config/apiConfig';
import { Users, LogOut, Send, AlertCircle } from 'lucide-react';


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

    const formatRoomName = (name: string) => {
        try {
            return name.replace(/[{"}]/g, '').split(':')[1]?.trim() || name;
        } catch {
            return name;
        }
    };
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center space-x-2">
                    <AlertCircle className="text-red-500" size={20} />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {/* 채팅방 헤더 */}
            <div className="bg-white shadow-lg p-6">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {formatRoomName(roomInfo.roomName)}
                        </h1>
                        <div className="flex items-center space-x-2 text-gray-600">
                            <Users size={18} />
                            <p className="text-sm">
                                {isConnected ? `참여자 ${roomInfo.userCount}명` : '연결 중...'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExit}
                        className="px-6 py-2.5 text-white bg-red-500 hover:bg-red-600
                                 rounded-xl transition-all duration-200 flex items-center space-x-2
                                 hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed
                                 transform hover:-translate-y-0.5"
                        disabled={isExiting}
                    >
                        <LogOut size={18} />
                        <span>{isExiting ? '나가는 중...' : '나가기'}</span>
                    </button>
                </div>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            msg.sender === username ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md rounded-2xl shadow-md ${
                                msg.type === MessageType.JOIN || msg.type === MessageType.LEAVE
                                    ? 'bg-gray-100 text-gray-600 mx-auto px-6 py-2'
                                    : msg.sender === username
                                        ? 'bg-blue-500 text-white px-5 py-3'
                                        : 'bg-white text-gray-800 px-5 py-3'
                            }`}
                        >
                            {msg.type !== MessageType.JOIN && msg.type !== MessageType.LEAVE && (
                                <p className="text-xs mb-1 font-medium opacity-80">
                                    {msg.sender}
                                </p>
                            )}
                            <p className="break-words text-sm lg:text-base">
                                {msg.message || (
                                    msg.type === MessageType.JOIN
                                        ? `${msg.sender}님이 입장하셨습니다.`
                                        : msg.type === MessageType.LEAVE
                                            ? `${msg.sender}님이 퇴장하셨습니다.`
                                            : msg.message
                                )}
                            </p>
                            <p className={`text-xs mt-1 ${
                                msg.sender === username ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력 */}
            <div className="bg-white p-6 shadow-lg">
                <div className="flex space-x-3">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 border border-gray-200 rounded-xl px-5 py-3
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-all duration-200"
                        disabled={!isConnected}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!isConnected || !messageInput.trim()}
                        className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600
                                 transition-all duration-200 flex items-center space-x-2
                                 disabled:bg-gray-400 disabled:cursor-not-allowed
                                 hover:shadow-md transform hover:-translate-y-0.5"
                    >
                        <Send size={18} />
                        <span>전송</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;