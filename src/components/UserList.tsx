import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Plus, Bell, Settings, Check } from 'lucide-react';
import NewChatPopup from './NewChatPopup';

interface User {
  id: string;
  displayName: string;
  photoURL: string;
}

interface UserListProps {
  users: User[];
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
  currentUser: any;
}

interface LastMessage {
  text: string;
  createdAt: Date;
}

const UserList: React.FC<UserListProps> = ({ users, onSelectUser, selectedUser, currentUser }) => {
  const [lastMessages, setLastMessages] = useState<{[key: string]: LastMessage}>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [newChatUsers, setNewChatUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchLastMessages = async () => {
      const messagesRef = collection(db, 'messages');
      const lastMessagesMap: {[key: string]: LastMessage} = {};

      for (const user of users) {
        const q = query(
          messagesRef,
          where('participants', 'array-contains', currentUser.uid),
          where('participants', 'array-contains', user.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastMessage = querySnapshot.docs[0].data();
          lastMessagesMap[user.id] = {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt?.toDate()
          };
        }
      }

      setLastMessages(lastMessagesMap);
      
      // Filter out users that the current user has already chatted with
      const newUsers = users.filter(user => !lastMessagesMap[user.id]);
      setNewChatUsers(newUsers);
    };

    fetchLastMessages();

    // Set up real-time listener for new messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const message = change.doc.data();
          const otherUserId = message.participants.find((id: string) => id !== currentUser.uid);
          if (otherUserId) {
            setLastMessages(prev => {
              const prevMessage = prev[otherUserId];
              const newMessage = {
                text: message.text,
                createdAt: message.createdAt?.toDate()
              };
              if (!prevMessage || (newMessage.createdAt && (!prevMessage.createdAt || newMessage.createdAt > prevMessage.createdAt))) {
                return { ...prev, [otherUserId]: newMessage };
              }
              return prev;
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [users, currentUser]);

  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  };

  const renderMessageStatus = (lastMessage: LastMessage | undefined) => {
    if (!lastMessage || lastMessage.uid === currentUser?.uid) return null;
    if (lastMessage.read) return <div className="flex"><Check className="h-4 w-4 text-blue-500" /><Check className="h-4 w-4 text-blue-500 -ml-2" /></div>;
    if (lastMessage.delivered) return <div className="flex"><Check className="h-4 w-4 text-gray-500" /><Check className="h-4 w-4 text-gray-500 -ml-2" /></div>;
    return <Check className="h-4 w-4 text-gray-300" />;
  };

  const handleNewChat = () => {
    setShowNewChatPopup(true);
  };

  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-[#4E9FE5] transition-all duration-300"
          />
        </div>
        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {users.map((user) => {
            const lastMessage = lastMessages[user.id];
            return (
              <div
                key={user.id}
                className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-2 ${
                  selectedUser?.id === user.id ? "bg-gray-100" : ""
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="w-12 h-12 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{user.displayName[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">{user.displayName}</span>
                    <span className="text-xs text-gray-400">
                      {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage ? lastMessage.text : 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-4 bg-[#4E9FE5] flex justify-between items-center">
        <p className="text-white font-medium">New Chat</p>
        <button 
          className="p-2 rounded-full bg-white text-[#4E9FE5] hover:bg-opacity-90 transition-all duration-300" 
          aria-label="New Chat"
          onClick={handleNewChat}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {showNewChatPopup && (
        <NewChatPopup
          users={newChatUsers}
          onSelectUser={onSelectUser}
          onClose={() => setShowNewChatPopup(false)}
        />
      )}
    </div>
  );
};

export default UserList;
