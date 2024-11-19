// App.tsx
import { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatRoom from './components/ChatRoom';
import { ChatRoomInfo } from './types/chat';

function App() {
    const [selectedRoom, setSelectedRoom] = useState<ChatRoomInfo | null>(null);
    const [username, setUsername] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 로컬 스토리지에서 사용자 정보 복구
    useEffect(() => {
        const savedUsername = localStorage.getItem('chat_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = () => {
        if (username.trim()) {
            setIsLoggedIn(true);
            localStorage.setItem('chat_username', username);
        }
    };

    const handleRoomSelect = (roomInfo: ChatRoomInfo) => {
        console.log('Selecting room:', roomInfo);
        setSelectedRoom(roomInfo);
    };

    const handleRoomExit = () => {
        console.log('Exiting room');
        setSelectedRoom(null);
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h1 className="text-2xl font-bold text-center mb-6">채팅 로그인</h1>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="닉네임을 입력하세요"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && username.trim()) {
                                    handleLogin();
                                }
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleLogin}
                            disabled={!username.trim()}
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                        >
                            입장하기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {selectedRoom ? (
                <ChatRoom
                    key={selectedRoom.roomId}
                    roomId={selectedRoom.roomId}
                    roomInfo={selectedRoom}
                    username={username}
                    onExit={handleRoomExit}
                />
            ) : (
                <ChatList
                    onRoomSelect={handleRoomSelect}
                    username={username}
                />
            )}
        </div>
    );
}

export default App;