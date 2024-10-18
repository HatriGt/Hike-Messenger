import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { HelpCircle } from 'lucide-react';

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
    <div className="h-screen bg-[#E8EEF1] p-2 flex justify-center items-center">
      <div className="w-full h-full max-w-[1800px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="bg-[#4E9FE5] p-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">hi</h1>
          <button className="text-white" aria-label="Help">
            <HelpCircle />
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
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
      </div>
    </div>
  );
};

export default ChatLayout;
