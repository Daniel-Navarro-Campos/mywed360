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

// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';
