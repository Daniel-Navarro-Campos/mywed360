import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { useAuth } from './useAuthUnified';

/**
 * Hook personalizado para gestionar el estado del onboarding del usuario
 * @returns {{
 *   showOnboarding: boolean,
 *   onboardingCompleted: boolean,
 *   completeOnboarding: Function
 * }}
 */
export const useOnboarding = () => {
  const { currentUser } = useAuth();
  // Si existe flag en localStorage, mostramos onboarding sí o sí
  const forceFlag = typeof window !== 'undefined' ? localStorage.getItem('forceOnboarding') === '1' : false;
  const [showOnboarding, setShowOnboarding] = useState(forceFlag);
  // No eliminamos el flag aquí; se quitará cuando se complete el tutorial.
  
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // DESHABILITAR TEMPORALMENTE Firebase onboarding checks
  useEffect(() => {
    // MODO OFFLINE TEMPORAL: Solo usar localStorage hasta que se solucionen los permisos
    const checkOnboardingStatus = (user) => {
      // Si hay flag forzado, mostrar onboarding
      if (forceFlag) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      // Si no hay usuario, no mostrar onboarding
      if (!user || !user.uid) {
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      // Solo usar localStorage - NO Firebase por ahora
      const localOnboardingKey = `onboarding_completed_${user.uid}`;
      const localCompleted = localStorage.getItem(localOnboardingKey);
      
      if (localCompleted === 'true') {
        setOnboardingCompleted(true);
        setShowOnboarding(false);
      } else {
        // Primera vez o no completado
        setOnboardingCompleted(false);
        setShowOnboarding(true);
      }
      
      setLoading(false);
    };

    // Usar onAuthStateChanged pero sin consultas a Firebase
    const unsubscribe = onAuthStateChanged(auth, checkOnboardingStatus);
    
    return () => unsubscribe();
  }, [forceFlag]);

  // Función para marcar el onboarding como completado
  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    localStorage.removeItem('forceOnboarding');
    
    // Guardar en localStorage como backup
    if (auth.currentUser && auth.currentUser.uid) {
      const localOnboardingKey = `onboarding_completed_${auth.currentUser.uid}`;
      localStorage.setItem(localOnboardingKey, 'true');
    }
  };

  return {
    showOnboarding,
    onboardingCompleted,
    completeOnboarding,
    loading
  };
};
