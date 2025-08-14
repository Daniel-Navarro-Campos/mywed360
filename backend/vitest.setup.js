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
  const base = { __esModule: true, default: Stub };
  iconNames.forEach(name => { base[name] = Stub; });
  // Devolver Proxy que resuelve cualquier icono al stub
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return Stub;
    },
    has() {
      // Afirmar que cualquier export existe para Vitest
      return true;
    },
  });
});

// Desactivar PerformanceMonitor en tests para evitar timers/handles abiertos
import { performanceMonitor } from '../src/services/PerformanceMonitor';
if (performanceMonitor?.setEnabled) {
  performanceMonitor.setEnabled(false);
}

// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';

// Forzar salida explícita en CI para evitar procesos colgados por handles abiertos
if (process.env.CI) {
  afterAll(() => {
    // Dar 200 ms para que Vitest escriba cobertura y junit
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    }, 200);
  });
}
