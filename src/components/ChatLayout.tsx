import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, onSnapshot, getDocs, where, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import { IconButton, Avatar, Popover, Box, Typography, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { styled } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import HikeLogo from '../media/images/HikeLogo.png'; // Make sure this path is correct

// Styled components for custom Dialog
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    padding: theme.spacing(2),
    backgroundColor: '#E8EEF1',
  },
}));

const StyledDialogTitle = styled(DialogTitle)({
  color: '#4E9FE5',
  fontWeight: 'bold',
});

const StyledDialogContent = styled(DialogContent)({
  color: '#666',
});

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '25px',
  padding: theme.spacing(1, 4),
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 'bold',
}));

const ChatLayout: React.FC = () => {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const isMobile = useMediaQuery('(max-width:768px)');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (user) {
        try {
          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
          const userList = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(u => u.id !== user.uid);
          setUsers(userList);
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }
    };

    fetchUsers();

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const userList = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as User))
          .filter((u) => u.id !== user?.uid);
        setUsers(userList);
      } catch (error) {
        console.error("Error in user snapshot listener:", error);
      }
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

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirmation(false);
    try {
      await signOut(auth);
      setIsLoggingOut(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'user-popover' : undefined;

  const handleMobileUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleBackToUsers = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  return (
    <div className={`h-screen bg-[#E8EEF1] ${isMobile ? 'p-0' : 'p-4'} flex justify-center items-center`}>
      <div className={`w-full h-full ${isMobile ? 'rounded-none' : 'max-w-7xl rounded-3xl'} bg-white shadow-xl overflow-hidden flex flex-col`}>
        {(!isMobile || !showChat) && (
          <div className={`bg-[#00acff] p-4 flex justify-between items-center ${isMobile ? '' : 'rounded-t-3xl'}`}>
            <div className="flex items-center">
              <img 
                src={HikeLogo} 
                alt="Hike Logo" 
                className={`${isMobile ? 'h-11' : 'h-12'} mr-2`} 
              />
            </div>
            <IconButton onClick={handleSettingsClick} sx={{ color: 'white' }}>
              <SettingsIcon />
            </IconButton>
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                style: {
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                bgcolor: 'white',
                borderRadius: '20px',
                minWidth: '250px',
              }}>
                <Avatar
                  src={auth.currentUser?.photoURL || undefined}
                  alt={auth.currentUser?.displayName || 'User'}
                  sx={{ width: 100, height: 100, mb: 2, bgcolor: '#4E9FE5' }}
                />
                <Typography variant="h5" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
                  {auth.currentUser?.displayName}
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                  {auth.currentUser?.email}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  sx={{
                    bgcolor: '#4E9FE5',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#3D8CD6',
                    },
                    borderRadius: '25px',
                    px: 4,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {isLoggingOut ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Logout'
                  )}
                </Button>
              </Box>
            </Popover>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {isMobile ? (
            // Mobile Layout
            showChat ? (
              <ChatWindow 
                currentUser={user as User} 
                selectedUser={selectedUser!}
                onBack={handleBackToUsers}
                isMobile={true}
              />
            ) : (
              <div className="w-full">
                {/* Add a container with rounded top corners for the UserList */}
                <div className="bg-[#00acff]">
                  <div className="bg-white rounded-t-[20px] overflow-hidden">
                  <UserList 
                    users={users} 
                    onSelectUser={handleMobileUserSelect} 
                    selectedUser={selectedUser} 
                    currentUser={user as User}
                  />
                  </div>
                </div>
              </div>
            )
          ) : (
            // Desktop Layout
            <>
              <UserList 
                users={users} 
                onSelectUser={setSelectedUser} 
                selectedUser={selectedUser} 
                currentUser={user as User}
              />
              {selectedUser ? (
                <ChatWindow 
                  currentUser={user as User} 
                  selectedUser={selectedUser}
                  isMobile={false}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white">
                  <p className="text-xl text-gray-500">Select a user to start chatting</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <StyledDialog
        open={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <StyledDialogTitle id="alert-dialog-title">
          Confirm Logout
        </StyledDialogTitle>
        <StyledDialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to log out?
          </DialogContentText>
        </StyledDialogContent>
        <DialogActions>
          <StyledButton 
            onClick={handleLogoutCancel} 
            sx={{ color: '#4E9FE5', '&:hover': { backgroundColor: 'rgba(78, 159, 229, 0.1)' } }}
          >
            Cancel
          </StyledButton>
          <StyledButton 
            onClick={handleLogoutConfirm} 
            variant="contained"
            sx={{ 
              backgroundColor: '#4E9FE5', 
              color: 'white',
              '&:hover': { backgroundColor: '#3D8CD6' } 
            }}
            autoFocus
          >
            Logout
          </StyledButton>
        </DialogActions>
      </StyledDialog>
    </div>
  );
};

export default ChatLayout;
