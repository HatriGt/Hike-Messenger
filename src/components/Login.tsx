import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const navigate = useNavigate();

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        // Save user info to Firestore
        setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }, { merge: true });
        navigate('/');
      })
      .catch((error) => {
        console.error('Error signing in with Google', error);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">Welcome to Hike Messenger</h1>
        <button
          onClick={signInWithGoogle}
          className="w-full px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-600"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
