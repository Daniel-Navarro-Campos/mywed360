import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-toastify';

// Componentes a probar en integración
import EmailInbox from '../../components/email/EmailInbox';
import EmailComposer from '../../components/email/EmailComposer';
import * as EmailService from '../../services/EmailService';
import * as TagService from '../../services/TagService';
import { useAuth } from '../../hooks/useAuth';

// Mock de dependencias
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/EmailService', () => ({
  initEmailService: vi.fn(),
  getMails: vi.fn(),
  sendMail: vi.fn(),
  deleteMail: vi.fn(),
  markAsRead: vi.fn(),
  moveToFolder: vi.fn(),
  createFolder: vi.fn(),
  getFolders: vi.fn()
}));

vi.mock('../../services/TagService', () => ({
  getTags: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  tagEmail: vi.fn(),
  untagEmail: vi.fn(),
  getEmailTags: vi.fn()
}));

// Mock de los componentes hijos que no son el foco de estas pruebas de integración
vi.mock('../../components/email/EmailDetail', () => ({
  default: ({ email, onBack, onReply, onDelete, onMoveToFolder }) => (
    <div data-testid="email-detail">
      {email && (
        <div>
          <div data-testid="email-subject">{email.subject}</div>
          <div data-testid="email-body">{email.body}</div>
          <button onClick={onBack}>Volver</button>
          <button onClick={onReply}>Responder</button>
          <button onClick={onDelete}>Eliminar</button>
          <button onClick={() => onMoveToFolder(email.id, 'folder-1')}>Mover</button>
        </div>
      )}
    </div>
  )
}));

