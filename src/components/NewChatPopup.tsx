import React from 'react';
import { X } from 'lucide-react';

interface User {
  id: string;
  displayName: string;
  photoURL: string;
}

interface NewChatPopupProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onClose: () => void;
}

const NewChatPopup: React.FC<NewChatPopupProps> = ({ users, onSelectUser, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">New Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        {users.length > 0 ? (
          <ul>
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
                onClick={() => {
                  onSelectUser(user);
                  onClose();
                }}
              >
                <div className="w-10 h-10 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-xl font-bold text-white">{user.displayName[0]}</span>
                  )}
                </div>
                <span className="font-semibold">{user.displayName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500">No new users to chat with.</p>
        )}
      </div>
    </div>
  );
};

export default NewChatPopup;
