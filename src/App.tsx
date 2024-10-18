import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';
import { auth } from './firebase';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route
          path="/*"
          element={user ? <ChatLayout /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
