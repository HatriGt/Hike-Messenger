import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Paper, Fade, Grow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

const WelcomePopup: React.FC = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <Fade in={true} timeout={1000}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#E8EEF1',
        }}
      >
        <Grow in={showContent} timeout={1000}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '20px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#4E9FE5' }}>
              Welcome to Hike Messenger
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: '#666' }}>
              Connect with friends and start chatting instantly!
            </Typography>
            <Button
              variant="contained"
              onClick={handleSignIn}
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
              Sign In with Google
            </Button>
          </Paper>
        </Grow>
      </Box>
    </Fade>
  );
};

export default WelcomePopup;
