
import { useState } from 'react'
import ChatList from './components/ChatList'
import ChatRoom from './components/ChatRoom'
import { ChatRoomInfo } from './types/chat'

function App() {
    // string | null 에서 ChatRoomInfo | null로 변경
    const [selectedRoom, setSelectedRoom] = useState<ChatRoomInfo | null>(null);
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
                    roomId={selectedRoom.roomId}
                    roomInfo={selectedRoom}
                    username={username}
                    onExit={() => setSelectedRoom(null)}
                />
            ) : (
                <ChatList
                    // ChatList의 onRoomSelect prop 타입에 맞게 수정
                    onRoomSelect={(_, roomInfo: ChatRoomInfo) => setSelectedRoom(roomInfo)}
                    username={username}
                />
            )}
        </div>
    );
}

export default App;
