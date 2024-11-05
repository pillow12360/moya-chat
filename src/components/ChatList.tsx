import React, { useState, useEffect } from 'react';
import { Room } from '../types/chat';
import { CHAT_API } from '../config/apiConfig';

interface ChatListProps {
    onRoomSelect: (roomId: string) => void;
    username: string;
}

const ChatList: React.FC<ChatListProps> = ({ onRoomSelect, username }) => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);

    // 채팅방 목록 조회
    const fetchRooms = async () => {
        try {
            const response = await fetch(CHAT_API.ROOMS);
            const data = await response.json();
            setRooms(data);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
    };

    // 새로운 채팅방 생성
    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;

        try {
            const response = await fetch(CHAT_API.ROOMS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newRoomName }),
            });

            if (response.ok) {
                const newRoom = await response.json();
                setRooms([...rooms, newRoom]);
                setNewRoomName('');
                setIsCreatingRoom(false);
            }
        } catch (error) {
            console.error('Failed to create room:', error);
        }
    };

    // 채팅방 입장
    const handleJoinRoom = async (roomId: string) => {
        try {
            await fetch(CHAT_API.JOIN(roomId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });
            onRoomSelect(roomId);
        } catch (error) {
            console.error('Failed to join room:', error);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">채팅방 목록</h2>
                <button
                    onClick={() => setIsCreatingRoom(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    방 만들기
                </button>
            </div>

            {isCreatingRoom && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="방 이름을 입력하세요"
                        className="w-full mb-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCreateRoom}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        >
                            생성
                        </button>
                        <button
                            onClick={() => setIsCreatingRoom(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {rooms.map((room) => (
                    <div
                        key={room.roomId}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleJoinRoom(room.roomId)}
                    >
                        <h3 className="font-semibold text-lg text-gray-800">{room.name}</h3>
                        <p className="text-sm text-gray-500">Room ID: {room.roomId}</p>
                    </div>
                ))}
            </div>

            {rooms.length === 0 && (
                <p className="text-center text-gray-500 my-4">
                    생성된 채팅방이 없습니다.
                </p>
            )}
        </div>
    );
};

export default ChatList;