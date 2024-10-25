import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Plus, Bell, Settings, Check } from 'lucide-react';
import NewChatPopup from './NewChatPopup';
import notificationSound from '../media/tones/NotificationTone.mp3';
import { useMediaQuery } from '@mui/material';
import './UserList.css';

interface User {
  id: string;
  displayName: string;
  photoURL: string;
}

interface CurrentUser {
  uid: string;
  // Add other properties of the current user as needed
}

interface UserListProps {
  users: User[];
  onSelectUser: (user: User) => void;
  selectedUser: User | null;
  currentUser: CurrentUser;
}

interface LastMessage {
  text: string;
  createdAt: Date;
  uid: string;
  read: boolean;
  delivered: boolean;
}

interface UnreadCount {
  [key: string]: number;
}

const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center p-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 mr-3 skeleton"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 skeleton"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 skeleton"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const UserList: React.FC<UserListProps> = ({ users, onSelectUser, selectedUser, currentUser }) => {
  const [lastMessages, setLastMessages] = useState<{[key: string]: LastMessage}>({});
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [usersWithHistory, setUsersWithHistory] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevUnreadCounts, setPrevUnreadCounts] = useState<UnreadCount>({});
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    notificationAudioRef.current = new Audio('../media/tones/NotificationTone.mp3');
  }, []);
  const audio = useRef(new Audio(notificationSound));
  
  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const fetchLastMessages = async () => {
      setIsLoading(true);
      const messagesRef = collection(db, 'messages');
      const lastMessagesMap: {[key: string]: LastMessage} = {};
      const unreadCountsMap: UnreadCount = {};
      const usersWithChat: User[] = [];

      for (const user of users) {
        const q = query(
          messagesRef,
          where('participants', 'array-contains', currentUser.uid),
          where('participants', 'array-contains', user.id),
          orderBy('createdAt', 'desc'),
          limit(50) // Increased limit to fetch more messages for unread count
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastMessage = querySnapshot.docs[0].data();
          lastMessagesMap[user.id] = {
            text: lastMessage.text,
            createdAt: lastMessage.createdAt?.toDate(),
            uid: lastMessage.uid,
            read: lastMessage.read,
            delivered: lastMessage.delivered
          };
          usersWithChat.push(user);

          // Calculate unread count
          const unreadCount = querySnapshot.docs.reduce((count, doc) => {
            const message = doc.data();
            return message.uid !== currentUser.uid && !message.read ? count + 1 : count;
          }, 0);
          if (unreadCount > 0) {
            unreadCountsMap[user.id] = unreadCount;
          }
        }
      }

      setLastMessages(lastMessagesMap);
      setUnreadCounts(unreadCountsMap);
      setUsersWithHistory(usersWithChat);
      setIsLoading(false);
    };

    fetchLastMessages();

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedLastMessages: {[key: string]: LastMessage} = {};
      const updatedUnreadCounts: UnreadCount = {};

      snapshot.docs.forEach((doc) => {
        const message = doc.data();
        const otherUserId = message.participants.find((id: string) => id !== currentUser.uid);
        if (otherUserId) {
          const newMessage = {
            text: message.text,
            createdAt: message.createdAt?.toDate(),
            uid: message.uid,
            read: message.read,
            delivered: message.delivered
          };

          // Update last message
          if (!updatedLastMessages[otherUserId] || newMessage.createdAt > updatedLastMessages[otherUserId].createdAt) {
            updatedLastMessages[otherUserId] = newMessage;
          }

          // Update unread count
          if (message.uid !== currentUser.uid && !message.read) {
            updatedUnreadCounts[otherUserId] = (updatedUnreadCounts[otherUserId] || 0) + 1;
          }
        }
      });

      setLastMessages(prevMessages => ({...prevMessages, ...updatedLastMessages}));
      setUnreadCounts(updatedUnreadCounts);
      setPrevUnreadCounts(prevCounts => {
        const hasNewUnreadMessages = Object.keys(updatedUnreadCounts).some(
          userId => updatedUnreadCounts[userId] > (prevCounts[userId] || 0)
        );

        if (hasNewUnreadMessages && notificationAudioRef.current) {
          // notificationAudioRef.current.play().catch(error => console.error('Error playing notification sound:', error));
          audio.current.play().catch(error => console.error('Error playing notification sound:', error));
        }

        return updatedUnreadCounts;
      });

      const newUsersWithHistory = users.filter(user => 
        updatedLastMessages[user.id] || updatedUnreadCounts[user.id]
      );
      setUsersWithHistory(newUsersWithHistory);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [users, currentUser]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatTime = useCallback((date: Date | undefined) => {
    if (!date) return '';
    const now = currentTime;
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Now';
  }, [currentTime]);

  const renderMessageStatus = (lastMessage: LastMessage | undefined, userId: string) => {
    if (!lastMessage || !currentUser) return null;
    if (lastMessage.uid === currentUser.uid) {
      if (lastMessage.read) {
        return (
          <div className="flex items-center">
            <div className="flex">
              <Check className="h-3 w-3 text-gray-500" />
              <Check className="h-3 w-3 text-gray-500 -ml-1.5" />
            </div>
            <span className="text-xs text-gray-500 ml-0.5">R</span>
          </div>
        );
      }
      if (lastMessage.delivered) {
        return (
          <div className="flex">
            <Check className="h-3 w-3 text-gray-500" />
            <Check className="h-3 w-3 text-gray-500 -ml-1.5" />
          </div>
        );
      }
      return <Check className="h-3 w-3 text-gray-500" />;
    }
    const unreadCount = unreadCounts[userId];
    if (unreadCount) {
      return (
        <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </div>
      );
    }
    return null;
  };

  const handleNewChat = () => {
    setShowNewChatPopup(true);
  };

  const handleCloseNewChatPopup = () => {
    setShowNewChatPopup(false);
  };

  const filteredUsers = usersWithHistory.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChatUserSelect = (user: User) => {
    setUsersWithHistory(prev => {
      if (!prev.some(u => u.id === user.id)) {
        return [...prev, user];
      }
      return prev;
    });
    onSelectUser(user);
    setShowNewChatPopup(false);
  };

  const renderMessageText = (lastMessage: LastMessage | undefined, userId: string) => {
    const unreadCount = unreadCounts[userId] || 0;
    const messageText = lastMessage ? (
      <>
        {lastMessage.uid === currentUser.uid ? 'You: ' : ''}
        {lastMessage.text}
      </>
    ) : 'No messages yet';

    return (
      <p className={`text-sm ${unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-500'} truncate flex-grow`}>
        {messageText}
      </p>
    );
  };

  return (
    <div className={`${isMobile ? 'w-full h-full' : 'w-1/3'} border-r border-gray-200 flex flex-col bg-white`}>
      <div className="p-6 flex flex-col h-full">
        {/* User profile and action buttons section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-4 shadow-md">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Me" className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-2xl font-bold text-white">M</span>
              )}
            </div>
            <span className="font-semibold text-gray-800 text-lg">Me</span>
          </div>
          <div className="flex space-x-3">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4E9FE5]" 
              aria-label="New chat"
              onClick={handleNewChat}
            >
              <Plus size={22} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4E9FE5]" aria-label="Notifications">
              <Bell size={22} className="text-gray-600" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#4E9FE5]" aria-label="Settings">
              <Settings size={22} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Type to search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 w-full bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-[#4E9FE5] transition-all duration-300 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* User list with fixed height and scrollable content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full overflow-y-auto pr-2">
              <SkeletonLoader />
            </div>
          ) : usersWithHistory.length > 0 ? (
            <div className="h-full overflow-y-auto pr-2">
              {filteredUsers.map((user) => {
                const lastMessage = lastMessages[user.id];
                return (
                  <div
                    key={user.id}
                    className={`flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer mb-2 transition-colors duration-200 ${
                      selectedUser?.id === user.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3 shadow-sm">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-2xl font-bold text-white">{user.displayName[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-800 truncate">{user.displayName}</span>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {renderMessageText(lastMessage, user.id)}
                        <div className="ml-2 flex-shrink-0">
                          {renderMessageStatus(lastMessage, user.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No conversations yet
            </div>
          )}
        </div>
      </div>
      {showNewChatPopup && (
        <NewChatPopup
          users={users.filter(user => !usersWithHistory.some(u => u.id === user.id))}
          onClose={handleCloseNewChatPopup}
          onSelectUser={handleNewChatUserSelect}
        />
      )}
    </div>
  );
};

export default UserList;
