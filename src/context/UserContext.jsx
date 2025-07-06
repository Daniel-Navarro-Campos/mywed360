import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const UserContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const useUserContext = () => useContext(UserContext);

export default function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bypass login in development phase
    if (process.env.NODE_ENV === 'development') {
      setUser({ uid: 'dev', email: 'dev@local', role: 'particular' });
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role = 'particular';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            role = userDoc.data().role || 'particular';
          } else {
            // Intenta crear el documento si no existe
            await setDoc(
              doc(db, 'users', firebaseUser.uid),
              { role, email: firebaseUser.email, createdAt: serverTimestamp() },
              { merge: true }
            );
          }
        } catch (err) {
          // No interrumpas la sesión por problemas de permisos / offline
          console.warn('No se pudo obtener/crear el doc de usuario:', err?.code || err);
        }
        setUser({ ...firebaseUser, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    await setDoc(doc(db, 'users', newUser.uid), { role: 'particular', email: newUser.email, createdAt: serverTimestamp() });
    setUser({ ...newUser, role: 'particular' });
    return newUser;
  };

  const login = async (email, password, remember = true) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateProfile = async (profile) => {
    if (auth.currentUser) {
      await fbUpdateProfile(auth.currentUser, profile);
      setUser({ ...auth.currentUser, ...profile });
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const sendPasswordReset = async (email) => {
    if (email) {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const updateUserEmail = async (newEmail) => {
    if (auth.currentUser) {
      await updateEmail(auth.currentUser, newEmail);
      setUser({ ...auth.currentUser, email: newEmail });
    }
  };

  const updateUserPassword = async (newPassword) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  const reauthenticate = async (credential) => {
    if (auth.currentUser) {
      await reauthenticateWithCredential(auth.currentUser, credential);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      signup,
      login,
      logout,
      updateProfile,
      sendVerificationEmail,
      sendPasswordReset,
      updateUserEmail,
      updateUserPassword,
      reauthenticate,
    }}>
      {children}
    </UserContext.Provider>
  );
}
