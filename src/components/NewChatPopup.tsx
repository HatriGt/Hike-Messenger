import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface User {
  id: string;
  displayName: string;
  photoURL: string;
}

interface NewChatPopupProps {
  users: User[];
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

const NewChatPopup: React.FC<NewChatPopupProps> = ({ users, onClose, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">New Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-gray-100 border-none rounded-full focus:ring-2 focus:ring-[#4E9FE5] transition-all duration-300"
            />
          </div>
          <div className="overflow-y-auto max-h-[50vh]">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="w-10 h-10 rounded-full bg-[#4E9FE5] flex items-center justify-center mr-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-xl font-bold text-white">{user.displayName[0]}</span>
                    )}
                  </div>
                  <span className="font-medium">{user.displayName}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No users available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatPopup;
