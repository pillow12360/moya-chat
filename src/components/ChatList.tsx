// components/ChatList.tsx
import React, { useState, useEffect } from 'react';
import { ChatRoomInfo, ChatListProps, CreateRoomRequest } from '../types/chat';
import { CHAT_API } from '../config/apiConfig';

const ChatList: React.FC<ChatListProps> = ({ onRoomSelect, username }) => {
    const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await fetch(CHAT_API.getAllRooms, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched rooms:', data);
            setRooms(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            setError('채팅방 목록을 불러오는데 실패했습니다.');
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        setLoading(true);

        try {
            const createRoomRequest: CreateRoomRequest = {
                roomName: newRoomName,
                type: "TEXT"
            };

            const response = await fetch(CHAT_API.createRoom, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(createRoomRequest)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newRoom: ChatRoomInfo = await response.json();
            console.log('Created room:', newRoom);

            await fetchRooms();
            setNewRoomName('');
            setIsCreatingRoom(false);
            setError(null);
        } catch (error) {
            console.error('Failed to create room:', error);
            setError('방 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        setLoading(true);
        try {
            // 1. 방 정보 조회
            const roomInfoResponse = await fetch(CHAT_API.getRoom(roomId), {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!roomInfoResponse.ok) {
                throw new Error('방 정보를 찾을 수 없습니다.');
            }

            const roomInfo: ChatRoomInfo = await roomInfoResponse.json();
            console.log('Room info:', roomInfo);

            // 2. 방 참여 요청
            const joinResponse = await fetch(CHAT_API.addUserToRoom(roomId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userName: username })
            });

            if (!joinResponse.ok) {
                throw new Error('방 참여에 실패했습니다.');
            }

            onRoomSelect(roomId, roomInfo);
            setError(null);
        } catch (error) {
            console.error('Failed to join room:', error);
            setError(error instanceof Error ? error.message : '방 참여에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto mt-10">
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">채팅방 목록</h2>
                <button
                    onClick={() => setIsCreatingRoom(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    disabled={loading}
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
                        disabled={loading}
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={handleCreateRoom}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:bg-green-300"
                            disabled={loading || !newRoomName.trim()}
                        >
                            {loading ? '생성 중...' : '생성'}
                        </button>
                        <button
                            onClick={() => {
                                setIsCreatingRoom(false);
                                setNewRoomName('');
                            }}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                            disabled={loading}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-4 text-gray-600">
                    로딩 중...
                </div>
            )}

            <div className="space-y-4">
                {rooms.map((room) => (
                    <div
                        key={room.roomId}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => !loading && handleJoinRoom(room.roomId)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-800">
                                    {room.roomName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    참여자: {room.userCount}명
                                </p>
                            </div>
                            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                                {room.type}
                            </span>
                        </div>
                        {Object.entries(room.userList).length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                                참여자 목록: {Object.values(room.userList).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!loading && rooms.length === 0 && (
                <p className="text-center text-gray-500 my-4">
                    생성된 채팅방이 없습니다.
                </p>
            )}
        </div>
    );
};

export default ChatList;