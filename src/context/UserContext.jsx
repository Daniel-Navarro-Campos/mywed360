import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
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
    // Soporte para pruebas E2E con Cypress: detectar claves userEmail / isLoggedIn
    const testEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true' && testEmail) {
      const mockUser = {
        uid: 'cypress-test',
        email: testEmail,
        displayName: testEmail.split('@')[0],
        role: 'particular'
      };
      setUser(mockUser);
      setLoading(false);
      return; // Skip Firebase auth listeners
    }
    
    // En modo desarrollo podemos forzar un rol sin pasar por Firebase,
    // pero solo si el desarrollador lo ha indicado explícitamente.
    if (process.env.NODE_ENV === 'development') {
      // Lee override de variable de entorno o de localStorage
      const devRole = import.meta.env.VITE_DEV_ROLE || localStorage.getItem('lovenda_dev_role');
      if (devRole) {
        setUser({ uid: 'dev', email: 'dev@local', role: devRole });
        setLoading(false);
        return; // Skip Firebase auth listeners
      }
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

  const signup = async (email, password, role = 'particular') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    await setDoc(doc(db, 'users', newUser.uid), { role, email: newUser.email, createdAt: serverTimestamp() });
    setUser({ ...newUser, role });
    return newUser;
  };

  const login = async (email, password, remember = true) => {
    // Siempre usamos browserLocalPersistence para que la sesión se conserve aunque se cierre el navegador.
    // El parámetro "remember" queda sólo para conservar el email en localStorage, no afecta a la persistencia.
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    let role = 'particular';
    try {
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        role = userDoc.data().role || role;
      }
    } catch (err) {
      console.warn('No se pudo obtener rol en login:', err?.code || err);
    }
    setUser({ ...userCredential.user, role });
    return { ...userCredential.user, role };
};

  // Cerrar sesión y limpiar estado
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
      role: user?.role || null,
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
