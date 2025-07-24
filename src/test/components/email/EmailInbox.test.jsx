import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailInbox from '../../../components/email/EmailInbox';
import * as EmailService from '../../../services/EmailService';
import { useAuth } from '../../../hooks/useAuth';

// Mocks necesarios
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../../services/EmailService', () => ({
  initEmailService: vi.fn(),
  getMails: vi.fn(),
  deleteMail: vi.fn(),
  markAsRead: vi.fn(),
  sendMail: vi.fn()
}));

// Mock para los componentes que no necesitamos probar en detalle
vi.mock('../../../components/email/EmailDetail', () => ({
  default: ({ email, onBack }) => (
    <div data-testid="email-detail">
      {email && (
        <>
          <div data-testid="email-subject">{email.subject}</div>
          <button onClick={onBack}>Volver</button>
        </>
      )}
    </div>
  )
}));

vi.mock('../../../components/Card', () => ({
  default: ({ children }) => <div data-testid="card">{children}</div>
}));

vi.mock('../../../components/Button', () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

describe('EmailInbox Component', () => {
  // Datos de ejemplo para las pruebas
  const mockEmails = [
    { 
      id: 'email-1', 
      subject: 'Asunto importante', 
      from: 'remitente@ejemplo.com',
      to: 'usuario@lovenda.app',
      date: '2025-07-10T10:30:00Z',
      read: false,
      folder: 'inbox',
      attachments: []
    },
    { 
      id: 'email-2', 
      subject: 'Recordatorio reunión', 
      from: 'team@empresa.com',
      to: 'usuario@lovenda.app',
      date: '2025-07-09T08:15:00Z',
      read: true,
      folder: 'inbox',
      attachments: [{ filename: 'acta.pdf' }]
    },
    { 
      id: 'email-3', 
      subject: 'Borrador enviado', 
      from: 'usuario@lovenda.app',
      to: 'destinatario@empresa.com',
      date: '2025-07-08T14:45:00Z',
      read: true,
      folder: 'sent',
      attachments: []
    }
  ];

  const mockFolders = [
    { id: 'folder-1', name: 'Importante' },
    { id: 'folder-2', name: 'Trabajo' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar el mock de autenticación
    useAuth.mockReturnValue({
      user: { uid: 'user123' },
      profile: { 
        id: 'profile123',
        email: 'usuario@lovenda.app',
        name: 'Usuario Test' 
      }
    });
    
    // Configurar el mock de servicio de email
    EmailService.getMails.mockResolvedValue(mockEmails);
    EmailService.initEmailService.mockReturnValue('usuario@lovenda.app');
  });

  // Prueba de carga inicial
  it('carga y muestra correctamente la lista de emails', async () => {
    render(<EmailInbox />);
    
    // Verificar que muestra el estado de carga inicialmente
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    
    // Esperar a que se muestren los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      expect(EmailService.getMails).toHaveBeenCalledWith('inbox');
    });
    
    // Verificar que los emails se muestran correctamente
    expect(screen.getByText('Asunto importante')).toBeInTheDocument();
    expect(screen.getByText('Recordatorio reunión')).toBeInTheDocument();
  });

  // Prueba de búsqueda de emails
  it('filtra emails correctamente al buscar', async () => {
    render(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Buscar un término específico
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'importante' } });
    
    // Verificar que solo se muestra el email que coincide
    expect(screen.getByText('Asunto importante')).toBeInTheDocument();
    expect(screen.queryByText('Recordatorio reunión')).not.toBeInTheDocument();
  });

  // Prueba de selección y acciones con emails
  it('permite seleccionar emails y realizar acciones con ellos', async () => {
    EmailService.deleteMail.mockResolvedValue(true);
    
    render(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Seleccionar un email
    const emailCheckbox = screen.getAllByRole('checkbox')[1]; // El primero es "Seleccionar todos"
    fireEvent.click(emailCheckbox);
    
    // Verificar que se ha seleccionado
    expect(emailCheckbox).toBeChecked();
    
    // Eliminar el email seleccionado
    const deleteButton = screen.getByText(/eliminar/i);
    fireEvent.click(deleteButton);
    
    // Verificar que se llama a la función de eliminar
    expect(EmailService.deleteMail).toHaveBeenCalledWith('email-1');
    
    // Verificar que se actualiza la lista
    await waitFor(() => {
      expect(EmailService.getMails).toHaveBeenCalledTimes(2);
    });
  });

  // Prueba de cambio entre carpetas
  it('cambia correctamente entre carpetas', async () => {
    render(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Cambiar a la carpeta Enviados
    const sentFolder = screen.getByText(/enviados/i);
    fireEvent.click(sentFolder);
    
    // Verificar que se llama a getMails con la carpeta correcta
    await waitFor(() => {
      expect(EmailService.getMails).toHaveBeenCalledWith('sent');
    });
  });

  // Prueba de ordenación
  it('cambia el orden de los emails al hacer clic en las cabeceras de columna', async () => {
    render(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Ordenar por asunto
    const subjectHeader = screen.getByRole('button', { name: /asunto/i });
    fireEvent.click(subjectHeader);
    
    // Verificar el cambio de orden
    const emailItems = screen.getAllByRole('row');
    expect(emailItems[1]).toHaveTextContent('Asunto importante');
    
    // Cambiar el orden nuevamente
    fireEvent.click(subjectHeader);
    
    // Verificar que el orden se invierte
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Borrador enviado');
  });

  // Prueba de selección de email para ver detalles
  it('muestra los detalles de un email al hacer clic en él', async () => {
    render(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Hacer clic en un email
    const emailRow = screen.getAllByRole('row')[1];
    fireEvent.click(emailRow);
    
    // Verificar que se muestra el detalle
    expect(screen.getByTestId('email-detail')).toBeInTheDocument();
    expect(screen.getByTestId('email-subject')).toHaveTextContent('Asunto importante');
    
    // Volver a la lista
    const backButton = screen.getByText('Volver');
    fireEvent.click(backButton);
    
    // Verificar que se oculta el detalle
    expect(screen.queryByTestId('email-subject')).not.toBeInTheDocument();
  });

  // Prueba de manejo de errores
  it('muestra mensaje de error cuando falla la carga de emails', async () => {
    // Simular un error en la carga
    EmailService.getMails.mockRejectedValue(new Error('Error al cargar'));
    
    render(<EmailInbox />);
    
    // Verificar que se muestra el error
    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar los emails/i)).toBeInTheDocument();
    });
  });
});
