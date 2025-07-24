import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComposeEmailModal from '../../components/email/ComposeEmailModal';

// Mock del servicio de correo
vi.mock('../../services/emailService', () => ({
  sendMail: vi.fn()
}));

// Importar sendMail después del mock para poder rastrearlo
import { sendMail } from '../../services/emailService';

describe('ComposeEmailModal', () => {
  // Props por defecto
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userEmail: 'usuario@lovenda.com',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renderiza correctamente cuando está abierto', () => {
    render(<ComposeEmailModal {...defaultProps} />);
    
    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
    expect(screen.getByLabelText(/destinatario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asunto/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/escribe tu mensaje/i)).toBeInTheDocument();
    expect(screen.getByText('Enviar')).toBeInTheDocument();
  });

  it('no renderiza cuando isOpen es false', () => {
    render(<ComposeEmailModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Nuevo mensaje')).not.toBeInTheDocument();
  });

  it('llama a onClose cuando se hace clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(<ComposeEmailModal {...defaultProps} />);
    
    const closeButton = screen.getByLabelText(/cerrar/i);
    await user.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra error cuando se intenta enviar sin destinatario', async () => {
    const user = userEvent.setup();
    render(<ComposeEmailModal {...defaultProps} />);
    
    // Llenar asunto y cuerpo, pero no el destinatario
    await user.type(screen.getByLabelText(/asunto/i), 'Asunto de prueba');
    await user.type(screen.getByPlaceholderText(/escribe tu mensaje/i), 'Cuerpo del mensaje');
    
    // Intentar enviar
    await user.click(screen.getByText('Enviar'));
    
    // Verificar mensaje de error
    expect(screen.getByText('Debes especificar un destinatario')).toBeInTheDocument();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('envía el correo con los datos correctos', async () => {
    // Configurar el mock para resolver correctamente
    sendMail.mockResolvedValueOnce({ success: true });
    
    const user = userEvent.setup();
    render(<ComposeEmailModal {...defaultProps} />);
    
    // Llenar todos los campos
    await user.type(screen.getByLabelText(/destinatario/i), 'destinatario@example.com');
    await user.type(screen.getByLabelText(/asunto/i), 'Asunto de prueba');
    await user.type(screen.getByPlaceholderText(/escribe tu mensaje/i), 'Cuerpo del mensaje');
    
    // Enviar el formulario
    await user.click(screen.getByText('Enviar'));
    
    // Verificar que sendMail se llama con los parámetros correctos
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith({
      to: 'destinatario@example.com',
      subject: 'Asunto de prueba',
      body: 'Cuerpo del mensaje',
      attachments: []
    });
    
    // Verificar mensaje de éxito y cierre del modal
    await waitFor(() => {
      expect(screen.getByText(/enviado con éxito/i)).toBeInTheDocument();
    });
    
    // El modal debe cerrarse después del tiempo establecido
    vi.advanceTimersByTime(1500);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra error cuando falla el envío', async () => {
    // Configurar el mock para rechazar la promesa
    sendMail.mockRejectedValueOnce(new Error('Error de prueba'));
    
    const user = userEvent.setup();
    render(<ComposeEmailModal {...defaultProps} />);
    
    // Llenar todos los campos
    await user.type(screen.getByLabelText(/destinatario/i), 'destinatario@example.com');
    await user.type(screen.getByLabelText(/asunto/i), 'Asunto de prueba');
    await user.type(screen.getByPlaceholderText(/escribe tu mensaje/i), 'Cuerpo del mensaje');
    
    // Enviar el formulario
    await user.click(screen.getByText('Enviar'));
    
    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error al enviar el correo: Error de prueba/i)).toBeInTheDocument();
    });
    
    // El modal no debe cerrarse
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('pre-rellena campos cuando es una respuesta a otro correo', () => {
    const replyToEmail = {
      id: 'email123',
      from: 'remitente@example.com',
      subject: 'Asunto original',
      body: 'Contenido del correo original',
      date: '2025-07-10T15:30:00Z'
    };
    
    render(<ComposeEmailModal {...defaultProps} replyTo={replyToEmail} />);
    
    // Verificar campos pre-rellenados
    expect(screen.getByLabelText(/destinatario/i).value).toBe('remitente@example.com');
    expect(screen.getByLabelText(/asunto/i).value).toBe('Re: Asunto original');
    expect(screen.getByPlaceholderText(/escribe tu mensaje/i).value).toContain('remitente@example.com escribió:');
    expect(screen.getByPlaceholderText(/escribe tu mensaje/i).value).toContain('Contenido del correo original');
  });

  it('limita el tamaño de los archivos adjuntos', async () => {
    const user = userEvent.setup();
    render(<ComposeEmailModal {...defaultProps} />);
    
    // Crear archivo de prueba simulado grande (más de 10MB)
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large-file.pdf', { type: 'application/pdf' });
    
    // Simular la selección del archivo
    const fileInput = screen.getByLabelText(/adjuntar archivo/i);
    await user.upload(fileInput, largeFile);
    
    // Verificar mensaje de error sobre el tamaño
    expect(screen.getByText(/no debe superar los 10MB/i)).toBeInTheDocument();
    
    // Intentar enviar el correo
    await user.click(screen.getByText('Enviar'));
    
    // Verificar que sendMail no se llama debido al error
    expect(sendMail).not.toHaveBeenCalled();
  });
});
