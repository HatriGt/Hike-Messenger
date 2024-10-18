import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

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

  useEffect(() => {
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
            createdAt: lastMessage.createdAt.toDate()
          };
        }
      }

      setLastMessages(lastMessagesMap);
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
                createdAt: message.createdAt.toDate()
              };
              if (!prevMessage || newMessage.createdAt > prevMessage.createdAt) {
                return { ...prev, [otherUserId]: newMessage };
              }
              return prev;
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [users, currentUser.uid]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    if (seconds > 0) return `${seconds}s`;
    return 'Now';
  };

  return (
    <div className="w-1/3 bg-white border-r overflow-y-auto">
      <div className="bg-blue-500 p-4 text-white">
        <h2 className="text-2xl font-bold">hi</h2>
      </div>
      <div className="p-2">
        <input
          type="text"
          placeholder="Search"
          className="w-full p-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {users.length === 0 ? (
        <p className="p-4 text-gray-500">No users found</p>
      ) : (
        <ul>
          {users.map((user) => {
            const lastMessage = lastMessages[user.id];
            return (
              <li
                key={user.id}
                className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer ${
                  selectedUser?.id === user.id ? 'bg-red-100' : ''
                }`}
                onClick={() => onSelectUser(user)}
              >
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{user.displayName[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{user.displayName}</span>
                    <span className="text-xs text-gray-500">
                      {lastMessage ? formatTime(lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage ? lastMessage.text : 'No messages yet'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UserList;
