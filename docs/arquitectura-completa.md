# Documentación Arquitectónica Completa de MyWed360

## Diagrama de Arquitectura

```mermaid
flowchart TD
  subgraph Cliente (Browser)
    A[React + Vite SPA]
    B[Service Worker (PWA)]
    A -->|REST / Firestore SDK| D[Firebase Backend]
    B --> A
  end

  subgraph Servicios Locales
    A --> LS[(localStorage)]
    A --> SWQ[SyncService Queue]
  end

  subgraph Backend
    D --> FS[(Firestore)]
    D --> FAuth[Firebase Auth]
    D --> FStorage[Firebase Storage]
  end
```

El frontend (SPA) se comunica directamente con Firebase mediante el SDK. El `Service Worker` provee capacidades offline y caching. `SyncService` mantiene una cola local para sincronizar cambios cuando se restaura la conexión.

## Contextos de Usuario

En el proyecto MyWed360 existen dos contextos separados para gestionar diferentes aspectos del usuario:

### 1. Contexto de Autenticación (`/src/context/UserContext.jsx`)

- **Propósito**: Gestiona el estado de autenticación con Firebase, incluyendo login, logout, registro y actualización de perfil.
- **Componentes**: Usado principalmente en `App.jsx` como wrapper global para toda la aplicación.
- **Funcionalidades**: 
  - Autenticación con Firebase
  - Persistencia de sesión
  - Roles de usuario
  - Información básica del usuario autenticado

### 2. Contexto de Preferencias de Usuario (`/src/contexts/UserContext.jsx`)

- **Propósito**: Gestiona preferencias y datos extendidos del usuario, separado del sistema de autenticación.
- **Componentes**: Usado en componentes específicos que necesitan acceso a preferencias como `EmailStatistics.jsx`.
- **Funcionalidades**:
  - Preferencias de usuario (tema, notificaciones, idioma)
  - Datos extendidos del perfil

## Decisión Arquitectónica

Se ha optado por mantener ambos contextos separados debido a:

1. **Separación de responsabilidades**: Autenticación vs. Preferencias/Datos del usuario
2. **Facilidad de mantenimiento**: Permite evolucionar cada contexto de forma independiente
3. **Rendimiento**: Evita re-renders innecesarios al separar estados que cambian con diferente frecuencia

## Convención de Nomenclatura

Para evitar confusiones:
- El contexto en `/src/context/UserContext.jsx` maneja autenticación y se exporta como `UserContext` y `useUserContext`
- El contexto en `/src/contexts/UserContext.jsx` maneja preferencias y se exporta como `UserPreferencesContext` y `useUserPreferencesContext`

## Recomendaciones para Desarrolladores

Al trabajar con estos contextos:

1. Utilizar `useUserContext()` cuando se necesite acceso a información de autenticación y sesión
2. Utilizar `useUserPreferencesContext()` cuando se necesite acceso a preferencias y datos extendidos
3. Evitar mezclar importaciones o añadir funcionalidades que correspondan al otro contexto

## Stack Tecnológico

### Frontend
- **React 18** - Biblioteca principal de UI
- **Vite** - Build tool y dev server
- **Firebase SDK** - Autenticación, Firestore, Storage
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconos
- **React Router** - Navegación

### Backend
- **Firebase Firestore** - Base de datos NoSQL
- **Firebase Auth** - Autenticación
- **Firebase Storage** - Almacenamiento de archivos
- **Firebase Functions** - Funciones serverless

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Vitest** - Testing framework
- **Cypress** - Testing E2E
