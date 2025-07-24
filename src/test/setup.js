import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Alias global "jest" apuntando a la API de "vi" para compatibilidad con pruebas que usan Jest
if (!globalThis.jest) {
  globalThis.jest = vi;
  globalThis.jest.fn = vi.fn;
  globalThis.jest.spyOn = vi.spyOn;
  globalThis.jest.mock = vi.mock;
}


// Limpieza automática después de cada prueba
afterEach(() => {
  cleanup();
});

// Mockear localStorage
beforeAll(() => {
  // Implementación de localStorage para pruebas
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  // Mock para matchMedia que es usado por algunos componentes
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
