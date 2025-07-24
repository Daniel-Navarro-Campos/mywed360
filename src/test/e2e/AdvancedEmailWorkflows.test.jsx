import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Componentes principales
import EmailInbox from '../../components/email/EmailInbox';
import EmailDetail from '../../components/email/EmailDetail';
import ComposeEmail from '../../components/email/ComposeEmail';
import EmailSettings from '../../components/email/EmailSettings';
import EmailStats from '../../components/email/EmailStats';

// Servicios
import * as EmailService from '../../services/EmailService';
import * as TagService from '../../services/TagService';
import * as FolderService from '../../services/FolderService';
import * as StatsService from '../../services/StatsService';

// Mock para localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock para fetch global
global.fetch = vi.fn();

// Mock para los servicios
vi.mock('../../services/EmailService');
vi.mock('../../services/TagService');
vi.mock('../../services/FolderService');
vi.mock('../../services/StatsService');

// Mock para File y FileReader
global.File = class MockFile {
  constructor(bits, name, options) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || '';
  }
};

global.FileReader = class MockFileReader {
  constructor() {
    this.result = null;
  }
  readAsDataURL() {
    this.result = 'data:text/plain;base64,dGVzdCBmaWxl';
    setTimeout(() => this.onload(), 50);
  }
};

// Componente para envolver los tests y proporcionar el contexto necesario
const TestWrapper = ({ children, initialRoute = '/' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route path="/" element={<EmailInbox />} />
        <Route path="/detail/:id" element={<EmailDetail />} />
        <Route path="/compose" element={<ComposeEmail />} />
        <Route path="/compose/:action/:id" element={<ComposeEmail />} />
        <Route path="/settings" element={<EmailSettings />} />
        <Route path="/stats" element={<EmailStats />} />
        {children}
      </Routes>
    </MemoryRouter>
  );
};

