# Sistema de Roles Técnico - MyWed360

## 🎯 Definición de Roles

### **1. Owner (Pareja)**
**Descripción**: Usuario principal propietario de la boda
**Código de rol**: `owner`
**Permisos**: Acceso completo a su boda únicamente

#### **Permisos Específicos:**
- ✅ **Crear/editar/eliminar** su boda
- ✅ **Gestión completa** de invitados, presupuesto, proveedores
- ✅ **Invitar ayudantes** (solo en plan Plus)
- ✅ **Acceso a todas las funcionalidades** de su evento
- ❌ **NO puede** ver otras bodas
- ❌ **NO tiene** selector de bodas en la interfaz

#### **Restricciones Técnicas:**
```javascript
// Firestore Security Rules
match /weddings/{weddingId} {
  allow read, write: if request.auth != null 
    && resource.data.ownerId == request.auth.uid;
}
```

#### **Componentes UI Específicos:**
- Dashboard principal sin selector de bodas
- Acceso directo a `activeWedding` desde contexto
- Botón "Invitar Ayudante" (solo plan Plus)

---

### **2. Wedding Planner**
**Descripción**: Profesional que gestiona múltiples bodas
**Código de rol**: `wedding_planner`
**Permisos**: Acceso casi completo a bodas asignadas

#### **Permisos Específicos:**
- ✅ **Crear bodas** para sus clientes
- ✅ **Gestión completa** de bodas asignadas
- ✅ **Selector de bodas** visible en interfaz
- ✅ **Lista de proveedores de confianza** personal
- ✅ **Priorización** en sistema (planes WP)
- ❌ **NO puede** eliminar bodas (solo archivar)
- ❌ **NO puede** cambiar ownership de bodas

#### **Restricciones Técnicas:**
```javascript
// Firestore Security Rules
match /weddings/{weddingId} {
  allow read, write: if request.auth != null 
    && (resource.data.ownerId == request.auth.uid
        || resource.data.plannerId == request.auth.uid);
}

// Límites por plan
const planLimits = {
  'wedding_planner_1': { maxWeddings: 5 },
  'wedding_planner_2': { maxWeddings: 10 },
  'teams': { maxWeddings: 40 },
  'teams_unlimited': { maxWeddings: -1 }
};
```

#### **Componentes UI Específicos:**
- `WeddingSelector.jsx` - Dropdown de selección de bodas
- `PlannerDashboard.jsx` - Dashboard con métricas múltiples bodas
- `TrustedProviders.jsx` - Lista personal de proveedores
- Indicador de plan activo y límites

---

### **3. Ayudante (Assistant)**
**Descripción**: Usuario con acceso limitado a una boda específica
**Código de rol**: `assistant`
**Permisos**: Acceso completo pero limitado a una boda

#### **Permisos Específicos:**
- ✅ **Acceso completo** a la boda asignada
- ✅ **Todas las funcionalidades** excepto configuración crítica
- ❌ **NO puede** invitar otros ayudantes
- ❌ **NO puede** cambiar configuración de facturación
- ❌ **NO puede** eliminar la boda
- ❌ **NO tiene** selector de bodas

#### **Restricciones Técnicas:**
```javascript
// Firestore Security Rules
match /weddings/{weddingId} {
  allow read, write: if request.auth != null 
    && (resource.data.ownerId == request.auth.uid
        || resource.data.plannerId == request.auth.uid
        || request.auth.uid in resource.data.assistants);
}

// Restricciones específicas para ayudantes
match /weddings/{weddingId}/settings {
  allow write: if request.auth != null 
    && (resource.data.ownerId == request.auth.uid
        || resource.data.plannerId == request.auth.uid)
    && !(request.auth.uid in resource.data.assistants);
}
```

#### **Componentes UI Específicos:**
- Dashboard igual que owner pero sin configuración crítica
- Sin acceso a `BillingSettings.jsx`
- Sin botón "Invitar Ayudante"

---

## 🔧 Implementación Técnica

### **Estructura de Datos en Firestore**

#### **Colección `users`:**
```javascript
{
  uid: "user123",
  email: "user@example.com",
  role: "owner" | "wedding_planner" | "assistant",
  profile: {
    name: "Juan Pérez",
    phone: "+34600000000",
    plan: "plus" | "wedding_planner_1" | "teams",
    planExpiry: timestamp
  },
  trustedProviders: [] // Solo para wedding_planner
}
```

