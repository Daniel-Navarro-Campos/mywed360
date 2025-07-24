import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIEmailModal from '../../../../components/proveedores/ai/AIEmailModal';

// Mock del hook useAIProviderEmail
vi.mock('../../../../hooks/useAIProviderEmail', () => ({
  useAIProviderEmail: () => ({
    userEmail: 'usuario.test@lovenda.com',
    isSending: false,
    error: null,
    sendEmailFromAIResult: vi.fn().mockResolvedValue(true),
    generateAISubject: () => 'Consulta sobre Fotografía para boda - Fotógrafo Prueba',
    generateAIEmailBody: () => 'Cuerpo de email generado por IA'
  })
}));

// Mock del componente Alert
vi.mock('../../../../components/Alert', () => ({
  default: ({ type, title, message, className, children, 'data-testid': testId }) => (
    <div data-testid={testId || 'alert'} className={`alert-${type} ${className || ''}`}>
      <div className="alert-title">{title}</div>
      <div className="alert-message">{message}</div>
      {children}
    </div>
  )
}));

describe('AIEmailModal', () => {
  const mockOnClose = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    aiResult: {
      id: 1,
      name: 'Fotógrafo Prueba',
      service: 'Fotografía',
      email: 'fotografo@prueba.com',
      aiSummary: 'Este fotógrafo tiene un estilo moderno perfecto para bodas.'
    },
    searchQuery: 'fotógrafo estilo moderno para boda'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <AIEmailModal {...defaultProps} isOpen={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('renderiza el modal con la información correcta del proveedor', () => {
    render(<AIEmailModal {...defaultProps} />);
    
    expect(screen.getByText(/Contactar a Fotógrafo Prueba/i)).toBeInTheDocument();
    expect(screen.getByText(/usuario.test@lovenda.com/i)).toBeInTheDocument();
    expect(screen.getByText(/fotografo@prueba.com/i)).toBeInTheDocument();
    expect(screen.getByTestId('email-subject')).toHaveValue('Consulta sobre Fotografía para boda - Fotógrafo Prueba');
    expect(screen.getByTestId('email-body')).toHaveValue('Cuerpo de email generado por IA');
  });
  
  it('llama a onClose cuando se hace clic en el botón cerrar', () => {
    render(<AIEmailModal {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('close-modal-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('permite editar el asunto y cuerpo del email', () => {
    render(<AIEmailModal {...defaultProps} />);
    
    const subjectInput = screen.getByTestId('email-subject');
    const bodyInput = screen.getByTestId('email-body');
    
    fireEvent.change(subjectInput, { target: { value: 'Asunto modificado' } });
    fireEvent.change(bodyInput, { target: { value: 'Contenido modificado' } });
    
    expect(subjectInput).toHaveValue('Asunto modificado');
    expect(bodyInput).toHaveValue('Contenido modificado');
  });
  
  it('envía el formulario correctamente y muestra mensaje de éxito', async () => {
    // Mock de useAIProviderEmail con control de isSending y success
    let isSendingState = false;
    let setIsSent = null;
    
    vi.mock('../../../../hooks/useAIProviderEmail', () => ({
      useAIProviderEmail: () => {
        const sendEmailMock = vi.fn().mockImplementation(async () => {
          isSendingState = true;
          // Simular una pequeña demora para probar el estado de envío
          await new Promise(resolve => setTimeout(resolve, 10));
          isSendingState = false;
          if (setIsSent) setIsSent(true);
          return true;
        });
        
        return {
          userEmail: 'usuario.test@lovenda.com',
          isSending: isSendingState,
          error: null,
          sendEmailFromAIResult: sendEmailMock,
          generateAISubject: () => 'Consulta sobre Fotografía para boda - Fotógrafo Prueba',
          generateAIEmailBody: () => 'Cuerpo de email generado por IA'
        };
      }
    }), { virtual: true });
    
    // Modificar el componente para capturar el estado de isSent
    vi.mock('../../../../components/proveedores/ai/AIEmailModal', () => {
      const ActualComponent = vi.requireActual('../../../../components/proveedores/ai/AIEmailModal').default;
      return {
        default: (props) => {
          const [isSent, setIsSentState] = vi.importActual('react').useState(false);
          setIsSent = setIsSentState;
          return <ActualComponent {...props} />;
        }
      };
    }, { virtual: true });
    
    render(<AIEmailModal {...defaultProps} />);
    
    const sendButton = screen.getByTestId('send-email-btn');
    fireEvent.click(sendButton);
    
    // Verificar que el formulario se envía correctamente
    await waitFor(() => {
      expect(screen.getByTestId('success-alert')).toBeInTheDocument();
    });
    
    // Verificar que el modal se cierra después de un tiempo
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }, { timeout: 2500 });
  });
  
  it('muestra error cuando falla el envío de email', async () => {
    // Mock de useAIProviderEmail con error
    vi.mock('../../../../hooks/useAIProviderEmail', () => ({
      useAIProviderEmail: () => ({
        userEmail: 'usuario.test@lovenda.com',
        isSending: false,
        error: 'Error al enviar el email',
        sendEmailFromAIResult: vi.fn().mockResolvedValue(false),
        generateAISubject: () => 'Consulta sobre Fotografía para boda - Fotógrafo Prueba',
        generateAIEmailBody: () => 'Cuerpo de email generado por IA'
      })
    }), { virtual: true });
    
    render(<AIEmailModal {...defaultProps} />);
    
    const sendButton = screen.getByTestId('send-email-btn');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toBeInTheDocument();
      expect(screen.getByText(/Error al enviar el email/i)).toBeInTheDocument();
    });
  });
  
  it('muestra la información de AI sobre el proveedor', () => {
    render(<AIEmailModal {...defaultProps} />);
    
    expect(screen.getByText(/Este fotógrafo tiene un estilo moderno perfecto para bodas./i)).toBeInTheDocument();
    expect(screen.getByText(/¿Por qué este proveedor?/i)).toBeInTheDocument();
  });
});
