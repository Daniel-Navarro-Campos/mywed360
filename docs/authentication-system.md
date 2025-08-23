# Sistema de Autenticación Optimizado - MyWed360

## 📋 Resumen de Mejoras

Este documento detalla las optimizaciones implementadas en el sistema de autenticación de MyWed360, incluyendo refresh tokens automáticos, gestión avanzada de sesiones, middleware de backend y manejo mejorado de errores.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **authService.js** - Servicio core de autenticación
2. **useAuthUnified.jsx** - Hook unificado de React
3. **authMiddleware.js** - Middleware de backend
4. **SessionManager.jsx** - Gestión de sesiones en frontend
5. **AuthMigrationWrapper.jsx** - Wrapper de migración

## 🔧 Funcionalidades Implementadas

### 1. Gestión Automática de Tokens

**Archivo:** `src/services/authService.js`

**Características:**
- Refresh automático de tokens cada 50 minutos
- Detección de tokens expirados
- Manejo de errores de red y Firebase
- Persistencia configurable (local/session)

**Configuración:**
```javascript
const AUTH_CONFIG = {
  TOKEN_REFRESH_INTERVAL: 50 * 60 * 1000, // 50 minutos
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,  // 5 minutos
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};
```

### 2. Hook de Autenticación Unificado

**Archivo:** `src/hooks/useAuthUnified.jsx`

**Funcionalidades:**
- Estado unificado de autenticación
- Manejo de errores tipados
- Verificación de roles y permisos
- Compatibilidad con código existente

**Uso básico:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';

const MyComponent = () => {
  const { 
    currentUser, 
    isAuthenticated, 
    login, 
    logout, 
    hasRole 
  } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <Dashboard />;
};
```

**Verificación de roles:**
```jsx
const { hasRole, hasPermission } = useAuth();

// Verificar rol específico
if (hasRole('admin')) {
  // Mostrar panel de administración
}

// Verificar permiso específico
if (hasPermission('manage_weddings')) {
  // Mostrar gestión de bodas
}
```

### 3. Middleware de Backend

**Archivo:** `backend/middleware/authMiddleware.js`

**Características:**
- Verificación de tokens Firebase
- Control de acceso basado en roles
- Gestión de permisos granulares
- Actualización automática de actividad

**Uso en rutas:**
```javascript
const { requireAuth, requireAdmin, requireMailAccess } = require('./middleware/authMiddleware');

// Ruta que requiere autenticación
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ user: req.user, profile: req.userProfile });
});

// Ruta solo para administradores
app.get('/api/admin/users', requireAdmin, (req, res) => {
  // Lógica de administración
});

// Ruta con permisos específicos
app.get('/api/mail', requireMailAccess, (req, res) => {
  // Acceso al sistema de correo
});
```

### 4. Gestión de Sesiones Avanzada

**Archivo:** `src/components/auth/SessionManager.jsx`

**Características:**
- Monitoreo de actividad del usuario
- Advertencias de sesión próxima a expirar
- Modal de reautenticación automática
- Indicador de estado de conexión
- Manejo de sesiones offline

**Funcionalidades:**
- **Monitoreo de actividad:** Detecta interacciones del usuario
- **Advertencias tempranas:** Notifica 5 minutos antes de expirar
- **Reautenticación:** Modal automático para renovar credenciales
- **Estado de conexión:** Indicador visual de conectividad

### 5. Sistema de Errores Tipados

**Clase AuthError:**
```javascript
class AuthError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.originalError = originalError;
  }
}
```

**Códigos de error estándar:**
- `token-expired`: Token expirado
- `session-expired`: Sesión expirada por inactividad
- `invalid-token`: Token inválido o malformado
- `insufficient-role`: Rol insuficiente
- `insufficient-permissions`: Permisos insuficientes
- `network-error`: Error de conectividad

## 🔐 Jerarquía de Roles y Permisos

### Roles Disponibles

1. **admin** - Acceso completo al sistema
2. **planner** - Gestión de bodas y clientes
3. **particular** - Gestión de boda propia

### Matriz de Permisos

| Permiso | Admin | Planner | Particular |
|---------|-------|---------|------------|
| `*` (todos) | ✅ | ❌ | ❌ |
| `manage_weddings` | ✅ | ✅ | ❌ |
| `view_analytics` | ✅ | ✅ | ❌ |
| `manage_tasks` | ✅ | ✅ | ❌ |
| `manage_guests` | ✅ | ✅ | ❌ |
| `manage_vendors` | ✅ | ✅ | ❌ |
| `access_mail_api` | ✅ | ✅ | ✅ |
| `manage_own_wedding` | ✅ | ✅ | ✅ |
| `manage_own_tasks` | ✅ | ✅ | ✅ |
| `manage_own_guests` | ✅ | ✅ | ✅ |
| `view_own_analytics` | ✅ | ✅ | ✅ |

## 🚀 Migración del Código Existente

### Paso 1: Envolver la Aplicación

```jsx
// En src/App.jsx o src/main.jsx
import AuthMigrationWrapper from './components/auth/AuthMigrationWrapper';

