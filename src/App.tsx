import { useState } from 'react'
import ChatList from './components/ChatList.tsx'
import ChatRoom from './components/ChatRoom'

function App() {
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => setIsLoggedIn(true)}
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
                    roomId={selectedRoom}
                    username={username}
                    onExit={() => setSelectedRoom(null)}
                />
            ) : (
                <ChatList
                    onRoomSelect={setSelectedRoom}
                    username={username}
                />
            )}
        </div>
    );
}

export default App;