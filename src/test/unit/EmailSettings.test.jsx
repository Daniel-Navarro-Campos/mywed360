import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailSettings from '../../components/email/EmailSettings';
import { useAuth } from '../../context/AuthContext';
import { createEmailAlias, initEmailService } from '../../services/emailService';

// Mock de los módulos necesarios
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/emailService', () => ({
  createEmailAlias: vi.fn(),
  initEmailService: vi.fn()
}));

// Mock del componente TagsManager para aislarlo
vi.mock('../../components/email/TagsManager', () => ({
  default: () => <div data-testid="tags-manager">Gestor de etiquetas (Mock)</div>
}));

describe('EmailSettings', () => {
  // Datos de prueba
  const mockUserProfile = {
    id: 'profile123',
    userId: 'user123',
    brideFirstName: 'María',
    brideLastName: 'García',
    emailAlias: 'maria.garcia'
  };
  
  const mockUpdateProfile = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuración por defecto para los mocks
    useAuth.mockReturnValue({
      userProfile: mockUserProfile,
      currentUser: { uid: 'user123' },
      updateUserProfile: mockUpdateProfile
    });
    
    initEmailService.mockReturnValue('maria.garcia@lovenda.com');
    
    createEmailAlias.mockResolvedValue({
      success: true,
      alias: 'nuevo.alias',
      email: 'nuevo.alias@lovenda.com'
    });
    
    // Mock para setTimeout
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  
  it('muestra correctamente la dirección de correo actual del usuario', () => {
    render(<EmailSettings />);
    
    // Verificar que se muestra la dirección actual
    expect(screen.getByText('maria.garcia@lovenda.com')).toBeInTheDocument();
    
    // Verificar que se llamó a initEmailService con el perfil del usuario
    expect(initEmailService).toHaveBeenCalledWith(mockUserProfile);
  });
  
  it('muestra el placeholder correcto en el input de alias', () => {
    render(<EmailSettings />);
    
    const aliasInput = screen.getByPlaceholderText('maria.garcia');
    expect(aliasInput).toBeInTheDocument();
  });
  
  it('permite actualizar el alias de correo electrónico', async () => {
    render(<EmailSettings />);
    
    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar dirección' });
    
    // El botón debe estar inicialmente deshabilitado
    expect(submitButton).toBeDisabled();
    
    // Introducir un nuevo alias
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');
    
    // El botón debe estar habilitado ahora
    expect(submitButton).toBeEnabled();
    
    // Enviar el formulario
    fireEvent.click(submitButton);
    
    // Verificar que se llamó a la API con los parámetros correctos
    expect(createEmailAlias).toHaveBeenCalledWith(mockUserProfile, 'nuevo.alias');
    
    // Verificar que se muestra el mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText('¡Tu dirección de correo ha sido actualizada con éxito!')).toBeInTheDocument();
    });
    
    // Verificar que se llamó a la función de actualización de perfil
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      ...mockUserProfile,
      emailAlias: 'nuevo.alias'
    });
    
    // Avanzar el tiempo para verificar que el mensaje de éxito desaparece
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.queryByText('¡Tu dirección de correo ha sido actualizada con éxito!')).not.toBeInTheDocument();
    });
  });
  
  it('muestra error cuando el alias no es válido', async () => {
    render(<EmailSettings />);
    
    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar dirección' });
    
    // Introducir un alias inválido (demasiado corto)
    const user = userEvent.setup();
    await user.type(aliasInput, 'ab');
    
    // Intentar enviar el formulario
    fireEvent.click(submitButton);
    
    // Verificar que se muestra el mensaje de error
    expect(screen.getByText(/El alias debe tener al menos 3 caracteres/)).toBeInTheDocument();
    
    // Verificar que NO se llamó a la API
    expect(createEmailAlias).not.toHaveBeenCalled();
    
    // Limpiar el input e introducir otro alias inválido (caracteres no permitidos)
    await user.clear(aliasInput);
    await user.type(aliasInput, 'nuevo-alias!');
    
    // Intentar enviar el formulario de nuevo
    fireEvent.click(submitButton);
    
    // Verificar que se muestra el mensaje de error
    expect(screen.getByText(/El alias debe tener al menos 3 caracteres/)).toBeInTheDocument();
    
    // Verificar que NO se llamó a la API
    expect(createEmailAlias).not.toHaveBeenCalled();
  });
  
  it('maneja correctamente los errores de la API', async () => {
    // Configurar el mock para simular un error
    createEmailAlias.mockRejectedValueOnce(new Error('El alias ya está en uso'));
    
    render(<EmailSettings />);
    
    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar dirección' });
    
    // Introducir un nuevo alias
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');
    
    // Enviar el formulario
    fireEvent.click(submitButton);
    
    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error: El alias ya está en uso')).toBeInTheDocument();
    });
    
    // Verificar que NO se llamó a la función de actualización de perfil
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });
  
  it('convierte el alias a minúsculas automáticamente', async () => {
    render(<EmailSettings />);
    
    // Obtener el input de alias
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    
    // Introducir un alias con mayúsculas
    const user = userEvent.setup();
    await user.type(aliasInput, 'NUEVO.ALIAS');
    
    // Verificar que el valor del input se convirtió a minúsculas
    expect(aliasInput).toHaveValue('nuevo.alias');
  });
  
  it('incluye preferencias de notificación con valores predeterminados', () => {
    render(<EmailSettings />);
    
    // Verificar que existen las opciones de notificación
    expect(screen.getByLabelText('Notificarme cuando reciba nuevos correos')).toBeChecked();
    expect(screen.getByLabelText('Notificarme cuando mis correos sean leídos')).toBeChecked();
  });
  
  it('incluye el componente TagsManager', () => {
    render(<EmailSettings />);
    
    // Verificar que se renderiza el componente TagsManager
    const tagsManager = screen.getByTestId('tags-manager');
    expect(tagsManager).toBeInTheDocument();
    expect(tagsManager.textContent).toContain('Gestor de etiquetas (Mock)');
  });
  
  it('muestra el estado de carga durante la actualización', async () => {
    // Crear una promesa que no se resuelve inmediatamente para simular carga
    let resolvePromise;
    const loadingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    createEmailAlias.mockReturnValueOnce(loadingPromise);
    
    render(<EmailSettings />);
    
    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar dirección' });
    
    // Introducir un nuevo alias y enviar
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');
    fireEvent.click(submitButton);
    
    // Verificar que se muestra el estado de carga
    expect(screen.getByRole('button', { name: 'Actualizando...' })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Resolver la promesa para finalizar la carga
    resolvePromise({
      success: true,
      alias: 'nuevo.alias',
      email: 'nuevo.alias@lovenda.com'
    });
    
    // Verificar que el botón vuelve a su estado normal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actualizar dirección' })).toBeInTheDocument();
    });
  });
  
  it('no intenta inicializar si no hay perfil de usuario', () => {
    // Simular que no hay perfil de usuario
    useAuth.mockReturnValueOnce({
      userProfile: null,
      currentUser: null,
      updateUserProfile: mockUpdateProfile
    });
    
    render(<EmailSettings />);
    
    // Verificar que no se llamó a initEmailService
    expect(initEmailService).not.toHaveBeenCalled();
    
    // La dirección de correo debería estar vacía
    expect(screen.queryByText('@lovenda.com')).toBeInTheDocument();
    expect(screen.queryByText('maria.garcia@lovenda.com')).not.toBeInTheDocument();
  });
});
