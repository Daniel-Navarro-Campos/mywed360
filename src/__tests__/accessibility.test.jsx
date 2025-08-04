import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import React from 'react';
import App from '../App';

expect.extend(toHaveNoViolations);

// Test básico de accesibilidad sobre la aplicación principal
// Ejecuta jest-axe contra el contenedor renderizado y falla si se detectan violaciones

describe('Accesibilidad global', () => {
  it('App no tiene violaciones de accesibilidad', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
