import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { LogOut } from 'lucide-react';

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

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="flex h-full bg-gray-100">
      <UserList 
        users={users} 
        onSelectUser={setSelectedUser} 
        selectedUser={selectedUser} 
        currentUser={user}
      />
      {selectedUser ? (
        <ChatWindow currentUser={user} selectedUser={selectedUser} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <p className="text-xl text-gray-500">Select a user to start chatting</p>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
