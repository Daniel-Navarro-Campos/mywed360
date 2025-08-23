/**
 * Servicio avanzado de autenticación con refresh tokens y gestión de sesiones
 * Maneja automáticamente la renovación de tokens y sesiones expiradas
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Configuración del servicio
const AUTH_CONFIG = {
  TOKEN_REFRESH_INTERVAL: 50 * 60 * 1000, // 50 minutos (Firebase tokens duran 1 hora)
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,  // 5 minutos
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  STORAGE_KEYS: {
    USER: 'lovenda_user_session',
    PREFERENCES: 'lovenda_user_preferences',
    LAST_ACTIVITY: 'lovenda_last_activity',
    LOGIN_EMAIL: 'lovenda_login_email'
  }
};

// Estado global del servicio
let tokenRefreshTimer = null;
let sessionCheckTimer = null;
let authStateListeners = [];
let currentUserData = null;

/**
 * Clase para manejar errores de autenticación
 */
class AuthError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Obtiene el perfil completo del usuario desde Firestore
 * @param {string} uid - ID del usuario
 * @returns {Promise<Object>} - Datos del usuario
 */
const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo perfil de usuario:', error);
    return null;
  }
};

/**
 * Crea o actualiza el perfil del usuario en Firestore
 * @param {Object} user - Usuario de Firebase Auth
 * @param {Object} additionalData - Datos adicionales
 * @returns {Promise<Object>} - Perfil actualizado
 */
const createOrUpdateUserProfile = async (user, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingProfile = await getUserProfile(user.uid);
    
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
      photoURL: user.photoURL || null,
      emailVerified: user.emailVerified,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...additionalData
    };

    // Si es un usuario nuevo, añadir datos de creación
    if (!existingProfile) {
      profileData.createdAt = serverTimestamp();
      profileData.role = additionalData.role || 'particular';
      profileData.preferences = {
        theme: 'light',
        language: 'es',
        emailNotifications: true,
        pushNotifications: true
      };
    } else {
      // Mantener datos existentes importantes
      profileData.role = existingProfile.role || 'particular';
      profileData.createdAt = existingProfile.createdAt;
      profileData.preferences = { ...existingProfile.preferences, ...additionalData.preferences };
    }

    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    console.error('Error creando/actualizando perfil:', error);
    throw new AuthError('profile-update-failed', 'Error al actualizar el perfil del usuario', error);
  }
};

/**
 * Actualiza la actividad del usuario
 */
const updateUserActivity = () => {
  const now = Date.now();
  localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY, now.toString());
  
  // Actualizar en Firestore si hay usuario autenticado
  if (auth.currentUser) {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    updateDoc(userRef, { 
      lastActivity: serverTimestamp() 
    }).catch(error => {
      console.warn('Error actualizando actividad:', error);
    });
  }
};

/**
 * Verifica si la sesión ha expirado por inactividad
 * @returns {boolean} - True si la sesión ha expirado
 */
const isSessionExpired = () => {
  const lastActivity = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
  if (!lastActivity) return false;
  
  const now = Date.now();
  const timeSinceLastActivity = now - parseInt(lastActivity);
  const maxInactivity = 24 * 60 * 60 * 1000; // 24 horas
  
  return timeSinceLastActivity > maxInactivity;
};

/**
 * Refresca el token de autenticación
 * @param {boolean} forceRefresh - Forzar refresh del token
 * @returns {Promise<string>} - Nuevo token
 */
const refreshAuthToken = async (forceRefresh = false) => {
  try {
    if (!auth.currentUser) {
      throw new AuthError('no-user', 'No hay usuario autenticado');
    }

    const token = await getIdToken(auth.currentUser, forceRefresh);
    const tokenResult = await getIdTokenResult(auth.currentUser, forceRefresh);
    
    console.log('[AuthService] Token refrescado correctamente');
    
    // Programar siguiente refresh
    scheduleTokenRefresh();
    
    return {
      token,
      expirationTime: tokenResult.expirationTime,
      claims: tokenResult.claims
    };
  } catch (error) {
    console.error('[AuthService] Error refrescando token:', error);
    throw new AuthError('token-refresh-failed', 'Error al refrescar el token', error);
  }
};

/**
 * Programa el refresh automático del token
 */
const scheduleTokenRefresh = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }
  
  tokenRefreshTimer = setTimeout(() => {
    refreshAuthToken(true).catch(error => {
      console.error('[AuthService] Error en refresh automático:', error);
      // Si falla el refresh, cerrar sesión
      signOut(auth);
    });
  }, AUTH_CONFIG.TOKEN_REFRESH_INTERVAL);
};

/**
 * Inicia el monitoreo de sesión
 */
const startSessionMonitoring = () => {
  // Monitorear actividad del usuario
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  const throttledUpdateActivity = throttle(updateUserActivity, 30000); // Máximo cada 30 segundos
  
  events.forEach(event => {
    document.addEventListener(event, throttledUpdateActivity, true);
  });

  // Verificar sesión periódicamente
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
  }
  
  sessionCheckTimer = setInterval(() => {
    if (isSessionExpired()) {
      console.log('[AuthService] Sesión expirada por inactividad');
      signOut(auth);
    }
  }, AUTH_CONFIG.SESSION_CHECK_INTERVAL);
};

/**
 * Detiene el monitoreo de sesión
 */
const stopSessionMonitoring = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
  
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = null;
  }
};

/**
 * Función throttle para limitar frecuencia de ejecución
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Iniciar sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {boolean} rememberMe - Recordar sesión
 * @returns {Promise<Object>} - Datos del usuario
 */
