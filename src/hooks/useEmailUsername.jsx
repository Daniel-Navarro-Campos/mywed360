import { useState, useCallback } from 'react';
import { auth, db as firestore } from "../lib/firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

/**
 * Hook para gestionar la verificación y configuración de nombres de usuario para correo electrónico
 */
const useEmailUsername = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Comprueba si un nombre de usuario está disponible
   * @param {string} username - Nombre de usuario a verificar
   * @returns {Promise<boolean>} - Promesa que resuelve a true si está disponible
   */
  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Normalizar username (lowercase para consistencia)
      const normalizedUsername = username.toLowerCase();
      
      // Comprobar si cumple con el formato permitido
      const usernameRegex = /^[a-z0-9][a-z0-9._-]{2,29}$/i;
      if (!usernameRegex.test(normalizedUsername)) {
        setError('El nombre de usuario no tiene un formato válido');
        return false;
      }
      
      // Comprobar nombres reservados
      const reservedNames = ['admin', 'soporte', 'noreply', 'contacto', 'info', 'ayuda', 
                            'sistema', 'mywed360', 'staff', 'test', 'prueba'];
      if (reservedNames.includes(normalizedUsername)) {
        setError('Este nombre de usuario está reservado');
        return false;
      }
      
      // Comprobar en Firestore si ya existe
      const usernameQuery = query(
        collection(firestore, 'emailUsernames'),
        where('username', '==', normalizedUsername)
      );
      
      const querySnapshot = await getDocs(usernameQuery);
      
      return querySnapshot.empty; // Disponible si la consulta no devuelve resultados
    } catch (err) {
      console.error('Error al comprobar disponibilidad del nombre:', err);
      setError('Error al verificar disponibilidad. Inténtalo de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reserva un nombre de usuario para el usuario actual
   * @param {string} username - Nombre de usuario a reservar
   * @returns {Promise<boolean>} - Promesa que resuelve a true si se reservó correctamente
   */
  const reserveUsername = useCallback(async (username) => {
    if (!username) return false;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Debes iniciar sesión para reservar un nombre de usuario');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Verificar disponibilidad una última vez
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        return false;
      }
      
      const normalizedUsername = username.toLowerCase();
      
      // Guardar en colección de nombres de usuario
      await setDoc(doc(firestore, 'emailUsernames', normalizedUsername), {
        username: normalizedUsername,
        userId: currentUser.uid,
        createdAt: new Date(),
        email: `${normalizedUsername}@mywed360`
      });
      
      // Actualizar el perfil del usuario con su correo myWed360
      await setDoc(doc(firestore, 'users', currentUser.uid), {
        emailUsername: normalizedUsername,
        myWed360Email: `${normalizedUsername}@mywed360`
      }, { merge: true });
      
      return true;
    } catch (err) {
      console.error('Error al reservar nombre de usuario:', err);
      setError('Error al guardar el nombre de usuario. Inténtalo de nuevo.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [checkUsernameAvailability]);

  /**
   * Obtiene el nombre de usuario actual del usuario conectado
   * @returns {Promise<string|null>} - Promesa que resuelve al nombre de usuario o null
   */
  const getCurrentUsername = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    setLoading(true);
    
    try {
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.emailUsername) return userData.emailUsername;

        // Fallback: si ya existe myWed360Email, extraemos la parte antes de @
        if (userData.myWed360Email) {
          const parts = userData.myWed360Email.split("@");
          if (parts.length) return parts[0];
        }
        return null;
      }
      
      return null;
    } catch (err) {
      console.error('Error al obtener nombre de usuario:', err);
      setError('Error al cargar información de usuario');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkUsernameAvailability,
    reserveUsername,
    getCurrentUsername,
    loading,
    error
  };
};

export default useEmailUsername;
