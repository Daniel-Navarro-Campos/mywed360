# Lovenda Email – Frontend

Aplicación SPA para gestión integrada de correos electrónicos en Lovenda, construida con **React 18 + Vite + TailwindCSS** y hospedada como PWA (offline-first).

Estructura básica para iniciar la aplicación frontend con React, Vite y Tailwind CSS.

## Tabla de Contenidos

1. [Características](#características)
2. [Instalación](#instalación)
3. [Scripts de desarrollo](#scripts-de-desarrollo)
4. [Arquitectura](#arquitectura)
5. [PWA / Offline](#pwa--offline)
6. [Pruebas y CI](#pruebas-y-ci)
7. [Contribuir](#contribuir)

## Características

- Bandeja de entrada virtualizada (`react-window`) para miles de correos.
- Envío/recepción de emails con cuentas por usuario bajo dominio Lovenda.
- Cola de sincronización offline y Service Worker con precache automático.
- Integración con Firebase (Auth, Firestore, Storage) y notificaciones push.
- UI accesible con atajos de teclado y soporte móvil.

## Instalación

Requisitos: Node 18+ y npm.

```bash
npm install
```

## Scripts de desarrollo

- `npm run dev` — servidor de desarrollo con recarga en caliente.
- `npm run build` — genera la build de producción en `dist/`.
- `npm run preview` — sirve la build para pruebas locales.
- `npm test` — ejecuta suite de tests unitarios/integración (Vitest).
- `npm run test:e2e` — lanza tests End-to-End con Cypress.
- `npm run test:coverage` — genera reporte de cobertura.
- `npm run build`: genera la versión de producción.
- `npm run preview`: previsualiza la build de producción.
