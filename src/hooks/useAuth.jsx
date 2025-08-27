/**
 * Hook centralizado para la autenticación en Lovenda
 * Este hook proporciona funcionalidades de autenticación y gestión de perfil de usuario
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { initReminderService, stopReminderService } from '../services/reminderService';
import { setAuthContext as registerEmailAuthContext } from '../services/emailService';

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
   * Obtener token de autenticación
   * @param {boolean} forceRefresh - Forzar actualización del token
   * @returns {Promise<string>} Token de autenticación
   */
  const getIdToken = useCallback(async (forceRefresh = false) => {
    try {
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }

      // Para usuarios mock/test, generar token compatible
      if (currentUser.uid === 'cypress-test' || currentUser.uid.startsWith('mock-')) {
        const mockToken = `mock-${currentUser.uid}-${currentUser.email}`;
        console.log(' Token mock generado para:', currentUser.email);
        return mockToken;
      }

      // Para usuarios reales de Firebase
      if (currentUser.getIdToken) {
        const token = await currentUser.getIdToken(forceRefresh);
        console.log(' Token Firebase obtenido');
        return token;
      }

      // Fallback: generar token mock si no hay método getIdToken
      const fallbackToken = `mock-${currentUser.uid}-${currentUser.email}`;
      console.log(' Token fallback generado para:', currentUser.email);
      return fallbackToken;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      throw error;
    }
  }, [currentUser]);

  /**
   * Cerrar sesión
   * @returns {Promise<Object>} Resultado del cierre de sesión
   */
  const logout = useCallback(async () => {
    try {
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem('lovenda_user');
      localStorage.removeItem('lovenda_user_profile');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isLoggedIn');
      console.log(' Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }, []);

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

  // Derivar estado de autenticación y alias legibles
  const isAuthenticated = !!currentUser;
  const isLoading = loading;

  // Valor del contexto que se proveerá a los componentes
  const value = {
    currentUser,
    userProfile,
    loading: isLoading,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUserProfile,
    getIdToken,
    // Alias para compatibilidad con código existente
    user: currentUser,
    profile: userProfile
  };

  // Registrar el contexto en emailService para que pueda obtener el token
  useEffect(() => {
    registerEmailAuthContext({
      currentUser,
      getIdToken,
    });
  }, [currentUser, getIdToken]);

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
