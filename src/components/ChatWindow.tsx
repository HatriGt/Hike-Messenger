import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Paperclip, Mic, Check } from 'lucide-react';

interface ChatWindowProps {
  currentUser: any;
  selectedUser: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, selectedUser }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesRef = collection(db, 'messages');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      messagesRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const updatedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter((msg: any) => msg.participants.includes(selectedUser.id));
        setMessages(updatedMessages);

        // Mark messages as delivered
        updatedMessages.forEach(async (msg: any) => {
          if (msg.recipientUid === currentUser.uid && !msg.delivered) {
            await updateDoc(doc(messagesRef, msg.id), { delivered: true });
          }
        });
      } catch (error) {
        console.error("Error in onSnapshot:", error);
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid, selectedUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        const unreadMessages = messages.filter(
          (msg: any) => msg.recipientUid === currentUser.uid && !msg.read
        );
        
        for (const msg of unreadMessages) {
          await updateDoc(doc(messagesRef, msg.id), { read: true });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();
  }, [messages, currentUser.uid]);

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
        delivered: false,
        read: false,
      };

      console.log("Sending message:", newMessage);
      const docRef = await addDoc(messagesRef, newMessage);
      console.log("Message sent, docRef:", docRef.id);
      setMessage('');

      // Simulate delivery after a short delay
      setTimeout(async () => {
        try {
          await updateDoc(doc(messagesRef, docRef.id), { delivered: true });
          console.log("Message marked as delivered");
        } catch (error) {
          console.error("Error marking message as delivered:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const renderMessageStatus = (msg: any) => {
    if (msg.uid !== currentUser.uid) return null;
    if (msg.read) return <div className="flex"><Check className="h-4 w-4 text-blue-500" /><Check className="h-4 w-4 text-blue-500 -ml-2" /></div>;
    if (msg.delivered) return <div className="flex"><Check className="h-4 w-4 text-gray-500" /><Check className="h-4 w-4 text-gray-500 -ml-2" /></div>;
    return <Check className="h-4 w-4 text-gray-300" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <div className="w-10 h-10 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3">
          {selectedUser.photoURL ? (
            <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-xl font-bold text-white">{selectedUser.displayName[0]}</span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{selectedUser.displayName}</h2>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto bg-[#E8EEF1]">
        {messages.map((msg: any, index: number) => (
          <div
            key={index}
            className={`flex ${
              msg.uid === currentUser.uid ? 'justify-end' : 'justify-start'
            } mb-4`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.uid === currentUser.uid
                  ? 'bg-[#4E9FE5] text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p>{msg.text}</p>
              <div className="flex items-center justify-end mt-1">
                <span className="text-xs opacity-70 mr-1">
                  {msg.createdAt?.toDate().toLocaleTimeString()}
                </span>
                {renderMessageStatus(msg)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-white">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <button type="button" className="text-gray-500 hover:text-[#4E9FE5]" aria-label="Attach file">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow bg-gray-100 border-none rounded-full py-2 px-4 focus:ring-2 focus:ring-[#4E9FE5] transition-all duration-300"
          />
          <button type="submit" className="rounded-full bg-[#4E9FE5] text-white p-2 hover:bg-opacity-90 transition-all duration-300" aria-label="Send message">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
