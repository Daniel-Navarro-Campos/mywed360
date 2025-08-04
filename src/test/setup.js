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


// ---------- Render con proveedores globales ----------
// Para evitar el error de solo-lectura, mockeamos todo el módulo de
// @testing-library/react y sustituimos únicamente la función render con un
// wrapper que añade los providers. El resto de la API se mantiene intacto.

vi.mock('@testing-library/react', async () => {
  // Importamos el módulo real para conservar todo lo demás
  const rtl = await vi.importActual('@testing-library/react');
  // Importamos el wrapper con providers
  const { default: AllProviders } = await import('./AllProviders.jsx');

  return {
    __esModule: true,
    ...rtl,
    render: (ui, options = {}) => rtl.render(ui, { wrapper: AllProviders, ...options })
  };
});

// Limpieza automática después de cada prueba
afterEach(() => {
  cleanup();
});

// ---------- Mocks genericos ----------
// Mock de react-beautiful-dnd para evitar necesidad del DragDropContext real
vi.mock('react-beautiful-dnd', () => {
  const Noop = ({ children }) => (children);
  // Draggable y Droppable renderizan children()
  const Draggable = ({ children, ...rest }) => {
    const provided = {
      draggableProps: { style: {} },
      dragHandleProps: {},
      innerRef: () => {}
    };
    return children(provided, {});
  };
  const Droppable = ({ children, ...rest }) => {
    const provided = {
      droppableProps: {},
      innerRef: () => {}
    };
    return children(provided, {});
  };
  return {
    __esModule: true,
    DragDropContext: Noop,
    Draggable,
    Droppable
  };
});
// Mock de todos los iconos Lucide: cualquier componente será un div vacío (o svg)
// Usamos un Proxy para evitar declarar cada icono individualmente
vi.mock('lucide-react', () => {
  const Stub = () => null;
  // Usamos un Proxy para que cualquier named export devuelva el componente Stub.
  return new Proxy(
    { __esModule: true, default: Stub },
    {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        return Stub;
      }
    }
  );
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