#### **Colección `weddings`:**
```javascript
{
  id: "wedding123",
  ownerId: "user123",
  plannerId: "planner456", // Opcional
  assistants: ["assistant789"], // Array de UIDs
  title: "Boda Juan & María",
  date: timestamp,
  status: "active" | "completed" | "archived",
  permissions: {
    canInviteAssistants: boolean,
    maxAssistants: number
  }
}
```

### **Context de Autenticación**

#### **AuthContext.jsx - Actualizado:**
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos adicionales del usuario
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser(firebaseUser);
        setUserRole(userData?.role || 'owner');
        setUserPlan(userData?.profile?.plan || 'free');
      } else {
        setUser(null);
        setUserRole(null);
        setUserPlan(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      userPlan,
      loading,
      isOwner: userRole === 'owner',
      isPlanner: userRole === 'wedding_planner',
      isAssistant: userRole === 'assistant'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### **WeddingContext.jsx - Actualizado:**
```javascript
const WeddingContext = createContext();

export const WeddingProvider = ({ children }) => {
  const { user, userRole } = useAuth();
  const [activeWedding, setActiveWedding] = useState(null);
  const [availableWeddings, setAvailableWeddings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let weddingsQuery;
    
    // Consulta según el rol
    if (userRole === 'wedding_planner') {
      // Wedding planner ve bodas donde es planner
      weddingsQuery = query(
        collection(db, 'weddings'),
        where('plannerId', '==', user.uid)
      );
    } else if (userRole === 'assistant') {
      // Ayudante ve bodas donde está en el array de assistants
      weddingsQuery = query(
        collection(db, 'weddings'),
        where('assistants', 'array-contains', user.uid)
      );
    } else {
      // Owner ve solo sus bodas
      weddingsQuery = query(
        collection(db, 'weddings'),
        where('ownerId', '==', user.uid)
      );
    }

    const unsubscribe = onSnapshot(weddingsQuery, (snapshot) => {
      const weddings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAvailableWeddings(weddings);
      
      // Para owners y assistants, auto-seleccionar la primera boda
      if (userRole !== 'wedding_planner' && weddings.length > 0) {
        setActiveWedding(weddings[0]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [user, userRole]);

  return (
    <WeddingContext.Provider value={{
      activeWedding,
      setActiveWedding,
      availableWeddings,
      loading,
      canSelectWedding: userRole === 'wedding_planner'
    }}>
      {children}
    </WeddingContext.Provider>
  );
};
```

### **Componente WeddingSelector.jsx:**
```javascript
import { useAuth } from '../context/AuthContext';
import { useWedding } from '../context/WeddingContext';

const WeddingSelector = () => {
  const { userRole } = useAuth();
  const { activeWedding, availableWeddings, setActiveWedding } = useWedding();

  // Solo mostrar para wedding planners
  if (userRole !== 'wedding_planner') {
    return null;
  }

  return (
    <div className="wedding-selector">
      <select 
        value={activeWedding?.id || ''} 
        onChange={(e) => {
          const selected = availableWeddings.find(w => w.id === e.target.value);
          setActiveWedding(selected);
        }}
      >
        <option value="">Seleccionar boda...</option>
        {availableWeddings.map(wedding => (
          <option key={wedding.id} value={wedding.id}>
            {wedding.title} - {new Date(wedding.date.toDate()).toLocaleDateString()}
          </option>
        ))}
      </select>
    </div>
  );
};

export default WeddingSelector;
```

### **Hook usePermissions.jsx:**
```javascript
import { useAuth } from '../context/AuthContext';
import { useWedding } from '../context/WeddingContext';

export const usePermissions = () => {
  const { user, userRole, userPlan } = useAuth();
  const { activeWedding } = useWedding();

  const canInviteAssistants = () => {
    return userRole === 'owner' && userPlan === 'plus';
  };

  const canDeleteWedding = () => {
    return userRole === 'owner' || 
           (userRole === 'wedding_planner' && activeWedding?.plannerId === user?.uid);
  };

  const canEditBilling = () => {
    return userRole === 'owner';
  };

  const canManageProviders = () => {
    return userRole !== 'assistant';
  };

  const canAccessSettings = () => {
    return userRole !== 'assistant';
  };

  return {
    canInviteAssistants,
    canDeleteWedding,
    canEditBilling,
    canManageProviders,
    canAccessSettings
  };
};
```

---

## 🔒 Seguridad y Validación

### **Firestore Security Rules Completas:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bodas - acceso basado en roles
    match /weddings/{weddingId} {
      allow read, write: if request.auth != null && (
        // Owner puede acceder a sus bodas
        resource.data.ownerId == request.auth.uid ||
        // Wedding planner puede acceder a bodas asignadas
        resource.data.plannerId == request.auth.uid ||
        // Ayudante puede acceder si está en la lista
        request.auth.uid in resource.data.assistants
      );
      
      // Solo owner y planner pueden crear bodas
      allow create: if request.auth != null && (
        request.resource.data.ownerId == request.auth.uid ||
        request.resource.data.plannerId == request.auth.uid
      );
    }
    
    // Configuración crítica - solo owner y planner
    match /weddings/{weddingId}/settings/{settingId} {
      allow read, write: if request.auth != null && (
        get(/databases/$(database)/documents/weddings/$(weddingId)).data.ownerId == request.auth.uid ||
        get(/databases/$(database)/documents/weddings/$(weddingId)).data.plannerId == request.auth.uid
      );
    }
    
    // Subcolecciones accesibles según permisos de boda padre
    match /weddings/{weddingId}/{subcollection=**} {
      allow read, write: if request.auth != null && (
        get(/databases/$(database)/documents/weddings/$(weddingId)).data.ownerId == request.auth.uid ||
        get(/databases/$(database)/documents/weddings/$(weddingId)).data.plannerId == request.auth.uid ||
        request.auth.uid in get(/databases/$(database)/documents/weddings/$(weddingId)).data.assistants
      );
    }
  }
}
```

---

## 🧪 Testing del Sistema de Roles

### **Tests Unitarios:**
```javascript
// __tests__/roles.test.js
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../hooks/usePermissions';

