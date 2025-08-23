/**
 * Hook de autenticación unificado para MyWed360
 * Reemplaza y unifica UserContext.jsx y useAuth.jsx
 * Integra el servicio authService.js para funcionalidad avanzada
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { AuthError } from '../services/authService';

// Contexto de autenticación
const AuthContext = createContext({
  // Estado
  currentUser: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  // Acciones
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  reauthenticate: async () => {},
  sendPasswordReset: async () => {},
  clearError: () => {},
  
  // Utilidades
  hasRole: () => false,
  hasPermission: () => false,
  isEmailVerified: () => false
});

/**
 * Proveedor de autenticación unificado
 */
export const AuthProvider = ({ children }) => {
  // Estados principales
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados derivados
  const isAuthenticated = !!currentUser;
  const isEmailVerified = currentUser?.emailVerified || false;

  /**
   * Maneja errores de autenticación
   */
  const handleAuthError = useCallback((error) => {
    console.error('[useAuthUnified] Error:', error);
    
    if (error instanceof AuthError) {
      setError({
        code: error.code,
        message: error.message,
        type: 'auth'
      });
    } else {
      setError({
        code: 'unknown',
        message: error.message || 'Error desconocido',
        type: 'general'
      });
    }
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Actualiza los datos del usuario
   */
  const updateUserData = useCallback((userData) => {
    if (userData) {
      setCurrentUser(userData);
      setUserProfile({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: userData.role || 'particular',
        preferences: userData.preferences || {},
        emailVerified: userData.emailVerified,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      });
    } else {
      setCurrentUser(null);
      setUserProfile(null);
    }
    setIsLoading(false);
  }, []);

  /**
   * Iniciar sesión
   */
  const login = useCallback(async (email, password, rememberMe = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.login(email, password, rememberMe);
      updateUserData(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData, handleAuthError]);

  /**
   * Registrar nuevo usuario
   */
  const register = useCallback(async (email, password, additionalData = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.register(email, password, additionalData);
      updateUserData(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData, handleAuthError]);

  /**
   * Cerrar sesión
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      updateUserData(null);
      
      return { success: true };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [updateUserData, handleAuthError]);

  /**
   * Actualizar perfil del usuario
   */
  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null);
      
      const updatedUser = await authService.updateUserProfile(updates);
      updateUserData(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    }
  }, [updateUserData, handleAuthError]);

  /**
   * Reautenticar usuario
   */
  const reauthenticate = useCallback(async (password) => {
    try {
      setError(null);
      
      await authService.reauthenticate(password);
      
      return { success: true };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    }
  }, [handleAuthError]);

  /**
   * Enviar email de restablecimiento de contraseña
   */
  const sendPasswordReset = useCallback(async (email) => {
    try {
      setError(null);
      
      await authService.sendPasswordReset(email);
      
      return { success: true };
    } catch (error) {
      handleAuthError(error);
      return { success: false, error };
    }
  }, [handleAuthError]);

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = useCallback((role) => {
    if (!userProfile) return false;
    
    const userRole = userProfile.role?.toLowerCase();
    const targetRole = role.toLowerCase();
    
    // Mapeo de roles para compatibilidad
    const roleHierarchy = {
      'admin': ['admin', 'planner', 'particular'],
      'planner': ['planner', 'particular'],
      'particular': ['particular']
    };
    
    return roleHierarchy[userRole]?.includes(targetRole) || false;
  }, [userProfile]);

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permission) => {
    if (!userProfile) return false;
    
    const role = userProfile.role?.toLowerCase();
    
    // Definir permisos por rol
    const permissions = {
      'admin': ['*'], // Todos los permisos
      'planner': [
        'manage_weddings',
        'view_analytics',
        'manage_tasks',
        'manage_guests',
        'manage_vendors'
      ],
      'particular': [
        'manage_own_wedding',
        'manage_own_tasks',
        'manage_own_guests',
        'view_own_analytics'
      ]
    };
    
    const userPermissions = permissions[role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [userProfile]);

  /**
   * Efecto para suscribirse a cambios de autenticación
   */
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((userData) => {
      updateUserData(userData);
    });

    return unsubscribe;
  }, [updateUserData]);

  /**
   * Efecto para manejar compatibilidad con tests E2E
   */
  useEffect(() => {
    // Soporte para Cypress y tests E2E
    const testEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true' && testEmail && !currentUser) {
      const mockUser = {
        uid: 'cypress-test',
        email: testEmail,
        displayName: testEmail.split('@')[0],
        role: 'particular',
        emailVerified: true,
        preferences: {}
      };
      
      updateUserData(mockUser);
    }
  }, [currentUser, updateUserData]);

  // Valor del contexto
  const contextValue = {
    // Estado
    currentUser,
    userProfile,
    isAuthenticated,
    isLoading,
    error,
    
    // Acciones
    login,
    register,
    logout,
    updateProfile,
    reauthenticate,
    sendPasswordReset,
    clearError,
    
    // Utilidades
    hasRole,
    hasPermission,
    isEmailVerified: () => isEmailVerified,
    
    // Compatibilidad con código existente
    user: currentUser,
    loading: isLoading,
    role: userProfile?.role || null
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

/**
 * HOC para proteger rutas que requieren autenticación
 */
export const withAuth = (Component, options = {}) => {
  const { 
    requireAuth = true, 
    requireRole = null, 
    requirePermission = null,
    redirectTo = '/login' 
  } = options;

  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasRole, hasPermission, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (isLoading) return;

      if (requireAuth && !isAuthenticated) {
        navigate(redirectTo);
        return;
      }

      if (requireRole && !hasRole(requireRole)) {
        navigate('/unauthorized');
        return;
      }

      if (requirePermission && !hasPermission(requirePermission)) {
        navigate('/unauthorized');
        return;
      }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    if (requireAuth && !isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Hook para obtener información del usuario actual
 */
export const useCurrentUser = () => {
  const { currentUser, userProfile, isAuthenticated } = useAuth();
  
  return {
    user: currentUser,
    profile: userProfile,
    isAuthenticated,
    // Propiedades de acceso rápido
    uid: currentUser?.uid,
    email: currentUser?.email,
    displayName: userProfile?.displayName,
    role: userProfile?.role,
    preferences: userProfile?.preferences || {}
  };
};

/**
 * Hook para manejar errores de autenticación
 */
export const useAuthError = () => {
  const { error, clearError } = useAuth();
  
  const getErrorMessage = useCallback((errorCode) => {
    const errorMessages = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/email-already-in-use': 'El email ya está en uso',
      'auth/weak-password': 'La contraseña es muy débil',
      'token-refresh-failed': 'Error al refrescar la sesión',
      'session-expired': 'Sesión expirada',
      'profile-update-failed': 'Error al actualizar el perfil'
    };
    
    return errorMessages[errorCode] || 'Error desconocido';
  }, []);
  
  return {
    error,
    clearError,
    getErrorMessage,
    hasError: !!error
  };
};

// Exportaciones para compatibilidad
export default useAuth;
export { AuthContext };
