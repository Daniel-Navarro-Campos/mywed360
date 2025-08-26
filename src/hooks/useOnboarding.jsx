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

  // Verificar si el usuario ya completó el onboarding
  useEffect(() => {
    let unsubscribe = null;
    
    const checkOnboardingStatus = async (user) => {
      // Si hay flag forzado, no verificar estado
      if (forceFlag) {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      // Si no hay usuario autenticado, no mostrar onboarding
      if (!user || !user.uid || typeof user.uid !== 'string' || user.uid.trim() === '') {
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar que el usuario esté completamente autenticado
        if (!user.emailVerified && user.isAnonymous === false) {
          // Usuario no verificado, esperar un poco más
          setTimeout(() => checkOnboardingStatus(user), 1000);
          return;
        }

        // Validar que el UID sea válido antes de hacer la consulta
        if (user.uid.length < 10 || !/^[a-zA-Z0-9]+$/.test(user.uid)) {
          console.warn('UID inválido detectado:', user.uid);
          setShowOnboarding(false);
          setLoading(false);
          return;
        }
        
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
        // En caso de error, no mostrar onboarding para evitar bucles
        setShowOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    // Usar onAuthStateChanged para asegurar que tenemos el estado correcto de autenticación
    unsubscribe = onAuthStateChanged(auth, (user) => {
      checkOnboardingStatus(user);
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [forceFlag]); // Removemos currentUser de las dependencias ya que usamos onAuthStateChanged

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
