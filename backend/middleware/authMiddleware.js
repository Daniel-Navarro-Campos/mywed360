/**
 * Middleware de autenticación para el backend de MyWed360
 * Verifica tokens de Firebase Auth y gestiona permisos
 */

import admin from 'firebase-admin';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  try {
    // En producción, usar las credenciales del entorno
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      let serviceAccountObj;
      try {
        serviceAccountObj = JSON.parse(rawKey);
      } catch (jsonErr) {
        try {
          const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
          serviceAccountObj = JSON.parse(decoded);
        } catch (b64Err) {
          serviceAccountObj = null;
        }
      }
      if (serviceAccountObj) {
        if (!admin.apps.length) admin.initializeApp({
          credential: admin.credential.cert(serviceAccountObj),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountObj.project_id || 'lovenda-98c77'
        });
      } else {
        // Fallback a archivo
        const fs = await import('fs');
        const path = await import('path');
        const rootPath = path.resolve(process.cwd(), 'serviceAccount.json');
        const secretPath = '/etc/secrets/serviceAccount.json';
        const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const candidatePaths = [envPath, rootPath, secretPath].filter(Boolean);
        const svcPath = candidatePaths.find(p => fs.existsSync(p)) || null;
        if (svcPath) {
          const serviceAccountFile = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
          if (!admin.apps.length) admin.initializeApp({
            credential: admin.credential.cert(serviceAccountFile),
            projectId:
              process.env.FIREBASE_PROJECT_ID || serviceAccountFile.project_id || 'lovenda-98c77'
          });
          console.log(`[AuthMiddleware] Firebase Admin inicializado con serviceAccount.json (${svcPath})`);
        } else {
          if (!admin.apps.length) admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
          });
        }
      }
    } else {
      // Buscar archivo serviceAccount.json en raíz del proyecto como fallback
      try {
        const fs = await import('fs');
        const path = await import('path');
        const rootPath = path.resolve(process.cwd(), 'serviceAccount.json');
        const secretPath = '/etc/secrets/serviceAccount.json';
        const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        const candidatePaths = [envPath, rootPath, secretPath].filter(Boolean);
        const svcPath = candidatePaths.find(p => fs.existsSync(p)) || null;
        if (svcPath) {
          const serviceAccountFile = JSON.parse(fs.readFileSync(svcPath, 'utf8'));
          if (!admin.apps.length) admin.initializeApp({
            credential: admin.credential.cert(serviceAccountFile),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccountFile.project_id || 'lovenda-98c77'
          });
          console.log(`[AuthMiddleware] Firebase Admin inicializado con serviceAccount.json (${svcPath})`);
        } else {
          // Último recurso: inicialización sin credenciales explícitas (usará ADC si existe)
          if (!admin.apps.length) admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
          });
        }
      } catch (fileErr) {
        console.error('[AuthMiddleware] Error leyendo serviceAccount.json:', fileErr);
        if (!admin.apps.length) admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'lovenda-98c77'
        });
      }
    }
    console.log('[AuthMiddleware] Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('[AuthMiddleware] Error inicializando Firebase Admin:', error);
  }
}

/**
 * Extrae el token del header Authorization
 * @param {Object} req - Request object
 * @returns {string|null} - Token extraído o null
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Formato esperado: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Verifica y decodifica el token de Firebase
 * @param {string} token - Token a verificar
 * @returns {Promise<Object>} - Datos del token decodificado
 */
const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      success: true,
      user: decodedToken
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error verificando token:', error);
    
    let errorCode = 'invalid-token';
    let errorMessage = 'Token inválido';
    
    switch (error.code) {
      case 'auth/id-token-expired':
        errorCode = 'token-expired';
        errorMessage = 'Token expirado';
        break;
      case 'auth/id-token-revoked':
        errorCode = 'token-revoked';
        errorMessage = 'Token revocado';
        break;
      case 'auth/invalid-id-token':
        errorCode = 'invalid-token';
        errorMessage = 'Token inválido';
        break;
      case 'auth/user-not-found':
        errorCode = 'user-not-found';
        errorMessage = 'Usuario no encontrado';
        break;
    }
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        originalError: error
      }
    };
  }
};

/**
 * Obtiene el perfil completo del usuario desde Firestore
 * @param {string} uid - ID del usuario
 * @returns {Promise<Object>} - Perfil del usuario
 */
const getUserProfile = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return {
        uid,
        role: 'particular',
        preferences: {}
      };
    }
    
    return {
      uid,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('[AuthMiddleware] Error obteniendo perfil:', error);
    return {
      uid,
      role: 'particular',
      preferences: {}
    };
  }
};

/**
 * Middleware principal de autenticación
 * @param {Object} options - Opciones del middleware
 * @returns {Function} - Función middleware
 */
