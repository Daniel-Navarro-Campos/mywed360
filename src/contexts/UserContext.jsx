import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Contexto específico para preferencias de usuario y datos de perfil
// Diferente del contexto de autenticación en /context/UserContext.jsx

// Crear el contexto para preferencias de usuario
export const UserPreferencesContext = createContext();

/**
 * Proveedor del contexto de preferencias de usuario
 * Encapsula las preferencias y datos extendidos del usuario y los hace disponibles para los componentes hijos
 */
export const UserPreferencesProvider = ({ children }) => {
  const { currentUser: authUser, isAuthenticated } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    emailNotifications: true,
    theme: 'light',
    language: 'es'
  });

  // Actualizar el usuario cuando cambia la autenticación
  useEffect(() => {
    if (authUser && isAuthenticated) {
      // Actualizar el usuario con datos adicionales si es necesario
      setCurrentUser({
        ...authUser,
        // Aquí podríamos agregar más información del usuario si fuera necesario
        // por ejemplo, datos obtenidos de una API o base de datos
      });
    } else {
      setCurrentUser(null);
    }
  }, [authUser, isAuthenticated]);

  // Función para actualizar las preferencias del usuario
  const updatePreferences = (newPreferences) => {
    setUserPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
    // Aquí podríamos guardar las preferencias en algún almacenamiento persistente
  };

  // Valor del contexto
  const value = {
    currentUser,
    userPreferences,
    updatePreferences
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export default UserPreferencesProvider;
