import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Variable mutable para cambiar el rol entre tests
let mockRole = 'owner';

// Mock del UserContext para inyectar distintos roles
vi.mock('../../context/UserContext', () => ({
  __esModule: true,
  useUserContext: () => ({ user: { role: mockRole } }),
}));

// Mock del AuthProvider para evitar Firebase en AllProviders
vi.mock('../../context/AuthContext', () => ({
  __esModule: true,
  AuthProvider: ({ children }) => <>{children}</>,
}));

import Nav from '../Nav.jsx';

const getLabels = () => screen.getAllByRole('button').map(btn => btn.textContent);

describe('Nav – visibilidad según rol', () => {
  afterEach(() => {
    // Reset al rol por defecto
    mockRole = 'owner';
  });

  it.each([
    ['owner', ['Inicio', 'Tareas', 'Finanzas', 'Más']],
    ['pareja', ['Inicio', 'Tareas', 'Finanzas', 'Más']], // alias Firestore
    ['planner', ['Inicio', 'Tareas', 'Protocolo', 'Más']],
    ['wedding-planner', ['Inicio', 'Tareas', 'Protocolo', 'Más']],
    ['assistant', ['Tareas', 'Protocolo', 'Más']],
    ['ayudante', ['Tareas', 'Protocolo', 'Más']],
  ])('muestra %p correctamente', (role, expected) => {
    mockRole = role;
    render(<Nav />);
    expect(getLabels()).toEqual(expected);
  });
});
