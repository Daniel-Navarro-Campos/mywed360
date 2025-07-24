import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../../components/Button';

describe('Button Component', () => {
  // Prueba de renderizado básico
  it('renderiza correctamente con texto', () => {
    render(<Button>Texto de prueba</Button>);
    expect(screen.getByRole('button', { name: /texto de prueba/i })).toBeInTheDocument();
  });

  // Prueba de variantes
  it('aplica las clases correctas según la variante', () => {
    const { rerender } = render(<Button variant="primary">Botón primario</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-600');

    rerender(<Button variant="danger">Botón peligro</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-600');
  });

  // Prueba de tamaños
  it('aplica las clases de tamaño correctamente', () => {
    const { rerender } = render(<Button size="sm">Botón pequeño</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('px-3 py-1.5 text-sm');

    rerender(<Button size="lg">Botón grande</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('px-5 py-2.5 text-lg');
  });

  // Prueba de estado deshabilitado
  it('muestra el estado deshabilitado correctamente', () => {
    render(<Button disabled>Botón deshabilitado</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button.className).toContain('disabled:opacity-60');
  });

  // Prueba de manejo de eventos
  it('llama al controlador de eventos onClick cuando se hace clic', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Botón con clic</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Prueba de tipo de botón
  it('aplica el tipo de botón correcto', () => {
    const { rerender } = render(<Button>Botón por defecto</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');

    rerender(<Button type="submit">Botón submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // Prueba de accesibilidad básica
  it('tiene los atributos de accesibilidad correctos', () => {
    render(<Button aria-label="Botón accesible">Click</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'Botón accesible');
    // Verificar que tiene focus ring para accesibilidad con teclado
    expect(button.className).toContain('focus:outline-none');
    expect(button.className).toContain('focus:ring-2');
  });
});
