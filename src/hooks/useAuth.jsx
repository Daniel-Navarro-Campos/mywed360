/**
 * Hook centralizado para la autenticación en Lovenda
 * Este hook proporciona funcionalidades de autenticación y gestión de perfil de usuario
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { initReminderService, stopReminderService } from '../services/reminderService';
import { auth, autoAuthenticateUser } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

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

  // Integrar Firebase Auth real con localStorage como respaldo
  useEffect(() => {
    let unsubscribe;
    
    const initializeAuth = async () => {
      try {
        // Intentar autenticación automática de Firebase
        const firebaseUser = await autoAuthenticateUser();
        
        // Configurar listener de cambios de autenticación de Firebase
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            // Usuario autenticado en Firebase
            const firebaseUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || 'usuario@mywed360.com',
              displayName: firebaseUser.displayName || 'Usuario MyWed360',
              isAnonymous: firebaseUser.isAnonymous
            };
            
            setCurrentUser(firebaseUserData);
            
            // Cargar o crear perfil desde localStorage
            loadUserProfile(firebaseUserData);
          } else {
            // No hay usuario de Firebase, usar localStorage como fallback
            loadUserFromStorage();
          }
          
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        // Fallback a localStorage si Firebase falla
        loadUserFromStorage();
        setLoading(false);
      }
    };
    
    const loadUserProfile = (firebaseUser) => {
      try {
        const savedProfile = localStorage.getItem('lovenda_user_profile');
        
        if (savedProfile) {
          let profileObj = JSON.parse(savedProfile);
          
          // Sincronizar con datos de Firebase
          profileObj.id = firebaseUser.uid;
          if (!profileObj.email) profileObj.email = firebaseUser.email;
          
          // Si falta myWed360Email, generar uno
          if (!profileObj.myWed360Email && firebaseUser.email) {
            const loginPrefix = firebaseUser.email.split('@')[0].slice(0,4).toLowerCase();
            profileObj.myWed360Email = `${loginPrefix}@mywed360.com`;
            localStorage.setItem('lovenda_user_profile', JSON.stringify(profileObj));
          }
          
          setUserProfile(profileObj);
        } else {
          // Crear perfil por defecto
          const defaultProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuario MyWed360',
            email: firebaseUser.email || 'usuario@mywed360.com',
            myWed360Email: `${firebaseUser.uid.slice(0,4)}@mywed360.com`,
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
      } catch (error) {
        console.error('Error cargando perfil de Firebase:', error);
      }
    };
    
    const loadUserFromStorage = () => {
      try {
        // Obtener datos de usuario de localStorage (fallback)
        const savedUser = localStorage.getItem('lovenda_user');
        const savedProfile = localStorage.getItem('lovenda_user_profile');
        
        if (savedUser) {
          const savedUserObj = JSON.parse(savedUser);
          setCurrentUser(savedUserObj);
          
          if (savedProfile) {
            let profileObj = JSON.parse(savedProfile);
            
            // Si falta myWed360Email, sincronizar
            if (!profileObj.myWed360Email && savedUserObj.email) {
              const loginPrefix = savedUserObj.email.split('@')[0].slice(0,4).toLowerCase();
              profileObj.myWed360Email = `${loginPrefix}@mywed360.com`;
              localStorage.setItem('lovenda_user_profile', JSON.stringify(profileObj));
            }
            
            setUserProfile(profileObj);
          } else {
            // Perfil por defecto si no existe
            const defaultProfile = {
              id: savedUserObj.uid || 'user123',
              name: 'Usuario Lovenda',
              email: savedUserObj.email || 'usuario@lovenda.app',
              myWed360Email: `${(savedUserObj.email || 'user').split('@')[0].slice(0,4)}@mywed360.com`,
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
    
    // Inicializar autenticación
    initializeAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
