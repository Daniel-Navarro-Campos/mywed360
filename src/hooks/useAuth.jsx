/**
 * Hook centralizado para la autenticación en Lovenda
 * Este hook proporciona funcionalidades de autenticación y gestión de perfil de usuario
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { initReminderService, stopReminderService } from '../services/reminderService';

// Crear contexto de autenticación
const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijo
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simular la carga del usuario al iniciar la aplicación
  useEffect(() => {
    // En una aplicación real, aquí verificaríamos la sesión actual
    const loadUserFromStorage = () => {
      try {
        // Obtener datos de usuario de localStorage (simulación)
        const savedUser = localStorage.getItem('lovenda_user');
        const savedProfile = localStorage.getItem('lovenda_user_profile');
        
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
          
          if (savedProfile) {
          const savedUserObj = JSON.parse(savedUser);
          let profileObj = JSON.parse(savedProfile);
          // Si falta myWed360Email, sincronizar
           if (!profileObj.myWed360Email && savedUserObj.email) {
            // Generar alias usando los primeros 4 caracteres del email de login
            const loginPrefix = savedUserObj.email.split('@')[0].slice(0,4).toLowerCase();
            profileObj.myWed360Email = `${loginPrefix}@mywed360.com`;
            localStorage.setItem('lovenda_user_profile', JSON.stringify(profileObj));
          }
          setUserProfile(profileObj);
            setUserProfile(JSON.parse(savedProfile));
          } else {
            // Perfil por defecto si no existe
            const defaultProfile = {
              id: JSON.parse(savedUser).uid || 'user123',
              name: 'Usuario Lovenda',
              email: 'usuario@lovenda.app',
              preferences: {
                emailNotifications: true,
                emailSignature: 'Enviado desde Lovenda',
                theme: 'light',
                remindersEnabled: true,
                reminderDays: 3
              }
            };
            setUserProfile(defaultProfile);
            localStorage.setItem('lovenda_user_profile', JSON.stringify(defaultProfile));
          }
        } else {
          // Soporte para pruebas E2E con Cypress: detectar claves userEmail / isLoggedIn
          const testEmail = localStorage.getItem('userEmail');
          const isLoggedIn = localStorage.getItem('isLoggedIn');
          if (isLoggedIn === 'true' && testEmail) {
            const mockUser = {
              uid: 'cypress-test',
              email: testEmail,
              displayName: testEmail.split('@')[0]
            };
            setCurrentUser(mockUser);
            localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
            // Crear perfil por defecto para la sesión de prueba
            const defaultProfile = {
              id: mockUser.uid,
              name: mockUser.displayName,
              email: mockUser.email,
              preferences: {
                emailNotifications: true,
                emailSignature: 'Enviado desde Lovenda – Cypress',
                theme: 'light',
                remindersEnabled: false,
                reminderDays: 3
              }
            };
            setUserProfile(defaultProfile);
            localStorage.setItem('lovenda_user_profile', JSON.stringify(defaultProfile));
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // Iniciar o detener el servicio de recordatorios cuando cambie el perfil
  useEffect(() => {
    if (loading) return;
    if (!userProfile) return;
    const { remindersEnabled = true, reminderDays = 3 } = userProfile.preferences || {};
    if (remindersEnabled) {
      initReminderService({ days: reminderDays, enabled: true });
    } else {
      stopReminderService();
    }
    return () => stopReminderService();
  }, [loading, userProfile]);
  
  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado del inicio de sesión
   */
  const login = async (email, password) => {
    try {
      // Simulación de login (en implementación real conectaría con backend)
      const mockUser = { 
        uid: 'user123', 
        email: email,
        displayName: email.split('@')[0]
      };
      
      // Guardar en localStorage para mantener la sesión
      localStorage.setItem('lovenda_user', JSON.stringify(mockUser));
      
      setCurrentUser(mockUser);
      
      // Crear perfil por defecto si no existe
      if (!userProfile) {
        const defaultProfile = {
          id: mockUser.uid,
          name: mockUser.displayName || 'Usuario Lovenda',
          email: mockUser.email,
          preferences: {
            emailNotifications: true,
            emailSignature: 'Enviado desde Lovenda',
            theme: 'light',
            remindersEnabled: true,
            reminderDays: 3
          }
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('lovenda_user_profile', JSON.stringify(defaultProfile));
      }
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del cierre de sesión
   */
  const logout = async () => {
    try {
      // Limpiar datos de sesión
      localStorage.removeItem('lovenda_user');
      setCurrentUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Actualizar el perfil del usuario
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise<Object>} Resultado de la actualización
   */
  const updateUserProfile = async (profileData) => {
    try {
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      localStorage.setItem('lovenda_user_profile', JSON.stringify(updatedProfile));
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return { success: false, error: error.message };
    }
  };

  // Valor del contexto que se proveerá a los componentes
  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    updateUserProfile,
    // Alias para compatibilidad con código existente
    user: currentUser,
    profile: userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @returns {Object} El contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};

// Exportación por defecto para consistencia con las importaciones actuales
export default useAuth;
