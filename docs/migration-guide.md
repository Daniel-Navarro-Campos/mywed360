# Guía de Migración - Sistema de Autenticación Unificado

## 🚀 Migración Paso a Paso

Esta guía te ayudará a migrar del sistema de autenticación legacy (`useUserContext`) al nuevo sistema unificado (`useAuthUnified`).

### 📋 Checklist de Migración

- [x] ✅ AuthMigrationWrapper integrado en App.jsx
- [x] ✅ Middleware de backend aplicado
- [ ] 🔄 Migrar componentes principales
- [ ] 🔄 Actualizar páginas de usuario
- [ ] 🔄 Migrar hooks personalizados
- [ ] 🔄 Actualizar tests

### 🔧 Pasos de Migración por Componente

#### 1. **Actualizar Imports**

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';
```

**Después:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';
```

#### 2. **Cambiar Hook y Propiedades**

**Antes:**
```jsx
const { user, isAuthenticated, login, logout, role, loading } = useUserContext();
```

**Después:**
```jsx
const { 
  currentUser, 
  isAuthenticated, 
  login, 
  logout, 
  userProfile, 
  isLoading,
  hasRole,
  hasPermission 
} = useAuth();
```

#### 3. **Mapeo de Propiedades**

| Legacy (useUserContext) | Nuevo (useAuthUnified) | Descripción |
|------------------------|------------------------|-------------|
| `user` | `currentUser` | Objeto del usuario Firebase |
| `role` | `userProfile.role` | Rol del usuario |
| `loading` | `isLoading` | Estado de carga |
| `userName` | `userProfile.displayName` | Nombre del usuario |
| `weddingName` | `userProfile.weddingName` | Nombre de la boda |
| - | `sessionInfo` | **NUEVO:** Info de sesión |
| - | `hasRole(role)` | **NUEVO:** Verificar rol |
| - | `hasPermission(perm)` | **NUEVO:** Verificar permiso |
| - | `refreshToken()` | **NUEVO:** Refrescar token |

### 📝 Ejemplos de Migración

#### Ejemplo 1: Componente Login

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';

export default function Login() {
  const { login, isAuthenticated, loading } = useUserContext();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password, remember);
      navigate('/home');
    } catch (err) {
      setError('Usuario o contraseña inválidos');
    }
  };
  
  if (loading) return <div>Cargando...</div>;
  if (isAuthenticated) return <Navigate to="/home" />;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario */}
    </form>
  );
}
```

**Después:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password, remember);
      if (result.success) {
        navigate('/home');
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };
  
  if (isLoading) return <div>Cargando...</div>;
  if (isAuthenticated) return <Navigate to="/home" />;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario */}
    </form>
  );
}
```

#### Ejemplo 2: Componente con Roles

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';

export default function AdminPanel() {
  const { role, user } = useUserContext();
  
  if (role !== 'admin') {
    return <div>Acceso denegado</div>;
  }
  
  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Bienvenido, {user.email}</p>
    </div>
  );
}
```

**Después:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';

export default function AdminPanel() {
  const { hasRole, currentUser } = useAuth();
  
  if (!hasRole('admin')) {
    return <div>Acceso denegado</div>;
  }
  
  return (
    <div>
      <h1>Panel de Administración</h1>
      <p>Bienvenido, {currentUser.email}</p>
    </div>
  );
}
```

#### Ejemplo 3: Componente con Permisos

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';

export default function EmailManager() {
  const { role } = useUserContext();
  
  const canAccessEmail = role === 'admin' || role === 'planner';
  
  if (!canAccessEmail) {
    return <div>Sin permisos para acceder al correo</div>;
  }
  
  return <div>Gestor de correo</div>;
}
```

**Después:**
```jsx
import { useAuth } from '../hooks/useAuthUnified';

export default function EmailManager() {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('access_mail_api')) {
    return <div>Sin permisos para acceder al correo</div>;
  }
  
  return <div>Gestor de correo</div>;
}
```

### 🔄 Migración de Hooks Personalizados

#### Ejemplo: useCalendarSync

**Antes:**
```jsx
import { useUserContext } from '../context/UserContext';

export const useCalendarSync = () => {
  const { user } = useUserContext();
  
  const syncCalendar = async () => {
    if (!user) return;
    // Lógica de sincronización
  };
  
  return { syncCalendar };
};
```

**Después:**
```jsx
import { useAuth } from './useAuthUnified';