export const login = async (email, password, rememberMe = true) => {
  try {
    // Configurar persistencia
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);

    // Autenticar usuario
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Obtener/crear perfil completo
    const profile = await createOrUpdateUserProfile(user);
    
    // Guardar email si se solicita recordar
    if (rememberMe) {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_EMAIL, email);
    } else {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.LOGIN_EMAIL);
    }

    // Iniciar monitoreo de sesión
    startSessionMonitoring();
    scheduleTokenRefresh();
    updateUserActivity();

    const userData = { ...user, ...profile };
    currentUserData = userData;

    console.log('[AuthService] Login exitoso:', user.email);
    return userData;
  } catch (error) {
    console.error('[AuthService] Error en login:', error);
    
    let errorMessage = 'Error al iniciar sesión';
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Usuario deshabilitado';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta más tarde';
        break;
    }
    
    throw new AuthError(error.code, errorMessage, error);
  }
};

/**
 * Registrar nuevo usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {Object} additionalData - Datos adicionales del perfil
 * @returns {Promise<Object>} - Datos del usuario creado
 */
export const register = async (email, password, additionalData = {}) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar perfil de Firebase Auth si se proporciona displayName
    if (additionalData.displayName) {
      await updateProfile(user, { displayName: additionalData.displayName });
    }

    // Crear perfil en Firestore
    const profile = await createOrUpdateUserProfile(user, additionalData);

    // Enviar email de verificación
    await sendEmailVerification(user);

    console.log('[AuthService] Registro exitoso:', user.email);
    return { ...user, ...profile };
  } catch (error) {
    console.error('[AuthService] Error en registro:', error);
    
    let errorMessage = 'Error al crear la cuenta';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El email ya está en uso';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil';
        break;
    }
    
    throw new AuthError(error.code, errorMessage, error);
  }
};

/**
 * Cerrar sesión
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    stopSessionMonitoring();
    
    // Limpiar datos locales
    Object.values(AUTH_CONFIG.STORAGE_KEYS).forEach(key => {
      if (key !== AUTH_CONFIG.STORAGE_KEYS.LOGIN_EMAIL) {
        localStorage.removeItem(key);
      }
    });

    currentUserData = null;
    await signOut(auth);
    
    console.log('[AuthService] Logout exitoso');
  } catch (error) {
    console.error('[AuthService] Error en logout:', error);
    throw new AuthError('logout-failed', 'Error al cerrar sesión', error);
  }
};

/**
 * Obtener usuario actual con datos completos
 * @returns {Object|null} - Datos del usuario actual
 */
export const getCurrentUser = () => {
  return currentUserData;
};

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} - True si está autenticado
 */
export const isAuthenticated = () => {
  return !!auth.currentUser && !!currentUserData;
};

/**
 * Suscribirse a cambios de estado de autenticación
 * @param {Function} callback - Función callback
 * @returns {Function} - Función para desuscribirse
 */
export const onAuthStateChange = (callback) => {
  authStateListeners.push(callback);
  
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Verificar si la sesión ha expirado
        if (isSessionExpired()) {
          await signOut(auth);
          return;
        }

        // Obtener perfil completo
        const profile = await getUserProfile(user.uid);
        const userData = { ...user, ...profile };
        currentUserData = userData;
        
        // Iniciar monitoreo si no está activo
        if (!tokenRefreshTimer) {
          startSessionMonitoring();
          scheduleTokenRefresh();
        }
        
        updateUserActivity();
        callback(userData);
      } catch (error) {
        console.error('[AuthService] Error procesando cambio de estado:', error);
        callback(null);
      }
    } else {
      stopSessionMonitoring();
      currentUserData = null;
      callback(null);
    }
  });

  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
    unsubscribe();
  };
};

/**
 * Reautenticar usuario con credenciales
 * @param {string} password - Contraseña actual
 * @returns {Promise<void>}
 */
export const reauthenticate = async (password) => {
  try {
    if (!auth.currentUser) {
      throw new AuthError('no-user', 'No hay usuario autenticado');
    }

    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    console.log('[AuthService] Reautenticación exitosa');
  } catch (error) {
    console.error('[AuthService] Error en reautenticación:', error);
    throw new AuthError('reauthentication-failed', 'Error al reautenticar', error);
  }
};

/**
 * Enviar email de restablecimiento de contraseña
 * @param {string} email - Email del usuario
 * @returns {Promise<void>}
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('[AuthService] Email de restablecimiento enviado');
  } catch (error) {
    console.error('[AuthService] Error enviando email de restablecimiento:', error);
    throw new AuthError('password-reset-failed', 'Error al enviar email de restablecimiento', error);
  }
};

/**
 * Actualizar perfil del usuario
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} - Perfil actualizado
 */
export const updateUserProfile = async (updates) => {
  try {
    if (!auth.currentUser) {
      throw new AuthError('no-user', 'No hay usuario autenticado');
    }

    // Actualizar en Firebase Auth si es necesario
    if (updates.displayName || updates.photoURL) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL
      });
    }

    // Actualizar en Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Actualizar datos locales
    const updatedProfile = await getUserProfile(auth.currentUser.uid);
    currentUserData = { ...auth.currentUser, ...updatedProfile };

    console.log('[AuthService] Perfil actualizado correctamente');
    return currentUserData;
  } catch (error) {
    console.error('[AuthService] Error actualizando perfil:', error);
    throw new AuthError('profile-update-failed', 'Error al actualizar el perfil', error);
  }
};

// Inicializar el servicio cuando se carga el módulo
if (typeof window !== 'undefined') {
  // Restaurar actividad si existe
  const lastActivity = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
  if (!lastActivity) {
    updateUserActivity();
  }
}

export default {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
  onAuthStateChange,
  reauthenticate,
  sendPasswordReset,
  updateUserProfile,
  refreshAuthToken,
  AuthError
};
