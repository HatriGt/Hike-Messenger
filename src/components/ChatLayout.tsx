import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { Bell, Settings, LogOut } from 'lucide-react';

const ChatLayout: React.FC = () => {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const userList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user.uid);
        setUsers(userList);
      }
    };

    fetchUsers();

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.id !== user?.uid);
      setUsers(userList);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      const markMessagesAsDelivered = async () => {
        const q = query(
          collection(db, 'messages'),
          where('recipientUid', '==', user.uid),
          where('delivered', '==', false)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (document) => {
          await updateDoc(doc(db, 'messages', document.id), { delivered: true });
        });
      };

      markMessagesAsDelivered();
    }
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-2 flex justify-center items-center">
      <div className="w-full h-full max-w-[1800px] bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden flex">
        <UserList 
          users={users} 
          onSelectUser={setSelectedUser} 
          selectedUser={selectedUser} 
          currentUser={user}
        />
        {selectedUser ? (
          <ChatWindow currentUser={user} selectedUser={selectedUser} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white bg-opacity-50">
            <p className="text-xl text-gray-500">Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