// Helper para envolver componentes con el router
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Pruebas de integración del sistema de correo electrónico', () => {
  // Datos de ejemplo para las pruebas
  const mockUser = {
    uid: 'user123',
    email: 'usuario@example.com',
  };
  
  const mockProfile = {
    id: 'profile123',
    email: 'usuario@lovenda.app',
    name: 'Usuario Test',
  };
  
  const mockEmails = [
    { 
      id: 'email-1', 
      subject: 'Propuesta de colaboración', 
      from: 'socio@empresa.com',
      to: 'usuario@lovenda.app',
      date: '2025-07-10T10:30:00Z',
      read: false,
      body: '<p>Hola, me gustaría discutir una posible colaboración.</p>',
      folder: 'inbox',
      attachments: []
    },
    { 
      id: 'email-2', 
      subject: 'Confirmación de pedido', 
      from: 'ventas@tienda.com',
      to: 'usuario@lovenda.app',
      date: '2025-07-09T08:15:00Z',
      read: true,
      body: '<p>Su pedido ha sido confirmado.</p>',
      folder: 'inbox',
      attachments: [{ filename: 'factura.pdf', size: 1024 * 100 }]
    }
  ];

  const mockFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'folder-1', name: 'Trabajo', system: false },
    { id: 'folder-2', name: 'Personal', system: false }
  ];

  const mockTags = [
    { id: 'tag-1', name: 'Importante', color: '#f44336' },
    { id: 'tag-2', name: 'Proyecto', color: '#4caf50' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar los mocks
    useAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile
    });
    
    EmailService.getMails.mockResolvedValue(mockEmails);
    EmailService.initEmailService.mockReturnValue('usuario@lovenda.app');
    EmailService.getFolders.mockResolvedValue(mockFolders);
    
    TagService.getTags.mockResolvedValue(mockTags);
    TagService.getEmailTags.mockImplementation((emailId) => {
      return Promise.resolve(emailId === 'email-1' ? [mockTags[0]] : []);
    });
  });

  // Prueba de flujo de recepción de correos
  it('Muestra correctamente los emails recibidos y permite verlos en detalle', async () => {
    renderWithRouter(<EmailInbox />);
    
    // Verificar que se están cargando los emails
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    
    // Verificar que se cargan y muestran los emails recibidos
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
      expect(EmailService.getMails).toHaveBeenCalledWith('inbox');
    });
    
    expect(screen.getByText('Propuesta de colaboración')).toBeInTheDocument();
    expect(screen.getByText('Confirmación de pedido')).toBeInTheDocument();
    
    // Verificar que se puede abrir un email para ver sus detalles
    fireEvent.click(screen.getByText('Propuesta de colaboración'));
    
    // Verificar que se muestra el detalle del email
    expect(screen.getByTestId('email-subject')).toHaveTextContent('Propuesta de colaboración');
    expect(screen.getByTestId('email-body')).toHaveTextContent('Hola, me gustaría discutir una posible colaboración.');
    
    // Verificar que el email se marca como leído
    expect(EmailService.markAsRead).toHaveBeenCalledWith('email-1');
    
    // Volver a la bandeja de entrada
    fireEvent.click(screen.getByText('Volver'));
    
    // Verificar que se ha vuelto a la lista
    expect(screen.queryByTestId('email-detail')).not.toBeInTheDocument();
    expect(screen.getByText('Propuesta de colaboración')).toBeInTheDocument();
  });

  // Prueba de flujo de envío de correos
  it('Permite componer y enviar un nuevo correo', async () => {
    // Mock para sendMail
    EmailService.sendMail.mockResolvedValue({
      id: 'new-email-1',
      success: true
    });

    // Renderizar el compositor de emails (componente separado del inbox)
    renderWithRouter(<EmailComposer />);
    
    // Rellenar el formulario
    const toInput = screen.getByLabelText(/para/i);
    const subjectInput = screen.getByLabelText(/asunto/i);
    const bodyInput = screen.getByLabelText(/mensaje/i);
    
    await userEvent.type(toInput, 'destinatario@empresa.com');
    await userEvent.type(subjectInput, 'Respuesta a propuesta');
    await userEvent.type(bodyInput, 'Gracias por su propuesta. Estamos interesados.');
    
    // Enviar el correo
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(sendButton);
    
    // Verificar que se llama al servicio de envío
    expect(EmailService.sendMail).toHaveBeenCalledWith({
      to: 'destinatario@empresa.com',
      subject: 'Respuesta a propuesta',
      body: 'Gracias por su propuesta. Estamos interesados.',
      from: 'usuario@lovenda.app',
      attachments: []
    });
    
    // Verificar que se muestra notificación de éxito
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Correo enviado correctamente');
    });
  });

  // Prueba de organización: mover correo a carpeta
  it('Permite mover un correo a otra carpeta', async () => {
    // Mock para moveToFolder
    EmailService.moveToFolder.mockResolvedValue(true);
    
    renderWithRouter(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Abrir un email
    fireEvent.click(screen.getByText('Propuesta de colaboración'));
    
    // Verificar que se muestra el detalle
    expect(screen.getByTestId('email-subject')).toBeInTheDocument();
    
    // Mover a una carpeta
    const moveButton = screen.getByText('Mover');
    fireEvent.click(moveButton);
    
    // Verificar que se llama al servicio
    expect(EmailService.moveToFolder).toHaveBeenCalledWith('email-1', 'folder-1');
    
    // Verificar que se actualiza la lista de correos
    await waitFor(() => {
      expect(EmailService.getMails).toHaveBeenCalledTimes(2);
    });
  });

  // Prueba de filtrado por carpeta
  it('Permite filtrar emails por carpeta', async () => {
    // Configurar el mock para devolver diferentes emails según la carpeta
    EmailService.getMails.mockImplementation((folder) => {
      if (folder === 'sent') {
        return Promise.resolve([
          {
            id: 'sent-1',
            subject: 'Email enviado',
            from: 'usuario@lovenda.app',
            to: 'contacto@empresa.com',
            date: '2025-07-08T09:20:00Z',
            read: true,
            folder: 'sent'
          }
        ]);
      }
      return Promise.resolve(mockEmails);
    });
    
    renderWithRouter(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Verificar emails en bandeja de entrada
    expect(screen.getByText('Propuesta de colaboración')).toBeInTheDocument();
    
    // Cambiar a carpeta Enviados
    const sentFolder = screen.getByText(/enviados/i);
    fireEvent.click(sentFolder);
    
    // Verificar que se cargan los emails enviados
    await waitFor(() => {
      expect(EmailService.getMails).toHaveBeenCalledWith('sent');
      expect(screen.getByText('Email enviado')).toBeInTheDocument();
      expect(screen.queryByText('Propuesta de colaboración')).not.toBeInTheDocument();
    });
  });

  // Prueba de integración con etiquetas
  it('Muestra y permite gestionar etiquetas en los correos', async () => {
    // Mock para las operaciones de etiquetas
    TagService.tagEmail.mockResolvedValue(true);
    
    renderWithRouter(<EmailInbox />);
    
    // Esperar a que carguen los emails
    await waitFor(() => {
      expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
    });
    
    // Verificar que se muestran las etiquetas existentes en los correos
    expect(screen.getByText('Importante')).toBeInTheDocument();
    
    // Abrir un email para gestionar sus etiquetas
    fireEvent.click(screen.getByText('Confirmación de pedido'));
    
    // Verificar que se cargan las etiquetas del correo
    await waitFor(() => {
      expect(TagService.getEmailTags).toHaveBeenCalledWith('email-2');
    });
  });
});
