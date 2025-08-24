import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
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

  // Verificar si el usuario ya completó el onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (currentUser?.role && ['planner', 'assistant'].includes(currentUser.role)) {
        // No mostrar tutorial para wedding planners ni ayudantes
        setShowOnboarding(false);
        setOnboardingCompleted(true);
        setLoading(false);
        return;
      }
      if (forceFlag) {
        setLoading(false);
        return;
      }
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', user.uid);
        const profileDoc = await getDoc(profileRef);
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          const completed = data.onboardingCompleted || false;
          setOnboardingCompleted(completed);
          
          // Mostrar onboarding solo si no se ha completado
          setShowOnboarding(!completed);
        } else {
          // Si no existe perfil, mostrar onboarding
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error al verificar estado de onboarding:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [currentUser, forceFlag]);

  // Función para marcar el onboarding como completado
  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    localStorage.removeItem('forceOnboarding');
  };

  return {
    showOnboarding,
    onboardingCompleted,
    completeOnboarding,
    loading
  };
};
