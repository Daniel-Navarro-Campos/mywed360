import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, formatViolations } from '../helpers/axeSetup';
import EmailInbox from '../../components/email/EmailInbox';

// Mock de servicios
vi.mock('../../services/EmailService', () => ({
  getMails: vi.fn().mockResolvedValue([
    {
      id: 'email1',
      from: 'remitente@example.com',
      to: 'usuario@lovenda.com',
      subject: 'Asunto de prueba',
      body: '<p>Contenido de prueba</p>',
      date: '2025-07-10T15:30:00Z',
      folder: 'inbox',
      read: false,
      attachments: []
    },
    {
      id: 'email2',
      from: 'otro@example.com',
      to: 'usuario@lovenda.com',
      subject: 'Segundo email',
      body: '<p>Otro contenido de prueba</p>',
      date: '2025-07-09T10:15:00Z',
      folder: 'inbox',
      read: true,
      attachments: []
    }
  ]),
  getUnreadCount: vi.fn().mockResolvedValue(1)
}));

vi.mock('../../services/TagService', () => ({
  getUserTags: vi.fn().mockReturnValue([
    { id: 'important', name: 'Importante', color: '#e53e3e' }
  ]),
  getEmailTagsDetails: vi.fn().mockReturnValue([])
}));

vi.mock('../../services/FolderService', () => ({
  getUserFolders: vi.fn().mockReturnValue([
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true }
  ])
}));

// Wrapper de componente para pruebas
const TestWrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('Pruebas de accesibilidad para EmailInbox', () => {
  let rendered;

  beforeEach(() => {
    vi.clearAllMocks();
    rendered = render(<EmailInbox />, { wrapper: TestWrapper });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    // Esperar a que los datos se carguen
    await vi.waitFor(() => {
      expect(rendered.getByText('Bandeja de entrada')).toBeInTheDocument();
    });

    // Ejecutar análisis de accesibilidad
    const results = await axe(rendered.container);
    
    // Opcional: imprimir detalles de violaciones para depuración
    if (results.violations.length > 0) {
      console.error(formatViolations(results.violations));
    }
    
    expect(results).toHaveNoViolations();
  });

  it('mantiene la navegación por teclado funcional', async () => {
    // Esperar a que los datos se carguen
    await vi.waitFor(() => {
      expect(rendered.getByText('Bandeja de entrada')).toBeInTheDocument();
    });
    
    // Verificar que los elementos interactivos son focusables y tienen roles adecuados
    const emailItems = rendered.container.querySelectorAll('.email-item');
    
    expect(emailItems.length).toBeGreaterThan(0);
    
    emailItems.forEach(item => {
      // Verificar atributos de accesibilidad esenciales
      expect(item).toHaveAttribute('tabindex', '0');
      expect(item).toHaveAttribute('role', 'button');
      
      // Verificar que los elementos no leídos tienen información semántica adicional
      if (item.classList.contains('unread')) {
        expect(item).toHaveAttribute('aria-label', expect.stringContaining('no leído'));
      }
    });

    // Verificar navegación para filtros y acciones
    const actionButtons = rendered.container.querySelectorAll('button, [role="button"]');
    actionButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('usa estructura semántica adecuada para la lista de emails', async () => {
    // Esperar a que los datos se carguen
    await vi.waitFor(() => {
      expect(rendered.getByText('Bandeja de entrada')).toBeInTheDocument();
    });
    
    // Verificar estructura semántica
    const emailList = rendered.container.querySelector('.email-list');
    expect(emailList).toHaveAttribute('role', 'list');
    
    const emailItems = emailList.querySelectorAll('.email-item');
    emailItems.forEach(item => {
      expect(item).toHaveAttribute('role', 'listitem');
    });
  });

  it('proporciona feedback adecuado para estados de carga y errores', async () => {
    // Simular estado de carga
    vi.mock('../../services/EmailService', () => ({
      getMails: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000))),
      getUnreadCount: vi.fn().mockResolvedValue(0)
    }));
    
    const { getByText, queryByText } = render(<EmailInbox />, { wrapper: TestWrapper });
    
    // Verificar indicador de carga
    expect(getByText('Cargando...')).toBeInTheDocument();
    expect(getByText('Cargando...')).toHaveAttribute('aria-live', 'polite');
    
    // Simular error
    vi.mock('../../services/EmailService', () => ({
      getMails: vi.fn().mockRejectedValue(new Error('Error de prueba')),
      getUnreadCount: vi.fn().mockResolvedValue(0)
    }));
    
    const { getByText: getByTextError } = render(<EmailInbox />, { wrapper: TestWrapper });
    
    // Verificar mensaje de error
    await vi.waitFor(() => {
      expect(getByTextError('Error al cargar correos')).toBeInTheDocument();
      expect(getByTextError('Error al cargar correos')).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('mantiene suficiente contraste en todos los elementos', async () => {
    // Esperar a que los datos se carguen
    await vi.waitFor(() => {
      expect(rendered.getByText('Bandeja de entrada')).toBeInTheDocument();
    });
    
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
});
