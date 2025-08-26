# 10. Flujo de Gestión de Bodas Múltiples (Detallado)

## 10.1 Sistema Multi-Wedding
**Objetivo:** Permitir a usuarios gestionar múltiples bodas desde una sola cuenta

### Creación de Múltiples Bodas
**Pasos detallados:**
- [ ] **Interfaz de selección de bodas**
  - Componente: `WeddingSelector.jsx`
  - Dashboard con lista de bodas activas
  - Botón "Nueva Boda" prominente
  - Vista previa de cada boda (fecha, estado, progreso)

- [ ] **Proceso de creación**
  - Formulario de nueva boda simplificado
  - Datos básicos: nombres, fecha, ubicación
  - Selección de plantilla inicial
  - Configuración de permisos iniciales

- [ ] **Gestión de contexto**
  - Hook: `useWedding()` con soporte multi-wedding
  - Estado global de boda activa
  - Cambio rápido entre bodas
  - Persistencia de última boda seleccionada

### Navegación Entre Bodas (Solo Wedding Planners)
**Pasos detallados:**
- [ ] **Selector de boda activa**
  - Dropdown en header principal (solo visible para wedding planners)
  - Indicador visual de boda actual
  - Búsqueda rápida por nombre o fecha
  - Accesos directos a bodas recientes

- [ ] **Contexto de navegación**
  - Mantenimiento de página actual al cambiar boda
  - Breadcrumbs con información de boda
  - URLs con identificador de boda
  - Estado de navegación independiente por boda

## 10.2 Roles y Permisos Multi-Wedding
**Objetivo:** Gestionar diferentes niveles de acceso por boda

### Sistema de Roles Específicos
**Pasos detallados:**
- [ ] **Tres roles únicos**
  - **Owner**: Parejas con acceso total a su propia boda
  - **Wedding Planner**: Acceso casi total a todas las bodas que organiza
  - **Ayudante**: Acceso similar a wedding planner pero solo a la boda específica asignada

- [ ] **Permisos por rol**
  - **Owner**: Acceso completo a su boda, no puede ver otras bodas
  - **Wedding Planner**: Gestión completa de múltiples bodas, selector de bodas activo
  - **Ayudante**: Permisos de gestión completa pero limitado a una boda específica

- [ ] **Restricciones de acceso**
  - Solo wedding planners pueden tener múltiples bodas
  - Solo wedding planners ven el selector de bodas
  - Owners y ayudantes trabajan en contexto de una sola boda

### Invitación de Colaboradores
**Pasos detallados:**
- [ ] **Proceso de invitación**
  - Componente: `InviteCollaborator.jsx`
  - Selección de rol y permisos específicos
  - Email de invitación personalizado
  - Fecha de expiración de invitación

- [ ] **Aceptación de invitaciones**
  - Componente: `AcceptInvitation.jsx` (ya implementado)
  - Verificación de identidad
  - Revisión de permisos otorgados
  - Configuración de notificaciones

- [ ] **Gestión de colaboradores**
  - Lista de colaboradores por boda
  - Modificación de permisos existentes
  - Revocación de accesos
  - Historial de actividad por colaborador

## 10.3 Listas de Proveedores de Confianza (Wedding Planners)
**Objetivo:** Permitir a wedding planners mantener listas de proveedores de confianza

### Gestión de Proveedores de Confianza
**Pasos detallados:**
- [ ] **Lista personal de proveedores**
  - Componente: `TrustedProviders.jsx`
  - Proveedores utilizados en bodas anteriores
  - Calificaciones y comentarios personales
  - Datos de contacto actualizados
  - Categorización por tipo de servicio

- [ ] **Información de proveedores**
  - Historial de colaboraciones
  - Precios aproximados por servicio
  - Disponibilidad y temporadas
  - Notas privadas del wedding planner
  - Fotos de trabajos anteriores

- [ ] **Uso en nuevas bodas**
  - Importación rápida a nueva boda
  - Sugerencias automáticas por categoría
  - Contacto directo desde la lista
  - Seguimiento de recomendaciones realizadas

## 10.4 Dashboard Wedding Planner (Existente)
**Objetivo:** Utilizar el dashboard ya diseñado para wedding planners

### Dashboard Actual del Proyecto
**Pasos detallados:**
- [ ] **Página de inicio adaptada**
  - Misma estructura que dashboard de owners
  - Información consolidada de todas las bodas
  - Métricas generales del wedding planner
  - Acceso rápido a funcionalidades principales

- [ ] **Página de bodas específica**
  - Lista de todas las bodas gestionadas
  - Cards por boda con información clave
  - Estado de progreso por boda
  - Acceso directo a cada boda
  - Filtros por estado, fecha, cliente

- [ ] **Información por boda**
  - Datos básicos (nombres, fecha, ubicación)
  - Progreso general de planificación
  - Próximas tareas críticas
  - Estado financiero resumido
  - Contacto directo con los clientes

