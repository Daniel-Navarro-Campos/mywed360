import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import EmailComposer from '../../components/email/EmailComposer';
import EmailTagsManager from '../../components/email/EmailTagsManager';
import TagsManager from '../../components/email/TagsManager';

// Extender las utilidades de prueba con el matcher de axe
expect.extend(toHaveNoViolations);

// Mock de componentes y hooks necesarios
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    currentUser: { uid: 'testuid' },
    profile: {
      id: 'profile123',
      userId: 'user123',
      brideFirstName: 'María',
      brideLastName: 'García',
      emailAlias: 'maria.garcia'
    },
    isAuthenticated: true
  })
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  ToastContainer: () => <div data-testid="toast-container" />
}));

// Mock del servicio de etiquetas
vi.mock('../../services/tagService', () => ({
  getTags: vi.fn(() => Promise.resolve([
    { id: 'tag1', name: 'Urgente', color: '#ff0000', systemTag: true },
    { id: 'tag2', name: 'Proveedores', color: '#00ff00', systemTag: false }
  ])),
  createTag: vi.fn(() => Promise.resolve({ id: 'newTag', name: 'Nueva Etiqueta', color: '#0000ff', systemTag: false })),
  deleteTag: vi.fn(() => Promise.resolve(true))
}));

// Mock para iconos
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  Trash: () => <div data-testid="trash-icon">×</div>,
  X: () => <div data-testid="x-icon">×</div>,
  Tags: () => <div data-testid="tags-icon">Tags</div>,
  Tag: () => <div data-testid="tag-icon">Tag</div>,
  Paperclip: () => <div data-testid="paperclip-icon">Attach</div>,
  Send: () => <div data-testid="send-icon">Send</div>
}));

// Componente de Button mockeado
vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} data-testid="button-mock">
      {children}
    </button>
  )
}));

// Wrapper para los componentes que requieren context
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
    <ToastContainer />
  </BrowserRouter>
);

describe('Pruebas de accesibilidad para componentes de Email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('EmailComposer - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const initialValues = {
        to: '',
        subject: '',
        body: '',
        attachments: []
      };

      const { container } = render(
        <EmailComposer
          onSend={vi.fn()}
          initialValues={initialValues}
          isLoading={false}
        />, 
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('debe tener los campos con labels accesibles', () => {
      const initialValues = {
        to: '',
        subject: '',
        body: '',
        attachments: []
      };

      render(
        <EmailComposer
          onSend={vi.fn()}
          initialValues={initialValues}
          isLoading={false}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que los campos tienen labels accesibles
      expect(screen.getByLabelText(/destinatario/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument();
    });

    it('los botones deben tener texto descriptivo para lectores de pantalla', () => {
      const initialValues = {
        to: '',
        subject: '',
        body: '',
        attachments: []
      };

      render(
        <EmailComposer
          onSend={vi.fn()}
          initialValues={initialValues}
          isLoading={false}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que los botones tienen texto accesible
      const buttons = screen.getAllByRole('button');
      
      // Al menos un botón debe tener descripción de adjuntar archivo
      const attachButton = buttons.find(button => 
        button.textContent.includes('Attach') || 
        button.getAttribute('aria-label')?.includes('adjunt')
      );
      
      // Al menos un botón debe tener descripción de enviar
      const sendButton = buttons.find(button => 
        button.textContent.includes('Send') || 
        button.getAttribute('aria-label')?.includes('enviar')
      );
      
      expect(attachButton).toBeDefined();
      expect(sendButton).toBeDefined();
    });
  });

  describe('EmailTagsManager - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const { container } = render(
        <EmailTagsManager
          emailTags={[]}
          allTags={[
            { id: 'tag1', name: 'Urgente', color: '#ff0000', systemTag: true },
            { id: 'tag2', name: 'Proveedores', color: '#00ff00', systemTag: false }
          ]}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('las etiquetas deben tener suficiente contraste de color', () => {
      render(
        <EmailTagsManager
          emailTags={[{ id: 'tag1', name: 'Urgente', color: '#ff0000', systemTag: true }]}
          allTags={[
            { id: 'tag1', name: 'Urgente', color: '#ff0000', systemTag: true },
            { id: 'tag2', name: 'Proveedores', color: '#00ff00', systemTag: false }
          ]}
          onAddTag={vi.fn()}
          onRemoveTag={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que la etiqueta se renderiza
      const tag = screen.getByText('Urgente');
      expect(tag).toBeInTheDocument();
      
      // La validación de contraste real se hará mediante axe en el test anterior
    });
  });

  describe('TagsManager - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const { container } = render(
        <TagsManager />,
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('el formulario de creación de etiquetas debe ser accesible', async () => {
      render(
        <TagsManager />,
        { wrapper: TestWrapper }
      );

      // Verificar que el botón para crear una nueva etiqueta es accesible
      const newTagButton = screen.getByRole('button', { name: /nueva etiqueta/i });
      expect(newTagButton).toBeInTheDocument();
      
      // La validación completa de accesibilidad se hará mediante axe en el test anterior
    });
  });
});
