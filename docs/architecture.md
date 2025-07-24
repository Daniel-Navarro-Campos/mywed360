---
Descripción breve: Diagrama de arquitectura del frontend Lovenda Email
---

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