describe('Sistema de Roles', () => {
  test('Owner puede invitar ayudantes solo con plan Plus', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <AuthProvider value={{ userRole: 'owner', userPlan: 'plus' }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(result.current.canInviteAssistants()).toBe(true);
  });
  
  test('Wedding planner no puede editar facturación', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <AuthProvider value={{ userRole: 'wedding_planner' }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(result.current.canEditBilling()).toBe(false);
  });
  
  test('Ayudante no puede acceder a configuración', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <AuthProvider value={{ userRole: 'assistant' }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(result.current.canAccessSettings()).toBe(false);
  });
});
```

---

## 📱 Interfaz de Usuario por Rol

### **Owner (Pareja):**
- Dashboard principal sin selector
- Acceso completo a su boda
- Botón "Invitar Ayudante" (plan Plus)
- Configuración de facturación

### **Wedding Planner:**
- Selector de bodas en header
- Dashboard con métricas múltiples
- Lista de proveedores de confianza
- Sin acceso a facturación de clientes

### **Ayudante:**
- Dashboard igual que owner
- Sin configuración crítica
- Sin gestión de facturación
- Acceso de solo lectura a algunos módulos

---

## 🔄 Flujo de Invitación de Ayudantes

### **Proceso Técnico:**
1. **Owner con plan Plus** hace clic en "Invitar Ayudante"
2. **Modal de invitación** solicita email del ayudante
3. **Validación** de límites de plan y permisos
4. **Envío de invitación** por email con token único
5. **Registro/Login** del ayudante con token
6. **Asignación automática** del rol y acceso a la boda
7. **Actualización** del array `assistants` en Firestore

### **Componente InviteAssistant.jsx:**
```javascript
const InviteAssistant = () => {
  const { userRole, userPlan } = useAuth();
  const { activeWedding } = useWedding();
  const { canInviteAssistants } = usePermissions();

  if (!canInviteAssistants()) {
    return null;
  }

  const handleInvite = async (email) => {
    try {
      // Crear invitación en Firestore
      await addDoc(collection(db, 'invitations'), {
        weddingId: activeWedding.id,
        inviterUid: user.uid,
        inviteeEmail: email,
        role: 'assistant',
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      });

      // Enviar email de invitación
      await sendInvitationEmail(email, activeWedding, user);
      
      toast.success('Invitación enviada correctamente');
    } catch (error) {
      toast.error('Error al enviar invitación');
    }
  };

  return (
    <InvitationModal onInvite={handleInvite} />
  );
};
```

Este sistema de roles técnico garantiza la seguridad, escalabilidad y usabilidad del sistema MyWed360 según los diferentes tipos de usuarios y sus necesidades específicas.
