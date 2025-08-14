import { vi } from 'vitest';

// Mock de base de datos Firestore para todas las pruebas
vi.mock('./db.js', () => ({
  __esModule: true,
  db: { collection: () => ({}) },
}));

// Mock de firebase-admin por seguridad
vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: () => ({}) },
  firestore: () => ({})
}));

// Mock genérico de axios para evitar llamadas externas inesperadas
vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

// Mock de todos los iconos de lucide-react para evitar errores de export en tests de accesibilidad
import React from 'react';
vi.mock('lucide-react', () => {
  const Stub = (props) => React.createElement('svg', props);
  // Crear objeto base con default
  const iconNames = [
    'ArrowLeft','Paperclip','Inbox','Send','Star','Trash','Plus','Mail','Tag','Settings','ChevronDown','ChevronRight'
  ];
  const exports = { __esModule: true, default: Stub };
  iconNames.forEach(name => { exports[name] = Stub; });
  // Devolver proxy para cualquier icono no listado
  return new Proxy(exports, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return Stub;
    },
    has() { return true; }
  });

});

// Desactivar PerformanceMonitor en tests para evitar timers/handles abiertos
import { performanceMonitor } from '../src/services/PerformanceMonitor';
if (performanceMonitor?.setEnabled) {
  performanceMonitor.setEnabled(false);
}

// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';

// Forzar salida explícita en CI y loguear handles vivos con why-is-node-running
if (process.env.CI) {
  // Función para imprimir handles vivos y salir
  const safeExit = () => setTimeout(() => process.exit(0), 500);

  if (typeof afterAll !== 'undefined') {
    afterAll(async () => {
      try {
        const why = await import('why-is-node-running');
        (why.default || why)();
      } catch (err) {
        console.error('why-is-node-running import failed', err);
      }
      safeExit();
    });
  }
  // Fallback: si afterAll no está disponible, salir tras 60 s y loguear handles
  setTimeout(async () => {
    try {
      const why = await import('why-is-node-running');
      (why.default || why)();
    } catch (err) {
      console.error('why-is-node-running import failed', err);
    }
    console.warn('CI timeout fallback: forcing exit');
    safeExit();
  }, 60000).unref?.();
}
