import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Componentes principales
import EmailInbox from '../../components/email/EmailInbox';
import EmailDetail from '../../components/email/EmailDetail';
import ComposeEmail from '../../components/email/ComposeEmail';
import EmailSettings from '../../components/email/EmailSettings';
import FolderSelectionModal from '../../components/email/FolderSelectionModal';

// Servicios
import * as EmailService from '../../services/EmailService';
import * as TagService from '../../services/TagService';
import * as FolderService from '../../services/FolderService';

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

// Componente para envolver los tests y proporcionar el contexto necesario
const TestWrapper = ({ children, initialRoute = '/' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastContainer position="top-right" autoClose={2000} />
      <Routes>
        <Route path="/" element={<EmailInbox />} />
        <Route path="/detail/:id" element={<EmailDetail />} />
        <Route path="/compose" element={<ComposeEmail />} />
        <Route path="/settings" element={<EmailSettings />} />
        {children}
      </Routes>
    </MemoryRouter>
  );
};

describe('Flujos completos del sistema de correo (E2E)', () => {
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
    }
  ];

  const mockFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true },
    { id: 'proveedores', name: 'Proveedores', system: false },
    { id: 'ideas', name: 'Ideas de boda', system: false }
  ];

  const mockTags = [
    { id: 'important', name: 'Importante', color: '#e53e3e', system: true },
    { id: 'photography', name: 'Fotografía', color: '#3182ce', system: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Configurar mocks para los servicios
    EmailService.initEmailService.mockReturnValue('maria.garcia@lovenda.com');
    EmailService.getMails.mockResolvedValue(mockEmails);
    EmailService.getUnreadCount.mockResolvedValue(1);
    EmailService.sendMail.mockImplementation(async (email) => {
      return { success: true, id: 'new-email-id' };
    });
    EmailService.markAsRead.mockImplementation(async (id) => true);
    EmailService.moveMail.mockImplementation(async (id, folder) => true);
    EmailService.deleteMail.mockImplementation(async (id) => true);
    
    TagService.getUserTags.mockReturnValue(mockTags);
    TagService.getEmailTags.mockReturnValue(['important']);
    TagService.getEmailTagsDetails.mockReturnValue([mockTags[0]]);
    TagService.addTagToEmail.mockImplementation((userId, emailId, tagId) => true);
    TagService.removeTagFromEmail.mockImplementation((userId, emailId, tagId) => true);
    
    FolderService.getUserFolders.mockReturnValue(mockFolders);
    FolderService.createFolder.mockImplementation((userId, name) => {
      return { id: `folder-${Date.now()}`, name, system: false };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Flujo de recepción y lectura de correo', () => {
    it('permite ver la bandeja de entrada y abrir un correo', async () => {
      // Renderizar la bandeja de entrada
      render(<TestWrapper />);
      
      // Verificar que se muestra la lista de correos
      await waitFor(() => {
        expect(screen.getByText('Bandeja de entrada')).toBeInTheDocument();
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Verificar que muestra el indicador de no leído
      expect(screen.getByText('Presupuesto fotografía').closest('.email-item')).toHaveClass('unread');
      
      // Hacer clic en un correo para abrirlo
      fireEvent.click(screen.getByText('Presupuesto fotografía'));
      
      // Verificar que se abre el detalle del correo
      await waitFor(() => {
        expect(EmailService.markAsRead).toHaveBeenCalledWith('email1');
        expect(screen.getByText('Hola María, te envío el presupuesto para las fotos de la boda.')).toBeInTheDocument();
      });
    });

    it('muestra etiquetas en los correos y permite filtrar por ellas', async () => {
      render(<TestWrapper />);
      
      // Verificar que se muestra la etiqueta en el correo
      await waitFor(() => {
        const emailItem = screen.getByText('Presupuesto fotografía').closest('.email-item');
        expect(within(emailItem).getByText('Importante')).toBeInTheDocument();
      });
      
      // Hacer clic en el filtro de etiquetas
      fireEvent.click(screen.getByText('Filtros'));
      fireEvent.click(screen.getByText('Importante'));
      
      // Verificar que se aplica el filtro
      await waitFor(() => {
        expect(EmailService.getMails).toHaveBeenCalledWith('inbox', expect.objectContaining({
          tags: ['important']
        }));
      });
    });
  });

  describe('Flujo de envío de correo', () => {
    it('permite componer y enviar un nuevo correo', async () => {
      render(<TestWrapper initialRoute="/compose" />);
      
      // Verificar que se muestra el formulario de composición
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Para:')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Asunto:')).toBeInTheDocument();
      });
      
      // Rellenar el formulario
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Para:'), 'destinatario@example.com');
      await user.type(screen.getByPlaceholderText('Asunto:'), 'Solicitud de información');
      
      // El editor de texto enriquecido es más complejo, simulemos un cambio directo
      const editorElement = screen.getByTestId('email-body-editor');
      fireEvent.input(editorElement, { 
        target: { innerHTML: '<p>Hola, necesito más información sobre sus servicios.</p>' } 
      });
      
      // Enviar el correo
      fireEvent.click(screen.getByText('Enviar'));
      
      // Verificar que se llamó a la función de envío
      await waitFor(() => {
        expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
          to: 'destinatario@example.com',
          subject: 'Solicitud de información',
          body: '<p>Hola, necesito más información sobre sus servicios.</p>'
        }));
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/correo enviado|mensaje enviado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flujo de organización de correo', () => {
    it('permite mover un correo a una carpeta diferente', async () => {
      render(<TestWrapper initialRoute="/detail/email1" />);
      
      // Verificar que se carga el detalle del correo
      await waitFor(() => {
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Hacer clic en el botón de mover
      fireEvent.click(screen.getByText('Mover a'));
      
      // Verificar que se abre el modal de selección de carpeta
      await waitFor(() => {
        expect(screen.getByText('Seleccionar carpeta')).toBeInTheDocument();
      });
      
      // Seleccionar una carpeta
      fireEvent.click(screen.getByText('Proveedores'));
      fireEvent.click(screen.getByText('Mover'));
      
      // Verificar que se llamó a la función para mover el correo
      await waitFor(() => {
        expect(EmailService.moveMail).toHaveBeenCalledWith('email1', 'proveedores');
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/correo movido|mensaje movido/i)).toBeInTheDocument();
      });
    });

    it('permite añadir y quitar etiquetas a un correo', async () => {
      render(<TestWrapper initialRoute="/detail/email1" />);
      
      // Verificar que se carga el detalle del correo
      await waitFor(() => {
        expect(screen.getByText('Presupuesto fotografía')).toBeInTheDocument();
      });
      
      // Hacer clic en el botón de gestión de etiquetas
      fireEvent.click(screen.getByText('Etiquetas'));
      
      // Verificar que se muestra el selector de etiquetas
      await waitFor(() => {
        expect(screen.getByText('Fotografía')).toBeInTheDocument();
      });
      
      // Añadir una etiqueta
      fireEvent.click(screen.getByText('Fotografía'));
      
      // Verificar que se llamó a la función para añadir la etiqueta
      await waitFor(() => {
        expect(TagService.addTagToEmail).toHaveBeenCalledWith(
          mockProfile.userId, 
          'email1', 
          'photography'
        );
      });
      
      // Quitar una etiqueta existente
      fireEvent.click(screen.getByText('Importante'));
      
      // Verificar que se llamó a la función para quitar la etiqueta
      await waitFor(() => {
        expect(TagService.removeTagFromEmail).toHaveBeenCalledWith(
          mockProfile.userId, 
          'email1', 
          'important'
        );
      });
    });
  });

  describe('Flujo de gestión de carpetas y etiquetas', () => {
    it('permite crear una nueva carpeta personalizada', async () => {
      render(<TestWrapper initialRoute="/settings" />);
      
      // Verificar que se carga la configuración
      await waitFor(() => {
        expect(screen.getByText('Configuración de correo')).toBeInTheDocument();
      });
      
      // Ir a la sección de carpetas
      fireEvent.click(screen.getByText('Carpetas'));
      
      // Crear nueva carpeta
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Nombre de carpeta'), 'Presupuestos');
      fireEvent.click(screen.getByText('Crear carpeta'));
      
      // Verificar que se llamó a la función para crear la carpeta
      await waitFor(() => {
        expect(FolderService.createFolder).toHaveBeenCalledWith(
          mockProfile.userId, 
          'Presupuestos'
        );
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/carpeta creada|creada con éxito/i)).toBeInTheDocument();
      });
    });

    it('permite crear una nueva etiqueta personalizada', async () => {
      render(<TestWrapper initialRoute="/settings" />);
      
      // Verificar que se carga la configuración
      await waitFor(() => {
        expect(screen.getByText('Configuración de correo')).toBeInTheDocument();
      });
      
      // Ir a la sección de etiquetas
      fireEvent.click(screen.getByText('Etiquetas'));
      
      // Crear nueva etiqueta
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Nombre de etiqueta'), 'Catering');
      
      // Seleccionar un color
      fireEvent.click(screen.getByTestId('color-picker'));
      fireEvent.click(screen.getByTestId('color-#38a169')); // Verde
      
      fireEvent.click(screen.getByText('Crear etiqueta'));
      
      // Verificar que se llamó a la función para crear la etiqueta
      await waitFor(() => {
        expect(TagService.createTag).toHaveBeenCalledWith(
          mockProfile.userId, 
          'Catering',
          '#38a169'
        );
        
        // Verificar que se muestra una notificación de éxito
        expect(screen.getByText(/etiqueta creada|creada con éxito/i)).toBeInTheDocument();
      });
    });
  });

  describe('Flujo de búsqueda y filtrado avanzado', () => {
    it('permite buscar correos por texto', async () => {
      render(<TestWrapper />);
      
      // Verificar que se muestra la bandeja de entrada
      await waitFor(() => {
        expect(screen.getByText('Bandeja de entrada')).toBeInTheDocument();
      });
      
      // Realizar una búsqueda
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText('Buscar...'), 'fotografía');
      fireEvent.keyPress(screen.getByPlaceholderText('Buscar...'), { key: 'Enter', code: 13 });
      
      // Verificar que se llamó a la función de búsqueda
      await waitFor(() => {
        expect(EmailService.getMails).toHaveBeenCalledWith('inbox', expect.objectContaining({
          search: 'fotografía'
        }));
      });
    });

    it('permite aplicar filtros avanzados combinando criterios', async () => {
      render(<TestWrapper />);
      
      // Verificar que se muestra la bandeja de entrada
      await waitFor(() => {
        expect(screen.getByText('Bandeja de entrada')).toBeInTheDocument();
      });
      
      // Abrir el panel de filtros avanzados
      fireEvent.click(screen.getByText('Filtros'));
      
      // Aplicar múltiples filtros
      fireEvent.click(screen.getByText('Importante')); // Etiqueta
      fireEvent.click(screen.getByText('No leídos')); // Estado
      
      // Filtrar por fecha (últimos 7 días)
      fireEvent.change(screen.getByLabelText('Periodo'), { target: { value: '7d' } });
      
      // Aplicar filtros
      fireEvent.click(screen.getByText('Aplicar filtros'));
      
      // Verificar que se llamó a getMails con los filtros correctos
      await waitFor(() => {
        expect(EmailService.getMails).toHaveBeenCalledWith('inbox', expect.objectContaining({
          tags: ['important'],
          onlyUnread: true,
          dateRange: '7d'
        }));
      });
    });
  });

  describe('Flujo de estadísticas y análisis', () => {
    it('muestra correctamente las estadísticas de uso del correo', async () => {
      // Mock para estadísticas
      const mockStats = {
        totalSent: 45,
        totalReceived: 87,
        responseRate: 76,
        avgResponseTime: 3.2, // horas
        topContacts: [
          { email: 'florista@example.com', count: 12 },
          { email: 'fotografo@example.com', count: 8 }
        ],
        tagDistribution: [
          { tag: 'Importante', count: 15 },
          { tag: 'Fotografía', count: 7 }
        ],
        activityByDay: {
          lun: 14, mar: 8, mié: 22, jue: 11, vie: 17, sáb: 5, dom: 2
        }
      };
      
      EmailService.getEmailStatistics.mockResolvedValue(mockStats);
      
      render(<TestWrapper initialRoute="/statistics" />);
      
      // Verificar que se muestran las estadísticas
      await waitFor(() => {
        expect(screen.getByText('Estadísticas de uso')).toBeInTheDocument();
        expect(screen.getByText('87')).toBeInTheDocument(); // Total recibidos
        expect(screen.getByText('45')).toBeInTheDocument(); // Total enviados
        expect(screen.getByText('76%')).toBeInTheDocument(); // Tasa de respuesta
      });
      
      // Verificar gráficos y distribuciones
      expect(screen.getByText('Contactos frecuentes')).toBeInTheDocument();
      expect(screen.getByText('florista@example.com')).toBeInTheDocument();
      expect(screen.getByText('fotografo@example.com')).toBeInTheDocument();
      
      expect(screen.getByText('Distribución por etiquetas')).toBeInTheDocument();
      expect(screen.getByText('Actividad por día')).toBeInTheDocument();
    });
  });
});
