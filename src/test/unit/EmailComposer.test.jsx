import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailComposer from '../../components/email/EmailComposer';
import { useAuth } from '../../hooks/useAuth';

// Mock de los hooks y servicios
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/EmailService', () => ({
  initEmailService: vi.fn().mockReturnValue('usuario@lovenda.com'),
  getEmailTemplates: vi.fn().mockResolvedValue([
    { id: 'template1', name: 'Plantilla 1', subject: 'Asunto de plantilla 1', body: 'Cuerpo de la plantilla 1' },
    { id: 'template2', name: 'Plantilla 2', subject: 'Asunto de plantilla 2', body: 'Cuerpo de la plantilla 2' }
  ]),
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('EmailComposer', () => {
  // Props por defecto
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSend: vi.fn(),
    initialValues: {}
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de useAuth
    useAuth.mockReturnValue({
      profile: {
        id: 'user123',
        name: 'Usuario de Prueba',
        email: 'usuario@example.com'
      }
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('renderiza correctamente cuando está abierto', () => {
    render(<EmailComposer {...defaultProps} />);
    
    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/destinatarios/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/asunto/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /mensaje/i })).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });
  
  it('no renderiza cuando isOpen es false', () => {
    render(<EmailComposer {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Nuevo mensaje')).not.toBeInTheDocument();
  });
  
  it('llama a onClose cuando se hace clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    await user.click(screen.getByLabelText(/cerrar/i));
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('muestra campo CC al hacer clic en "mostrar CC"', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Verificar que CC no es visible inicialmente
    expect(screen.queryByPlaceholderText(/cc/i)).not.toBeInTheDocument();
    
    // Mostrar CC
    await user.click(screen.getByText(/cc/i));
    
    // Verificar que CC es visible después de clic
    expect(screen.getByPlaceholderText(/cc/i)).toBeInTheDocument();
  });
  
  it('valida formulario antes de enviar', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Intentar enviar sin datos
    await user.click(screen.getByText('Enviar'));
    
    // Verificar mensaje de error
    expect(screen.getByText('Debes especificar al menos un destinatario')).toBeInTheDocument();
    
    // Llenar destinatario pero no asunto
    await user.type(screen.getByPlaceholderText(/destinatarios/i), 'destinatario@example.com');
    await user.click(screen.getByText('Enviar'));
    
    // Verificar mensaje de error para asunto
    expect(screen.getByText('Por favor, añade un asunto al email')).toBeInTheDocument();
  });
  
  it('aplica plantilla correctamente', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Esperar a que se carguen las plantillas
    await waitFor(() => {
      expect(screen.getByText('Plantillas')).toBeInTheDocument();
    });
    
    // Abrir selector de plantillas
    await user.click(screen.getByText('Plantillas'));
    
    // Seleccionar plantilla 1
    await user.click(screen.getByText('Plantilla 1'));
    
    // Verificar que se aplicó la plantilla
    expect(screen.getByPlaceholderText(/asunto/i).value).toBe('Asunto de plantilla 1');
    expect(screen.getByRole('textbox', { name: /mensaje/i }).value).toBe('Cuerpo de la plantilla 1');
  });
  
  it('maneja la carga de archivos adjuntos', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Crear archivo de prueba
    const testFile = new File(['contenido de prueba'], 'test.txt', { type: 'text/plain' });
    
    // Cargar archivo
    const fileInput = screen.getByLabelText(/adjuntar archivo/i);
    await user.upload(fileInput, testFile);
    
    // Verificar que se muestra el archivo adjunto
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    // Eliminar adjunto
    await user.click(screen.getByLabelText(/eliminar adjunto/i));
    
    // Verificar que el adjunto se eliminó
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });
  
  it('rechaza archivos grandes', async () => {
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Crear archivo grande (mayor a 10MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'grande.txt', { type: 'text/plain' });
    
    // Intentar cargar archivo
    const fileInput = screen.getByLabelText(/adjuntar archivo/i);
    await user.upload(fileInput, largeFile);
    
    // Verificar mensaje de error
    expect(screen.getByText(/exceden el tamaño máximo de 10MB/i)).toBeInTheDocument();
    
    // Verificar que no se añadió el archivo
    expect(screen.queryByText('grande.txt')).not.toBeInTheDocument();
  });
  
  it('envía el correo correctamente con todos los datos', async () => {
    // Importar el servicio para espiar la función
    const EmailService = await import('../../services/EmailService');
    
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Llenar formulario
    await user.type(screen.getByPlaceholderText(/destinatarios/i), 'destinatario@example.com');
    await user.click(screen.getByText(/cc/i)); // Mostrar CC
    await user.type(screen.getByPlaceholderText(/cc/i), 'copia@example.com');
    await user.type(screen.getByPlaceholderText(/asunto/i), 'Asunto de prueba');
    await user.type(screen.getByRole('textbox', { name: /mensaje/i }), 'Cuerpo del mensaje');
    
    // Enviar
    await user.click(screen.getByText('Enviar'));
    
    // Verificar que se llamó a sendEmail con los datos correctos
    await waitFor(() => {
      expect(EmailService.sendEmail).toHaveBeenCalledWith({
        to: 'destinatario@example.com',
        cc: 'copia@example.com',
        subject: 'Asunto de prueba',
        body: 'Cuerpo del mensaje',
        attachments: []
      });
    });
    
    // Verificar que se llamó al callback onSend
    expect(defaultProps.onSend).toHaveBeenCalled();
  });
  
  it('muestra mensaje de error cuando falla el envío', async () => {
    // Configurar el mock para fallar
    const EmailService = await import('../../services/EmailService');
    EmailService.sendEmail.mockRejectedValueOnce(new Error('Error de prueba'));
    
    const user = userEvent.setup();
    render(<EmailComposer {...defaultProps} />);
    
    // Llenar datos mínimos
    await user.type(screen.getByPlaceholderText(/destinatarios/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/asunto/i), 'Prueba');
    await user.type(screen.getByRole('textbox', { name: /mensaje/i }), 'Mensaje');
    
    // Enviar
    await user.click(screen.getByText('Enviar'));
    
    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error al enviar: Error de prueba/i)).toBeInTheDocument();
    });
    
    // Verificar que no se llamó al callback onSend
    expect(defaultProps.onSend).not.toHaveBeenCalled();
  });
  
  it('pre-rellena campos con initialValues', () => {
    const initialValues = {
      to: 'destinatario@example.com',
      cc: 'copia@example.com',
      subject: 'Asunto inicial',
      body: 'Cuerpo inicial'
    };
    
    render(<EmailComposer {...defaultProps} initialValues={initialValues} />);
    
    // Verificar valores pre-rellenados
    expect(screen.getByPlaceholderText(/destinatarios/i).value).toBe('destinatario@example.com');
    expect(screen.getByPlaceholderText(/cc/i).value).toBe('copia@example.com');
    expect(screen.getByPlaceholderText(/asunto/i).value).toBe('Asunto inicial');
    expect(screen.getByRole('textbox', { name: /mensaje/i }).value).toBe('Cuerpo inicial');
  });
});