export const useCalendarSync = () => {
  const { currentUser, isAuthenticated } = useAuth();
  
  const syncCalendar = async () => {
    if (!isAuthenticated || !currentUser) return;
    // Lógica de sincronización
  };
  
  return { syncCalendar };
};
```

### 🧪 Migración de Tests

#### Ejemplo de Test

**Antes:**
```jsx
import { renderWithAuth } from '../test-utils';

// Mock del contexto legacy
jest.mock('../context/UserContext', () => ({
  useUserContext: () => ({
    user: { email: 'test@example.com' },
    isAuthenticated: true,
    role: 'admin'
  })
}));

test('should render admin panel', () => {
  render(<AdminPanel />);
  expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
});
```

**Después:**
```jsx
import { renderWithAuth } from '../test-utils';

// Mock del nuevo sistema
jest.mock('../hooks/useAuthUnified', () => ({
  useAuth: () => ({
    currentUser: { email: 'test@example.com' },
    isAuthenticated: true,
    userProfile: { role: 'admin' },
    hasRole: (role) => role === 'admin',
    hasPermission: () => true
  })
}));

test('should render admin panel', () => {
  render(<AdminPanel />);
  expect(screen.getByText('Panel de Administración')).toBeInTheDocument();
});
```

### 🚨 Problemas Comunes y Soluciones

#### 1. **Error: Cannot read property 'email' of undefined**

**Problema:** El componente intenta acceder a `user.email` antes de que el usuario esté cargado.

**Solución:**
```jsx
// Antes (problemático)
const { user } = useUserContext();
return <div>{user.email}</div>;

// Después (seguro)
const { currentUser } = useAuth();
return <div>{currentUser?.email || 'Cargando...'}</div>;
```

#### 2. **Error: hasRole is not a function**

**Problema:** Intentar usar `hasRole` con el sistema legacy.

**Solución:**
```jsx
// Asegúrate de importar el hook correcto
import { useAuth } from '../hooks/useAuthUnified'; // ✅ Correcto
// NO: import { useUserContext } from '../context/UserContext'; // ❌ Legacy
```

#### 3. **Roles no se detectan correctamente**

**Problema:** Los roles se almacenan de forma diferente.

**Solución:**
```jsx
// Verificar que el perfil del usuario esté cargado
const { userProfile, isLoading } = useAuth();

if (isLoading) return <div>Cargando...</div>;
if (!userProfile?.role) return <div>Sin rol asignado</div>;

// Ahora es seguro usar hasRole
```

### 📊 Estado de Migración por Archivo

#### Componentes Principales
- [ ] `src/components/MainLayout.jsx`
- [ ] `src/components/Nav.jsx`
- [ ] `src/components/HomePage.jsx`
- [ ] `src/components/RoleBadge.jsx`

#### Páginas
- [ ] `src/pages/Login.jsx`
- [ ] `src/pages/Signup.jsx`
- [ ] `src/pages/Perfil.jsx`
- [ ] `src/pages/Bodas.jsx`
- [ ] `src/pages/BodaDetalle.jsx`

#### Hooks
- [ ] `src/hooks/useCalendarSync.js`
- [ ] `src/hooks/useOnboarding.jsx`

#### Contextos
- [ ] `src/context/WeddingContext.jsx`

### 🎯 Beneficios Post-Migración

Una vez completada la migración, tendrás acceso a:

1. **Refresh automático de tokens** - Sin interrupciones de sesión
2. **Gestión avanzada de roles** - Control granular de permisos
3. **Monitoreo de sesión** - Detección de inactividad
4. **Mejor manejo de errores** - Códigos de error tipados
5. **Compatibilidad con backend** - Middleware de autenticación
6. **Indicadores visuales** - Estado de conexión y sesión

### 🔧 Herramientas de Desarrollo

Para facilitar la migración, puedes usar:

```jsx
// Componente de debug para comparar sistemas
import AuthMigrationExample from '../components/auth/AuthMigrationExample';

// Añadir temporalmente en desarrollo
{process.env.NODE_ENV === 'development' && <AuthMigrationExample />}
```

### 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa la documentación completa en `docs/authentication-system.md`
2. Usa el componente `AuthMigrationExample` para comparar sistemas
3. Verifica que las variables de entorno estén configuradas
4. Comprueba los logs del navegador para errores específicos

---

**Última actualización:** Enero 2025  
**Estado:** En progreso  
**Próximo paso:** Migrar componentes principales
