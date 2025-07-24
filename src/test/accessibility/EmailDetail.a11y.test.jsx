import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { axe, formatViolations } from '../helpers/axeSetup';
import EmailDetail from '../../components/email/EmailDetail';

// Mock de servicios
vi.mock('../../services/EmailService', () => ({
  getMail: vi.fn().mockResolvedValue({
    id: 'email123',
    from: 'remitente@example.com',
    to: 'usuario@lovenda.com',
    subject: 'Asunto de prueba accesibilidad',
    body: '<p>Este es un email de <strong>prueba</strong> para verificar la accesibilidad.</p>',
    date: '2025-07-10T15:30:00Z',
    folder: 'inbox',
    read: false,
    attachments: []
  }),
  markAsRead: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../services/TagService', () => ({
  getEmailTagsDetails: vi.fn().mockReturnValue([
    { id: 'important', name: 'Importante', color: '#e53e3e' }
  ])
}));

vi.mock('../../services/FolderService', () => ({
  getUserFolders: vi.fn().mockReturnValue([
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true },
    { id: 'custom', name: 'Carpeta personalizada', system: false }
  ])
}));

// Wrapper de componente para pruebas
const TestWrapper = ({ children }) => (
  <MemoryRouter initialEntries={['/email/email123']}>
    <Routes>
      <Route path="/email/:id" element={children} />
    </Routes>
  </MemoryRouter>
);

describe('Pruebas de accesibilidad para EmailDetail', () => {
  let rendered;

  beforeEach(async () => {
    vi.clearAllMocks();
    rendered = render(<EmailDetail />, { wrapper: TestWrapper });
    
    // Esperar a que los datos se carguen
    await waitFor(() => {
      expect(rendered.getByText('Asunto de prueba accesibilidad')).toBeInTheDocument();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const results = await axe(rendered.container);
    
    // Opcional: imprimir detalles de violaciones para depuración
    if (results.violations.length > 0) {
      console.error(formatViolations(results.violations));
    }
    
    expect(results).toHaveNoViolations();
  });

  it('usa una estructura semántica adecuada para el contenido del email', () => {
    // Verificar estructura semántica
    const emailHeader = rendered.container.querySelector('.email-header');
    const emailBody = rendered.container.querySelector('.email-body');
    
    expect(emailHeader).toBeInTheDocument();
    expect(emailBody).toBeInTheDocument();
    
    // Verificar que el encabezado tiene etiquetas apropiadas
    const subject = rendered.getByText('Asunto de prueba accesibilidad');
    expect(subject.tagName).toBe('H1');
    
    // Verificar que el cuerpo del email preserva la semántica del contenido
    expect(emailBody).toContainHTML('<strong>');
    
    // Verificar que la información del remitente es accesible
    const fromInfo = rendered.getByText(/remitente@example.com/i);
    expect(fromInfo).toHaveAttribute('aria-label', expect.stringContaining('Remitente'));
  });

  it('proporciona navegación por teclado para todas las acciones', () => {
    // Verificar que los botones de acción tienen etiquetas adecuadas
    const actionButtons = rendered.container.querySelectorAll('button');
    
    expect(actionButtons.length).toBeGreaterThan(2); // Al menos Responder, Reenviar, etc.
    
    actionButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button.tabIndex).not.toBe(-1); // Asegurar que es focusable
    });
    
    // Verificar orden de tabulación lógico
    const focusableElements = rendered.container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    let lastTabIndex = -1;
    focusableElements.forEach(element => {
      const tabIndex = element.tabIndex;
      // Los tabIndex deberían ser 0 o incrementarse en orden
      expect(tabIndex).toBeGreaterThanOrEqual(0);
      if (tabIndex > 0) {
        expect(tabIndex).toBeGreaterThan(lastTabIndex);
        lastTabIndex = tabIndex;
      }
    });
  });

  it('mantiene suficiente contraste en todos los elementos', async () => {
    // Realizar análisis específico para contraste
    const contrastResults = await axe(rendered.container, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast']
      }
    });
    
    // Si hay problemas de contraste, mostrar detalles
    if (contrastResults.violations.length > 0) {
      console.error('Problemas de contraste:', formatViolations(contrastResults.violations));
    }
    
    expect(contrastResults).toHaveNoViolations();
  });

  it('proporciona alternativas textuales para elementos no textuales', () => {
    // Verificar que los iconos tienen alternativas textuales
    const icons = rendered.container.querySelectorAll('.icon, svg, img');
    
    icons.forEach(icon => {
      // Buscar aria-label en el propio icono o en su padre más cercano
      const hasAccessibleLabel = 
        icon.hasAttribute('aria-label') || 
        icon.hasAttribute('aria-labelledby') || 
        icon.hasAttribute('alt') ||
        icon.closest('button, a')?.hasAttribute('aria-label') || 
        icon.closest('[role]')?.hasAttribute('aria-label');
        
      expect(hasAccessibleLabel).toBe(true);
    });
  });

  it('maneja correctamente los cambios dinámicos de contenido', async () => {
    // Simular cambio en el estado de lectura
    const { rerender } = rendered;
    
    // Modificar el mock para simular cambio
    vi.mocked(vi.importActual('../../services/EmailService')).getMail.mockResolvedValue({
      id: 'email123',
      from: 'remitente@example.com',
      to: 'usuario@lovenda.com',
      subject: 'Asunto actualizado',
      body: '<p>Contenido actualizado</p>',
      date: '2025-07-10T15:30:00Z',
      folder: 'inbox',
      read: true,
      attachments: []
    });
    
    // Re-renderizar el componente
    rerender(<EmailDetail />, { wrapper: TestWrapper });
    
    // Esperar a que se actualice
    await waitFor(() => {
      expect(rendered.getByText('Asunto actualizado')).toBeInTheDocument();
    });
    
    // Verificar regiones en vivo para anuncios de cambios
    const liveRegions = rendered.container.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
    
    // Verificar accesibilidad después del cambio
    const resultsAfterUpdate = await axe(rendered.container);
    expect(resultsAfterUpdate).toHaveNoViolations();
  });

  it('proporciona instrucciones claras para las acciones complejas', () => {
    // Verificar que las acciones complejas tienen instrucciones adecuadas
    const moveButton = rendered.getByText(/mover/i);
    expect(moveButton).toHaveAttribute('aria-haspopup', 'dialog');
    
    const replyButton = rendered.getByText(/responder/i);
    expect(replyButton).toHaveAttribute('aria-label', expect.stringContaining('Responder'));
    
    // Verificar que existen tooltips o descripciones para acciones no obvias
    const actionButtons = rendered.container.querySelectorAll('button[title], button[aria-describedby]');
    expect(actionButtons.length).toBeGreaterThan(0);
  });
});
