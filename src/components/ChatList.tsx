// components/ChatList.tsx
import React, { useState, useEffect } from 'react';
import { ChatRoomInfo, ChatListProps, CreateRoomRequest } from '../types/chat';
import { CHAT_API } from '../config/apiConfig';

const ChatList: React.FC<ChatListProps> = ({ onRoomSelect }) => {
    const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchRooms = async () => {
        try {
            const data = await CHAT_API.getAllRooms();
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
            };

            const newRoom = await CHAT_API.createRoom(createRoomRequest);
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
            const roomInfo = await CHAT_API.getRoom(roomId);
            console.log('Room info:', roomInfo);

            onRoomSelect(roomInfo);
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
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && newRoomName.trim()) {
                                handleCreateRoom();
                            }
                        }}
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

            {loading && !isCreatingRoom && (
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