import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailNotificationBadge from '../../components/email/EmailNotificationBadge';
import { getMails, initEmailService } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mock de los servicios y hooks
vi.mock('../../services/emailService', () => ({
  getMails: vi.fn(),
  initEmailService: vi.fn()
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

// Mock de setInterval y clearInterval
vi.spyOn(global, 'setInterval');
vi.spyOn(global, 'clearInterval');

describe('EmailNotificationBadge', () => {
  // Mock del navegador
  const mockNavigate = vi.fn();
  
  // Mock de datos de usuario y correos
  const mockUserProfile = { id: 'user123', email: 'usuario@lovenda.com' };
  
  // Correos de ejemplo
  const mockEmails = [
    { id: 'email1', subject: 'Asunto 1', read: false },
    { id: 'email2', subject: 'Asunto 2', read: false },
    { id: 'email3', subject: 'Asunto 3', read: true }
  ];
  
  beforeEach(() => {
    // Restablecer todos los mocks
    vi.clearAllMocks();
    
    // Configurar mocks por defecto
    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({ userProfile: mockUserProfile });
    getMails.mockResolvedValue(mockEmails);
    
    // Evitar que los console.error reales se muestren en las pruebas
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('inicializa el servicio de email y comprueba correos al montar', async () => {
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que se inicializó el servicio de email
    expect(initEmailService).toHaveBeenCalledWith(mockUserProfile);
    
    // Verificar que se obtuvieron los correos de la bandeja de entrada
    expect(getMails).toHaveBeenCalledWith('inbox');
  });
  
  it('muestra el número correcto de correos no leídos', async () => {
    // Hay 2 correos no leídos en el mock
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que se muestra el badge con el número correcto
    const badge = screen.getByText('2');
    expect(badge).toBeInTheDocument();
    
    // Verificar que el badge tiene el estilo correcto
    const badgeParent = badge.parentElement;
    expect(badgeParent).toHaveClass('bg-red-500');
    expect(badgeParent).toHaveClass('text-white');
  });
  
  it('muestra "9+" cuando hay más de 9 correos no leídos', async () => {
    // Crear mock con más de 9 correos no leídos
    const manyUnreadEmails = Array(12).fill(null).map((_, i) => ({
      id: `email${i}`,
      subject: `Asunto ${i}`,
      read: false
    }));
    
    getMails.mockResolvedValueOnce(manyUnreadEmails);
    
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que se muestra "9+"
    const badge = screen.getByText('9+');
    expect(badge).toBeInTheDocument();
  });
  
  it('no muestra el badge cuando no hay correos no leídos', async () => {
    // Mock sin correos no leídos
    getMails.mockResolvedValueOnce([
      { id: 'email1', subject: 'Asunto 1', read: true },
      { id: 'email2', subject: 'Asunto 2', read: true }
    ]);
    
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que no se muestra ningún badge
    const badgeElements = screen.queryAllByText(/[0-9]+/);
    expect(badgeElements.length).toBe(0);
  });
  
  it('navega a la bandeja de entrada al hacer clic', async () => {
    const user = userEvent.setup();
    
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Hacer clic en el botón
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Verificar que se llamó a navigate con la ruta correcta
    expect(mockNavigate).toHaveBeenCalledWith('/user/email');
  });
  
  it('configura un intervalo para comprobar correos periódicamente', async () => {
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que se configuró el intervalo
    expect(setInterval).toHaveBeenCalled();
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
  });
  
  it('limpia el intervalo al desmontar', async () => {
    let unmount;
    
    await act(async () => {
      const result = render(<EmailNotificationBadge />);
      unmount = result.unmount;
    });
    
    // Simular desmontaje
    unmount();
    
    // Verificar que se limpió el intervalo
    expect(clearInterval).toHaveBeenCalled();
  });
  
  it('maneja errores al obtener correos', async () => {
    // Simular un error al obtener correos
    getMails.mockRejectedValueOnce(new Error('Error al obtener correos'));
    
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que se registró el error
    expect(console.error).toHaveBeenCalled();
    
    // Verificar que no hay badge (valor por defecto: 0)
    const badgeElements = screen.queryAllByText(/[0-9]+/);
    expect(badgeElements.length).toBe(0);
  });
  
  it('tiene el atributo aria-label apropiado para accesibilidad', async () => {
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que el botón tiene el aria-label correcto
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '2 correos sin leer');
  });
  
  it('no realiza comprobaciones si no hay usuario autenticado', async () => {
    // Mock sin usuario
    useAuth.mockReturnValue({ userProfile: null });
    
    await act(async () => {
      render(<EmailNotificationBadge />);
    });
    
    // Verificar que no se llamó al servicio de email
    expect(initEmailService).not.toHaveBeenCalled();
    expect(getMails).not.toHaveBeenCalled();
  });
});
