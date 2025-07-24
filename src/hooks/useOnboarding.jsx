import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useUserContext } from '../context/UserContext';

/**
 * Hook personalizado para gestionar el estado del onboarding del usuario
 * @returns {{
 *   showOnboarding: boolean,
 *   onboardingCompleted: boolean,
 *   completeOnboarding: Function
 * }}
 */
export const useOnboarding = () => {
  const { user } = useUserContext();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar si el usuario ya completó el onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'userProfile', user.uid);
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

    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  // Función para marcar el onboarding como completado
  const completeOnboarding = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };

  return {
    showOnboarding,
    onboardingCompleted,
    completeOnboarding,
    loading
  };
};