function App() {
  return (
    <AuthMigrationWrapper>
      {/* Tu aplicación existente */}
    </AuthMigrationWrapper>
  );
}
```

### Paso 2: Actualizar Imports

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';
import { useAuth } from '../hooks/useAuth';
```

**Después:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';
```

### Paso 3: Actualizar Uso de Hooks

**Antes:**
```jsx
const { user, isAuthenticated, login, logout } = useUserContext();
```

**Después:**
```jsx
const { currentUser, isAuthenticated, login, logout } = useAuth();
```

### Paso 4: Aplicar Middleware en Backend

```javascript
// En backend/index.js o routes
const { requireAuth } = require('./middleware/authMiddleware');

// Aplicar a rutas protegidas
app.use('/api/protected', requireAuth);
```

## 📊 Métricas y Monitoreo

### Eventos de Autenticación Monitoreados

- **Login exitoso/fallido**
- **Logout manual/automático**
- **Refresh de token exitoso/fallido**
- **Reautenticación requerida**
- **Sesión expirada por inactividad**
- **Errores de permisos**

### Logs Estructurados

```javascript
// Ejemplo de log de autenticación
{
  "timestamp": "2025-01-24T00:56:22Z",
  "event": "login_success",
  "userId": "user123",
  "email": "user@example.com",
  "role": "particular",
  "sessionDuration": 3600000,
  "rememberMe": true
}
```

## 🔧 Configuración de Entorno

### Variables de Entorno Requeridas

**Frontend (.env):**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (.env):**
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

## 🧪 Testing

### Tests de Autenticación

```javascript
// Ejemplo de test con el nuevo sistema
import { renderWithAuth } from '../test-utils';
import { useAuth } from '../hooks/useAuthUnified';

test('should login user successfully', async () => {
  const { result } = renderWithAuth(() => useAuth());
  
  await act(async () => {
    const loginResult = await result.current.login('test@example.com', 'password');
    expect(loginResult.success).toBe(true);
  });
  
  expect(result.current.isAuthenticated).toBe(true);
});
```

### Mocks para Testing

```javascript
// Mock del authService para tests
jest.mock('../services/authService', () => ({
  login: jest.fn().mockResolvedValue({ uid: 'test', email: 'test@example.com' }),
  logout: jest.fn().mockResolvedValue({}),
  getCurrentUser: jest.fn().mockReturnValue(null)
}));
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Token refresh falla constantemente**
   - Verificar configuración de Firebase
   - Comprobar conectividad de red
   - Revisar logs del navegador

2. **Middleware rechaza tokens válidos**
   - Verificar configuración de Firebase Admin
   - Comprobar variables de entorno del backend
   - Revisar formato del token en headers

3. **Sesiones se cierran inesperadamente**
   - Verificar configuración de persistencia
   - Comprobar actividad del usuario
   - Revisar configuración de timeouts

### Debugging

```javascript
// Habilitar logs detallados
localStorage.setItem('auth_debug', 'true');

// Ver estado actual de autenticación
console.log('Auth State:', authService.getCurrentUser());

// Verificar token manualmente
authService.refreshAuthToken(true).then(console.log);
```

## 📈 Próximas Mejoras

1. **Autenticación multifactor (MFA)**
2. **Single Sign-On (SSO)**
3. **Biometría en dispositivos móviles**
4. **Análisis de comportamiento de seguridad**
5. **Integración con proveedores OAuth**

---

**Última actualización:** Enero 2025  
**Versión:** 2.0.0  
**Autor:** Sistema de Autenticación MyWed360
