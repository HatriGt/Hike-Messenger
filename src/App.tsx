import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ChatLayout from './components/ChatLayout';
import WelcomePopup from './components/WelcomePopup';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserInFirestore = async (currentUser: User) => {
    if (currentUser.email && auth.currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.email);
        const userSnap = await getDoc(userRef);

        const userData = {
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          lastLogin: new Date(),
          uid: currentUser.uid,
        };

        if (userSnap.exists()) {
          await setDoc(userRef, userData, { merge: true });
          console.log('User details updated in Firestore');
        } else {
          await setDoc(userRef, {
            ...userData,
            createdAt: new Date(),
          });
          console.log('New user added to Firestore');
        }
      } catch (error) {
        console.error('Error updating/inserting user in Firestore:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        console.log('Current user:', currentUser);
        console.log('Auth current user:', auth.currentUser);
      }
    } else {
      console.error('User email or auth.currentUser is null');
      console.log('Current user:', currentUser);
      console.log('Auth current user:', auth.currentUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Wait for the auth state to fully resolve
        auth.currentUser?.getIdToken(true).then(() => {
          updateUserInFirestore(currentUser);
        }).catch(error => {
          console.error('Error getting ID token:', error);
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <ChatLayout />
            ) : (
              <WelcomePopup />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
