import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../firebase';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  currentUser: any;
  selectedUser: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, selectedUser }) => {
  const [message, setMessage] = useState('');
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('participants', 'array-contains', currentUser.uid),
    orderBy('createdAt', 'asc'),  // Changed to ascending order
    limit(50)
  );

  const [messages, loading, error] = useCollectionData(q);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    try {
      const newMessage = {
        text: message,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        recipientUid: selectedUser.id,
        participants: [currentUser.uid, selectedUser.id],
      };
      await addDoc(messagesRef, newMessage);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const filteredMessages = messages?.filter(
    (msg: any) => msg.participants.includes(selectedUser.id)
  ) || [];

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      <div className="bg-green-600 p-4 text-white flex items-center">
        <img
          src={selectedUser.photoURL || 'https://via.placeholder.com/40'}
          alt={selectedUser.displayName}
          className="w-10 h-10 rounded-full mr-3"
        />
        <h2 className="text-xl font-bold">{selectedUser.displayName}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex ${
                msg.uid === currentUser.uid ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.uid === currentUser.uid ? 'bg-green-200' : 'bg-white'
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.createdAt?.toDate().toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500">No messages yet</div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="bg-white p-4 border-t">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 rounded-full py-2 px-4 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="ml-2 bg-green-500 text-white rounded-full p-2 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
