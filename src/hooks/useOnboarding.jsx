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
        // BYPASS TEMPORAL: Usar localStorage como fallback mientras se solucionan los permisos de Firebase
        const localOnboardingKey = `onboarding_completed_${user.uid}`;
        const localCompleted = localStorage.getItem(localOnboardingKey);
        
        if (localCompleted === 'true') {
          setOnboardingCompleted(true);
          setShowOnboarding(false);
          setLoading(false);
          return;
        }

        // Intentar Firebase con timeout y fallback
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 3000)
        );
        
        const firestorePromise = (async () => {
          const profileRef = doc(db, 'users', user.uid);
          const profileDoc = await getDoc(profileRef);
          return profileDoc;
        })();

        try {
          const profileDoc = await Promise.race([firestorePromise, timeoutPromise]);
          
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            const completed = data.onboardingCompleted || false;
            setOnboardingCompleted(completed);
            setShowOnboarding(!completed);
            
            // Guardar en localStorage como backup
            if (completed) {
              localStorage.setItem(localOnboardingKey, 'true');
            }
          } else {
            // Si no existe perfil, mostrar onboarding
            setShowOnboarding(true);
          }
        } catch (firebaseError) {
          console.warn('Firebase no disponible, usando modo offline:', firebaseError.message);
          // Modo offline: asumir que necesita onboarding si no hay datos locales
          setShowOnboarding(true);
          setOnboardingCompleted(false);
        }
      } catch (error) {
        console.error('Error al verificar estado de onboarding:', error);
        // Fallback: no mostrar onboarding para evitar bucles
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