## 10.5 Gestión de Múltiples Bodas
**Objetivo:** Permitir a wedding planners gestionar múltiples bodas eficientemente

### Creación de Nuevas Bodas
**Pasos detallados:**
- [ ] **Proceso simplificado**
  - Botón "Nueva Boda" en dashboard de wedding planner
  - Formulario básico con datos del cliente
  - Asignación automática del wedding planner como gestor
  - Configuración inicial con plantillas base

- [ ] **Asignación de ayudantes**
  - Opción de invitar ayudantes por boda
  - Definición de permisos específicos
  - Notificación automática al ayudante
  - Gestión de equipo por proyecto

### Organización del Trabajo
**Pasos detallados:**
- [ ] **Vista consolidada**
  - Todas las bodas en una sola vista
  - Filtros por estado, fecha, prioridad
  - Búsqueda por nombre de cliente
  - Ordenación personalizable

- [ ] **Gestión de tiempo**
  - Calendario unificado de todas las bodas
  - Identificación de conflictos de fechas
  - Planificación de recursos compartidos
  - Alertas de sobrecarga de trabajo

## 10.6 Archivado y Gestión Histórica
**Objetivo:** Mantener historial de bodas completadas

### Archivado de Bodas Completadas
**Pasos detallados:**
- [ ] **Proceso de archivado**
  - Archivado automático post-boda
  - Archivado manual por usuario
  - Confirmación antes de archivar
  - Posibilidad de desarchivar

- [ ] **Datos conservados**
  - Información completa de la boda
  - Fotos y documentos
  - Contactos de proveedores
  - Métricas y estadísticas finales

### Acceso a Historial
**Pasos detallados:**
- [ ] **Biblioteca de bodas**
  - Vista de bodas archivadas
  - Búsqueda por fecha, nombres, ubicación
  - Exportación de datos históricos
  - Generación de reportes retrospectivos

- [ ] **Reutilización de datos**
  - Importación desde bodas archivadas
  - Contactos de proveedores exitosos
  - Plantillas que funcionaron bien
  - Lecciones aprendidas documentadas

## Estructura de Datos

```javascript
// /users/{userId}/profile
{
  id: "user_123",
  email: "ana@email.com",
  role: "wedding_planner", // owner, wedding_planner, assistant
  
  preferences: {
    defaultWeddingTemplate: "classic",
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    language: "es",
    timezone: "Europe/Madrid"
  },
  
  // Solo para wedding planners
  activeWeddings: ["wedding_001", "wedding_002"],
  archivedWeddings: ["wedding_archive_001"],
  lastActiveWedding: "wedding_001",
  
  // Solo para wedding planners
  trustedProviders: [
    {
      id: "provider_001",
      name: "Catering Deluxe",
      category: "catering",
      rating: 5,
      notes: "Excelente servicio, muy profesionales",
      lastUsed: "2024-01-15"
    }
  ]
}

// /users/{userId}/weddingAccess
{
  "wedding_001": {
    role: "owner",
    permissions: ["all"],
    addedAt: "2024-01-01T00:00:00Z",
    addedBy: "self"
  },
  "wedding_002": {
    role: "wedding_planner",
    permissions: ["all_except_delete"],
    addedAt: "2024-01-15T10:00:00Z",
    addedBy: "user_456"
  },
  "wedding_003": {
    role: "assistant",
    permissions: ["all_except_delete"],
    addedAt: "2024-02-01T12:00:00Z",
    addedBy: "user_789",
    restrictedTo: "wedding_003"
  }
}

// /weddings/{weddingId}/collaborators
{
  "user_123": {
    role: "owner",
    permissions: ["all"],
    status: "active",
    invitedAt: null,
    acceptedAt: "2024-01-01T00:00:00Z"
  },
  "user_456": {
    role: "wedding_planner",
    permissions: ["all_except_delete"],
    status: "active", 
    invitedAt: "2024-01-10T09:00:00Z",
    acceptedAt: "2024-01-10T14:30:00Z"
  },
  "user_789": {
    role: "assistant",
    permissions: ["all_except_delete"],
    status: "active",
    invitedAt: "2024-01-20T16:00:00Z",
    acceptedAt: "2024-01-22T10:00:00Z",
    assignedBy: "user_456"
  }
}
```

## Estado de Implementación

### ✅ Completado
- Sistema básico de múltiples bodas en WeddingContext
- Selector de boda activa (solo wedding planners)
- Invitación de colaboradores (AcceptInvitation.jsx)
- Dashboard wedding planner existente

### 🚧 En Desarrollo
- Sistema de tres roles específicos
- Gestión de proveedores de confianza
- Restricciones de acceso por rol

### ❌ Pendiente
- Lista de proveedores de confianza (TrustedProviders.jsx)
- Asignación de ayudantes por boda
- Filtros avanzados en página de bodas
- Calendario unificado para wedding planners
