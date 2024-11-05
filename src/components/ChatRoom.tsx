import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ChatMessage, MessageType } from '../types/chat';
import { SOCKET_URL } from '../config/apiConfig';

interface ChatRoomProps {
    roomId: string;
    username: string;
    onExit: () => void; // onExit prop 추가
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, username, onExit }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const client = new Client({
            brokerURL: SOCKET_URL,
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setIsConnected(true);

            client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
                const receivedMessage: ChatMessage = JSON.parse(message.body);
                setMessages((prev) => [...prev, receivedMessage]);
            });

            // 입장 메시지 전송
            client.publish({
                destination: '/pub/chat/message',
                body: JSON.stringify({
                    type: MessageType.ENTER,
                    roomId,
                    sender: username,
                    message: `${username}님이 입장하셨습니다.`,
                    time: new Date().toISOString()
                })
            });
        };

        client.onDisconnect = () => {
            setIsConnected(false);
        };

        client.activate();
        clientRef.current = client;

        // 컴포넌트 언마운트 시 연결 종료 및 퇴장 메시지 전송
        return () => {
            if (client.active) {
                client.publish({
                    destination: '/pub/chat/message',
                    body: JSON.stringify({
                        type: MessageType.LEAVE,
                        roomId,
                        sender: username,
                        message: `${username}님이 퇴장하셨습니다.`,
                        time: new Date().toISOString()
                    })
                });
                client.deactivate();
            }
        };
    }, [roomId, username]);

    const handleSendMessage = () => {
        if (!messageInput.trim() || !clientRef.current) return;

        const chatMessage: ChatMessage = {
            type: MessageType.TALK,
            roomId,
            sender: username,
            message: messageInput,
            time: new Date().toISOString()
        };

        clientRef.current.publish({
            destination: '/pub/chat/message',
            body: JSON.stringify(chatMessage)
        });

        setMessageInput('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleExit = () => {
        // 퇴장 처리
        if (clientRef.current?.active) {
            clientRef.current.publish({
                destination: '/pub/chat/message',
                body: JSON.stringify({
                    type: MessageType.LEAVE,
                    roomId,
                    sender: username,
                    message: `${username}님이 퇴장하셨습니다.`,
                    time: new Date().toISOString()
                })
            });
            clientRef.current.deactivate();
        }
        onExit(); // 부모 컴포넌트에 알림
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="bg-white shadow-md p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">채팅방 {roomId}</h1>
                        <p className="text-sm text-gray-500">
                            {isConnected ? '연결됨' : '연결 중...'}
                        </p>
                    </div>
                    <button
                        onClick={handleExit}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        나가기
                    </button>
                </div>
            </div>

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
                                msg.type === MessageType.ENTER || msg.type === MessageType.LEAVE
                                    ? 'bg-gray-200 text-gray-600'
                                    : msg.sender === username
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-800'
                            } ${
                                msg.type === MessageType.ENTER || msg.type === MessageType.LEAVE ? 'mx-auto' : ''
                            }`}
                        >
                            {msg.type !== MessageType.ENTER && msg.type !== MessageType.LEAVE && (
                                <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                            )}
                            <p>{msg.message}</p>
                            <p className="text-xs text-right mt-1 opacity-70">
                                {new Date(msg.time).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white p-4 shadow-lg">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;