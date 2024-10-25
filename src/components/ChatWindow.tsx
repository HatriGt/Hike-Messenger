import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Paperclip, Smile, Check, WifiOff } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import './ChatWindow.css';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { User, Message } from '../types';
import { formatTimestamp } from '../utils';
import NudgeSendIcon from '../media/images/NudgeSend.svg';
import NudgeReceiveIcon from '../media/images/NudgeReceive.svg';

interface ChatWindowProps {
  currentUser: User;
  selectedUser: User;
  onBack?: () => void;
  isMobile: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  currentUser, 
  selectedUser, 
  onBack,
  isMobile 
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesRef = collection(db, 'messages');
  const bottomRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
        } as Message)).filter(msg => msg.participants.includes(selectedUser.id || selectedUser.uid));
        setMessages(updatedMessages);

        // Mark messages as delivered
        updatedMessages.forEach(async (msg) => {
          if (msg.recipientUid === currentUser.uid && !msg.delivered) {
            await updateDoc(doc(messagesRef, msg.id), { delivered: true });
          }
        });
      } catch (error) {
        console.error("Error in onSnapshot:", error);
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid, selectedUser.id, selectedUser.uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        const unreadMessages = messages.filter(
          (msg: Message) => msg.recipientUid === currentUser.uid && !msg.read
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

    if (!isOnline) {
      alert("You are currently offline. Please check your internet connection and try again.");
      return;
    }

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

  const renderMessageContent = (message: Message) => {
    if (message.text === ':nudge:') {
      const isCurrentUser = message.uid === currentUser.uid;
      const nudgeIcon = isCurrentUser ? NudgeSendIcon : NudgeReceiveIcon;
      return (
        <img 
          src={nudgeIcon} 
          alt="Nudge" 
          className="nudge-icon"
        />
      );
    }
    
    // Existing message rendering logic
    return message.text;
  };

  const renderMessage = (message: Message) => {
    const isNudge = message.text === ':nudge:';
    const isCurrentUser = message.uid === currentUser.uid;
    const isEmoji = isOnlyEmojis(message.text);

    const renderStatusIndicators = () => (
      <div className={`flex items-center text-xs whitespace-nowrap ${isEmoji || isNudge ? 'emoji-status' : ''}`}>
        <span>{formatTimestamp(message.createdAt)}</span>
        {isCurrentUser && (
          <span className="ml-1 read-status">
            <span className="double-tick">✓✓</span>
            {message.read && <span className="read-indicator">R</span>}
          </span>
        )}
      </div>
    );

    return (
      <div
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
        key={message.id}
      >
        {isNudge ? (
          <div className="nudge-container">
            {renderMessageContent(message)}
            {renderStatusIndicators()}
          </div>
        ) : (
          <div
            className={`max-w-[70%] ${
              isEmoji ? 'emoji-only' : 'rounded-lg py-1 px-2'
            } ${
              isCurrentUser
                ? isEmoji ? '' : 'bg-[#4E9FE5] text-white message-sent'
                : isEmoji ? '' : 'bg-white text-gray-800 message-received'
            }`}
          >
            <div className={`flex items-end ${isEmoji ? 'flex-col' : 'justify-between'}`}>
              <p className={`${isEmoji ? 'text-4xl' : 'text-sm'} mr-2`}>{renderMessageContent(message)}</p>
              {renderStatusIndicators()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prevMessage => prevMessage + emojiData.emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isOnlyEmojis = (text: string) => {
    const emojiRegex = /^[\p{Emoji}]+$/u;
    return emojiRegex.test(text);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click is not on a message bubble, emoji, or nudge icon
    if (!(e.target as HTMLElement).closest('.message-sent, .message-received, .emoji-only, .nudge-container')) {
      sendNudge();
    }
  };

  const handleDoubleTap = (() => {
    let lastTap = 0;
    const delay = 300; // ms

    return (e: React.TouchEvent<HTMLDivElement>) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < delay && tapLength > 0) {
        // Check if the tap is not on a message bubble, emoji, or nudge icon
        if (!(e.target as HTMLElement).closest('.message-sent, .message-received, .emoji-only, .nudge-container')) {
          sendNudge();
          if (navigator.vibrate) {
            navigator.vibrate(200); // Vibrate for 200ms
          }
        }
      }
      lastTap = currentTime;
    };
  })();

  const sendNudge = async () => {
    if (!isOnline) {
      alert("You are currently offline. Please check your internet connection and try again.");
      return;
    }

    try {
      const newMessage = {
        text: ':nudge:',
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        recipientUid: selectedUser.id,
        participants: [currentUser.uid, selectedUser.id],
        delivered: false,
        read: false,
      };

      console.log("Sending nudge:", newMessage);
      const docRef = await addDoc(messagesRef, newMessage);
      console.log("Nudge sent, docRef:", docRef.id);

      // Simulate delivery after a short delay
      setTimeout(async () => {
        try {
          await updateDoc(doc(messagesRef, docRef.id), { delivered: true });
          console.log("Nudge marked as delivered");
        } catch (error) {
          console.error("Error marking nudge as delivered:", error);
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending nudge:", error);
    }
  };

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (chatArea) {
      const preventDefaultForScrolling = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };
      
      chatArea.addEventListener('touchstart', preventDefaultForScrolling, { passive: false });
      return () => {
        chatArea.removeEventListener('touchstart', preventDefaultForScrolling);
      };
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white max-w-4xl mx-auto w-full">
      <div className="sticky top-0 z-10 p-4 border-b border-gray-200 flex items-center bg-white shadow-sm">
        {isMobile && (
          <button 
            onClick={onBack}
            className="mr-3 p-2 rounded-full hover:bg-gray-100"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3">
          {selectedUser.photoURL ? (
            <img src={selectedUser.photoURL} alt={selectedUser.displayName || ''} className="w-10 h-10 rounded-full" />
          ) : (
            <span className="text-xl font-bold text-white">{selectedUser.displayName?.[0] || ''}</span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{selectedUser.displayName}</h2>
          <p className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>

      <div 
        ref={chatAreaRef}
        className="flex-grow p-4 overflow-y-auto bg-[#E8EEF1]"
        onTouchStart={handleDoubleTap}
        onDoubleClick={handleDoubleClick}
      >
        {messages.map((msg: Message) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 bg-white">
        {!isOnline && (
          <div className="mb-2 flex items-center justify-center text-red-500">
            <WifiOff className="h-4 w-4 mr-2" />
            <span>You are offline. Messages cannot be sent at this time.</span>
          </div>
        )}
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <button 
            type="button" 
            className="text-gray-500 hover:text-[#4E9FE5]" 
            aria-label="Attach file"
            disabled={!isOnline}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button 
            type="button" 
            className="text-gray-500 hover:text-[#4E9FE5]" 
            aria-label="Emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={!isOnline}
          >
            <Smile className="h-5 w-5" />
          </button>
          <div className="relative flex-grow">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isOnline ? "Type a message..." : "You are offline"}
              className="w-full bg-gray-100 border-none rounded-full py-3 px-6 focus:ring-2 focus:ring-[#4E9FE5] transition-all duration-300"
              disabled={!isOnline}
            />
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-12 left-0">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className={`rounded-full ${isOnline ? 'bg-[#4E9FE5] hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'} text-white p-3 transition-all duration-300`}
            aria-label="Send message"
            disabled={!isOnline}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