const authMiddleware = (options = {}) => {
  const {
    required = true,
    roles = [],
    permissions = [],
    allowAnonymous = false
  } = options;

  return async (req, res, next) => {
    try {
      // Extraer token
      const token = extractToken(req);
      
      // Si no hay token y la autenticación es requerida
      if (!token && required) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'no-token',
            message: 'Token de autenticación requerido'
          }
        });
      }
      
      // Si no hay token pero se permite acceso anónimo
      if (!token && allowAnonymous) {
        req.user = null;
        req.userProfile = null;
        return next();
      }
      
      // Si hay token, verificarlo
      if (token) {
        const tokenResult = await verifyFirebaseToken(token);
        
        if (!tokenResult.success) {
          return res.status(401).json({
            success: false,
            error: tokenResult.error
          });
        }
        
        // Obtener perfil completo del usuario
        const userProfile = await getUserProfile(tokenResult.user.uid);
        
        // Añadir información del usuario al request
        req.user = tokenResult.user;
        req.userProfile = userProfile;
        
        // Verificar roles si se especifican
        if (roles.length > 0) {
          const userRole = userProfile.role?.toLowerCase() || 'particular';
          const hasRequiredRole = roles.some(role => {
            const targetRole = role.toLowerCase();
            
            // Jerarquía de roles
            const roleHierarchy = {
              'admin': ['admin', 'planner', 'particular'],
              'planner': ['planner', 'particular'],
              'particular': ['particular']
            };
            
            return roleHierarchy[userRole]?.includes(targetRole) || false;
          });
          
          if (!hasRequiredRole) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'insufficient-role',
                message: 'Rol insuficiente para acceder a este recurso',
                requiredRoles: roles,
                userRole: userRole
              }
            });
          }
        }
        
        // Verificar permisos si se especifican
        if (permissions.length > 0) {
          const userRole = userProfile.role?.toLowerCase() || 'particular';
          
          // Definir permisos por rol
          const rolePermissions = {
            'admin': ['*'], // Todos los permisos
            'planner': [
              'manage_weddings',
              'view_analytics',
              'manage_tasks',
              'manage_guests',
              'manage_vendors',
              'access_mail_api'
            ],
            'particular': [
              'manage_own_wedding',
              'manage_own_tasks',
              'manage_own_guests',
              'view_own_analytics',
              'access_mail_api'
            ]
          };
          
          const userPermissions = rolePermissions[userRole] || [];
          const hasAllPermissions = permissions.every(permission => 
            userPermissions.includes('*') || userPermissions.includes(permission)
          );
          
          if (!hasAllPermissions) {
            return res.status(403).json({
              success: false,
              error: {
                code: 'insufficient-permissions',
                message: 'Permisos insuficientes para acceder a este recurso',
                requiredPermissions: permissions,
                userPermissions: userPermissions.filter(p => p !== '*')
              }
            });
          }
        }
        
        // Actualizar última actividad
        try {
          await admin.firestore()
            .collection('users')
            .doc(tokenResult.user.uid)
            .update({
              lastActivity: admin.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
          // No es crítico si falla la actualización de actividad
          console.warn('[AuthMiddleware] Error actualizando actividad:', error);
        }
      }
      
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Error en middleware:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'middleware-error',
          message: 'Error interno del servidor'
        }
      });
    }
  };
};

/**
 * Middleware específico para rutas que requieren autenticación
 */
const requireAuth = authMiddleware({ required: true });

/**
 * Middleware específico para rutas de administrador
 */
const requireAdmin = authMiddleware({ 
  required: true, 
  roles: ['admin'] 
});

/**
 * Middleware específico para rutas de planner
 */
const requirePlanner = authMiddleware({ 
  required: true, 
  roles: ['admin', 'planner'] 
});

/**
 * Middleware para rutas de email que requieren permisos específicos
 */
const requireMailAccess = authMiddleware({
  required: true,
  permissions: ['access_mail_api']
});

/**
 * Middleware opcional (permite acceso anónimo)
 */
const optionalAuth = authMiddleware({ 
  required: false, 
  allowAnonymous: true 
});

/**
 * Middleware para verificar propiedad de recursos
 * Verifica que el usuario solo acceda a sus propios recursos
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'authentication-required',
          message: 'Autenticación requerida'
        }
      });
    }
    
    // Los administradores pueden acceder a cualquier recurso
    if (req.userProfile?.role === 'admin') {
      return next();
    }
    
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.uid;
    
    // Si el recurso pertenece al usuario o es el propio usuario
    if (resourceId === userId || req.body[userIdField] === userId) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'access-denied',
        message: 'No tienes permisos para acceder a este recurso'
      }
    });
  };
};

/**
 * Utilidad para crear respuestas de error estandarizadas
 */
const createAuthError = (code, message, statusCode = 401) => {
  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    }
  };
};

export {
  authMiddleware,
  requireAuth,
  requireAdmin,
  requirePlanner,
  requireMailAccess,
  optionalAuth,
  requireOwnership,
  createAuthError,
  extractToken,
  verifyFirebaseToken,
  getUserProfile
};

export default authMiddleware;