describe('Flujos avanzados del sistema de correo (E2E)', () => {
  // Datos de ejemplo
  const mockProfile = {
    id: 'profile123',
    userId: 'user123',
    brideFirstName: 'María',
    brideLastName: 'García',
  };

  const mockEmails = [
    {
      id: 'email1',
      from: 'remitente@example.com',
      to: 'maria.garcia@lovenda.com',
      subject: 'Presupuesto fotografía',
      body: '<p>Hola María, te envío el presupuesto para las fotos de la boda.</p>',
      date: '2025-07-12T15:30:00Z',
      folder: 'inbox',
      read: false,
      attachments: []
    },
    {
      id: 'email2',
      from: 'maria.garcia@lovenda.com',
      to: 'florista@example.com',
      subject: 'Consulta sobre centros de mesa',
      body: '<p>Hola, estoy interesada en vuestros servicios para mi boda.</p>',
      date: '2025-07-11T10:15:00Z',
      folder: 'sent',
      read: true,
      attachments: []
    },
    {
      id: 'email3',
      from: 'dj@example.com',
      to: 'maria.garcia@lovenda.com',
      subject: 'Presupuesto DJ y sonido',
      body: '<p>Buenos días María, adjunto encontrarás nuestro presupuesto.</p>',
      date: '2025-07-10T09:45:00Z',
      folder: 'inbox',
      read: true,
      attachments: [
        { id: 'att1', name: 'presupuesto.pdf', size: 1024000, type: 'application/pdf' }
      ]
    },
    {
      id: 'draft1',
      from: 'maria.garcia@lovenda.com',
      to: 'catering@example.com',
      subject: 'Consulta menús',
      body: '<p>Borrador de consulta para catering</p>',
      date: '2025-07-13T08:20:00Z',
      folder: 'drafts',
      draft: true,
      attachments: []
    }
  ];

  const mockStats = {
    lastUpdated: '2025-07-13T17:30:00Z',
    emailCounts: {
      total: 250,
      inbox: 120,
      sent: 100,
      trash: 20,
      unread: 5
    },
    activityMetrics: {
      daily: [5, 7, 3, 8, 4, 6, 2],
      weekly: [25, 30, 28, 32],
      monthly: [95, 120, 85]
    },
    folderDistribution: {
      labels: ['Bandeja de entrada', 'Enviados', 'Papelera', 'Proveedores', 'Ideas de boda'],
      data: [120, 100, 20, 15, 5]
    },
    tagDistribution: {
      labels: ['Importante', 'Fotografía', 'Catering', 'Música'],
      data: [45, 20, 15, 10],
      colors: ['#e53e3e', '#3182ce', '#38a169', '#805ad5']
    },
    contactAnalysis: {
      topContacts: [
        { name: 'Fotógrafo', email: 'fotografo@example.com', count: 25 },
        { name: 'Florista', email: 'florista@example.com', count: 18 },
        { name: 'Catering', email: 'catering@example.com', count: 15 }
      ]
    },
    responseMetrics: {
      averageResponseTime: 3.5, // horas
      responseRate: 0.85 // 85%
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Configurar mocks para los servicios
    EmailService.initEmailService.mockReturnValue('maria.garcia@lovenda.com');
    EmailService.getMails.mockImplementation(async (folder) => {
      if (folder === 'drafts') {
        return [mockEmails[3]];
      }
      return mockEmails.filter(email => email.folder === folder);
    });
    EmailService.getEmail.mockImplementation(async (id) => {
      return mockEmails.find(email => email.id === id) || null;
    });
    EmailService.getUnreadCount.mockResolvedValue(1);
    EmailService.sendMail.mockImplementation(async (email) => {
      return { success: true, id: 'new-email-id' };
    });
    EmailService.saveDraft.mockImplementation(async (draft) => {
      return { success: true, id: draft.id || 'new-draft-id' };
    });
    EmailService.markAsRead.mockImplementation(async (id) => true);
    EmailService.moveMail.mockImplementation(async (id, folder) => true);
    EmailService.deleteMail.mockImplementation(async (id) => true);
    EmailService.replyMail.mockImplementation(async (id, content) => {
      return { success: true, id: 'reply-email-id' };
    });
    EmailService.forwardMail.mockImplementation(async (id, to, content) => {
      return { success: true, id: 'forward-email-id' };
    });
    
    StatsService.generateUserStats.mockResolvedValue(mockStats);
    StatsService.getUserStats.mockReturnValue(mockStats);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Flujo de respuesta a correos', () => {
    it('permite responder a un correo existente', async () => {
      render(<TestWrapper initialRoute="/detail/email1" />);
      
      // Verificar que se carga el detalle del correo
      await waitFor(() => {
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Hacer clic en el botón de responder
      fireEvent.click(screen.getByText('Responder'));
      
      // Verificar que se abre el formulario de respuesta con datos prellenados
      await waitFor(() => {
        // El destinatario debe ser el remitente original
        const toField = screen.getByPlaceholderText('Para:');
        expect(toField).toHaveValue('remitente@example.com');
        
        // El asunto debe incluir "Re:"
        const subjectField = screen.getByPlaceholderText('Asunto:');
        expect(subjectField).toHaveValue('Re: Presupuesto fotografía');
      });
      
      // Escribir el contenido de la respuesta
      const editorElement = screen.getByTestId('email-body-editor');
      fireEvent.input(editorElement, { 
        target: { innerHTML: '<p>Gracias por el presupuesto. Tengo algunas dudas adicionales.</p>' } 
      });
      
      // Enviar la respuesta
      fireEvent.click(screen.getByText('Enviar'));
      
      // Verificar que se llamó a la función de respuesta
      await waitFor(() => {
        expect(EmailService.replyMail).toHaveBeenCalledWith(
          'email1',
          expect.objectContaining({
            to: 'remitente@example.com',
            subject: 'Re: Presupuesto fotografía',
            body: expect.stringContaining('Gracias por el presupuesto')
          })
        );
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/respuesta enviada|mensaje enviado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flujo de reenvío de correos', () => {
    it('permite reenviar un correo a otro destinatario', async () => {
      render(<TestWrapper initialRoute="/detail/email1" />);
      
      // Verificar que se carga el detalle del correo
      await waitFor(() => {
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Hacer clic en el botón de reenviar
      fireEvent.click(screen.getByText('Reenviar'));
      
      // Verificar que se abre el formulario de reenvío con datos prellenados
      await waitFor(() => {
        // El destinatario debe estar vacío
        const toField = screen.getByPlaceholderText('Para:');
        expect(toField).toHaveValue('');
        
        // El asunto debe incluir "Fwd:"
        const subjectField = screen.getByPlaceholderText('Asunto:');
        expect(subjectField).toHaveValue('Fwd: Presupuesto fotografía');
        
        // El cuerpo debe contener el correo original
        const editorElement = screen.getByTestId('email-body-editor');
        expect(editorElement.innerHTML).toContain('Hola María');
      });
      
      // Completar el destinatario
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Para:'), 'familiar@example.com');
      
      // Añadir un comentario al reenvío
      const editorElement = screen.getByTestId('email-body-editor');
      const originalContent = editorElement.innerHTML;
      fireEvent.input(editorElement, { 
        target: { innerHTML: `<p>Mira este presupuesto que me enviaron.</p>${originalContent}` } 
      });
      
      // Enviar el reenvío
      fireEvent.click(screen.getByText('Enviar'));
      
      // Verificar que se llamó a la función de reenvío
      await waitFor(() => {
        expect(EmailService.forwardMail).toHaveBeenCalledWith(
          'email1',
          'familiar@example.com',
          expect.objectContaining({
            subject: 'Fwd: Presupuesto fotografía',
            body: expect.stringContaining('Mira este presupuesto')
          })
        );
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/correo reenviado|mensaje reenviado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flujo de gestión de borradores', () => {
    it('permite guardar un borrador y editarlo posteriormente', async () => {
      // Renderizar el componente de composición
      render(<TestWrapper initialRoute="/compose" />);
      
      // Verificar que se muestra el formulario de composición
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Para:')).toBeInTheDocument();
      });
      
      // Rellenar parcialmente el formulario
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Para:'), 'destinatario@example.com');
      await user.type(screen.getByPlaceholderText('Asunto:'), 'Borrador importante');
      
      // Escribir en el editor
      const editorElement = screen.getByTestId('email-body-editor');
      fireEvent.input(editorElement, { 
        target: { innerHTML: '<p>Este es un borrador que completaré más tarde.</p>' } 
      });
      
      // Guardar como borrador
      fireEvent.click(screen.getByText('Guardar borrador'));
      
      // Verificar que se llamó a la función de guardar borrador
      await waitFor(() => {
        expect(EmailService.saveDraft).toHaveBeenCalledWith(expect.objectContaining({
          to: 'destinatario@example.com',
          subject: 'Borrador importante',
          body: '<p>Este es un borrador que completaré más tarde.</p>'
        }));
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/borrador guardado/i)).toBeInTheDocument();
      });
      
      // Simular navegación a la bandeja de entrada
      render(<TestWrapper />);
      
      // Ir a la carpeta de borradores
      fireEvent.click(screen.getByText('Borradores'));
      
      // Verificar que se muestra el borrador
      await waitFor(() => {
        expect(screen.getByText('Consulta menús')).toBeInTheDocument();
      });
      
      // Abrir el borrador
      fireEvent.click(screen.getByText('Consulta menús'));
      
      // Verificar que se abre el formulario de edición con los datos del borrador
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Para:')).toHaveValue('catering@example.com');
        expect(screen.getByPlaceholderText('Asunto:')).toHaveValue('Consulta menús');
        
        const editorElement = screen.getByTestId('email-body-editor');
        expect(editorElement.innerHTML).toContain('Borrador de consulta para catering');
      });
      
      // Completar el borrador y enviar
      const editorElement2 = screen.getByTestId('email-body-editor');
      fireEvent.input(editorElement2, { 
        target: { innerHTML: '<p>Quisiera información sobre menús para 100 invitados.</p>' } 
      });
      
      fireEvent.click(screen.getByText('Enviar'));
      
      // Verificar que se envió el correo
      await waitFor(() => {
        expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
          id: 'draft1',
          to: 'catering@example.com',
          subject: 'Consulta menús'
        }));
      });
    });
  });

  describe('Flujo de eliminación de correos', () => {
    it('permite eliminar correos (mover a papelera y eliminar permanentemente)', async () => {
      // Renderizar el detalle de un correo
      render(<TestWrapper initialRoute="/detail/email1" />);
      
      // Verificar que se carga el detalle del correo
      await waitFor(() => {
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Eliminar el correo (mover a papelera)
      fireEvent.click(screen.getByText('Eliminar'));
      
      // Verificar que se llamó a la función para mover a papelera
      await waitFor(() => {
        expect(EmailService.moveMail).toHaveBeenCalledWith('email1', 'trash');
        
        // Verificar que se muestra una notificación
        expect(screen.getByText(/correo eliminado|movido a papelera/i)).toBeInTheDocument();
      });
      
      // Simular navegación a la papelera
      render(<TestWrapper initialRoute="/" />);
      
      // Ir a la papelera
      fireEvent.click(screen.getByText('Papelera'));
      
      // Verificar que podemos eliminar permanentemente
      const emailInTrash = mockEmails[0]; // Ahora está en papelera según la simulación
      EmailService.getMails.mockResolvedValueOnce([{...emailInTrash, folder: 'trash'}]);
      
      await waitFor(() => {
        const trashAction = screen.getAllByText('Eliminar permanentemente')[0];
        fireEvent.click(trashAction);
      });
      
      // Confirmar eliminación permanente
      fireEvent.click(screen.getByText('Confirmar'));
      
      // Verificar que se llamó a la función de eliminación permanente
      await waitFor(() => {
        expect(EmailService.deleteMail).toHaveBeenCalledWith('email1');
        
        // Verificar que se muestra una notificación
        expect(screen.getByText(/eliminado permanentemente/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flujo de gestión de adjuntos', () => {
    it('permite ver y descargar adjuntos de un correo', async () => {
      // Renderizar el detalle de un correo con adjuntos
      render(<TestWrapper initialRoute="/detail/email3" />);
      
      // Verificar que se carga el detalle del correo con su adjunto
      await waitFor(() => {
        expect(screen.getByText('Presupuesto DJ y sonido')).toBeInTheDocument();
        expect(screen.getByText('presupuesto.pdf')).toBeInTheDocument();
      });
      
      // Hacer clic para descargar el adjunto
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:adjunto');
      window.URL.revokeObjectURL = vi.fn();
      
      // Mock para document.createElement y click
      const mockAnchor = {
        click: vi.fn(),
        setAttribute: vi.fn(),
        style: {}
      };
      
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation((tag) => {
        if (tag === 'a') {
          return mockAnchor;
        }
        return originalCreateElement.call(document, tag);
      });
      
      // Simular descarga
      fireEvent.click(screen.getByText('Descargar'));
      
      // Verificar que se inició la descarga
      await waitFor(() => {
        expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'presupuesto.pdf');
        expect(mockAnchor.click).toHaveBeenCalled();
      });
      
      // Restaurar el mock
      document.createElement = originalCreateElement;
    });
    
    it('permite adjuntar archivos al componer un correo', async () => {
      render(<TestWrapper initialRoute="/compose" />);
      
      // Verificar que se muestra el formulario de composición
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Para:')).toBeInTheDocument();
      });
      
      // Simular selección de archivo
      const file = new File(['contenido de prueba'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const input = screen.getByLabelText('Adjuntar archivo');
      
      await fireEvent.change(input, { target: { files: [file] } });
      
      // Verificar que se muestra el adjunto
      await waitFor(() => {
        expect(screen.getByText('test.docx')).toBeInTheDocument();
      });
      
      // Rellenar el resto del formulario
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Para:'), 'destinatario@example.com');
      await user.type(screen.getByPlaceholderText('Asunto:'), 'Correo con adjunto');
      
      const editorElement = screen.getByTestId('email-body-editor');
      fireEvent.input(editorElement, { 
        target: { innerHTML: '<p>Adjunto documento solicitado.</p>' } 
      });
      
      // Enviar el correo
      fireEvent.click(screen.getByText('Enviar'));
      
      // Verificar que se llamó a la función de envío con el adjunto
      await waitFor(() => {
        expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
          to: 'destinatario@example.com',
          subject: 'Correo con adjunto',
          attachments: [expect.objectContaining({ name: 'test.docx' })]
        }));
      });
    });
  });

  describe('Flujo de visualización de estadísticas', () => {
    it('permite ver estadísticas y métricas de uso del correo', async () => {
      render(<TestWrapper initialRoute="/stats" />);
      
      // Verificar que se cargan las estadísticas
      await waitFor(() => {
        expect(screen.getByText('Estadísticas de correo')).toBeInTheDocument();
        expect(StatsService.generateUserStats).toHaveBeenCalled();
      });
      
      // Verificar que se muestran las métricas principales
      expect(screen.getByText('250')).toBeInTheDocument(); // Total de correos
      expect(screen.getByText('5')).toBeInTheDocument(); // Correos sin leer
      
      // Verificar que se muestran los gráficos (al menos sus títulos)
      expect(screen.getByText('Actividad reciente')).toBeInTheDocument();
      expect(screen.getByText('Distribución por carpetas')).toBeInTheDocument();
      expect(screen.getByText('Distribución por etiquetas')).toBeInTheDocument();
      
      // Verificar que se muestran los contactos frecuentes
      expect(screen.getByText('Contactos frecuentes')).toBeInTheDocument();
      expect(screen.getByText('Fotógrafo')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // Contador del contacto más frecuente
      
      // Verificar que se muestran las métricas de respuesta
      expect(screen.getByText('Tiempo medio de respuesta')).toBeInTheDocument();
      expect(screen.getByText('3.5h')).toBeInTheDocument(); // Tiempo medio
      expect(screen.getByText('85%')).toBeInTheDocument(); // Tasa de respuesta
    });
  });
});
