import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailDetail from '../../../components/email/EmailDetail';

// Mock para FolderSelectionModal y EmailTagsManager
vi.mock('../../../components/email/FolderSelectionModal', () => ({
  default: ({ isOpen, onClose, onSelectFolder }) => 
    isOpen ? (
      <div data-testid="folder-modal">
        <button onClick={() => onSelectFolder('folder-1')}>Seleccionar carpeta</button>
        <button onClick={onClose}>Cerrar</button>
      </div>
    ) : null
}));

vi.mock('../../../components/email/EmailTagsManager', () => ({
  default: () => <div data-testid="email-tags">Gestor de etiquetas</div>
}));

describe('EmailDetail Component', () => {
  // Email de ejemplo para pruebas
  const mockEmail = {
    id: 'email-1',
    subject: 'Asunto de prueba',
    from: 'Remitente Test <remitente@ejemplo.com>',
    to: 'destinatario@ejemplo.com',
    date: '2025-07-10T14:30:00Z',
    body: '<p>Este es un correo de prueba</p>',
    read: true,
    attachments: [
      { filename: 'documento.pdf', size: 1024 * 500 }, // 500KB
      { filename: 'imagen.jpg', size: 1024 * 300 } // 300KB
    ]
  };

  // Funciones mock
  const mockOnBack = vi.fn();
  const mockOnReply = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnMoveToFolder = vi.fn();
  
  const mockFolders = [
    { id: 'folder-1', name: 'Importante' },
    { id: 'folder-2', name: 'Trabajo' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Prueba de renderizado
  it('renderiza correctamente los detalles del email', () => {
    render(
      <EmailDetail 
        email={mockEmail} 
        onBack={mockOnBack}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
        onMoveToFolder={mockOnMoveToFolder}
        folders={mockFolders}
      />
    );

    // Verificar elementos principales
    expect(screen.getByText('Asunto de prueba')).toBeInTheDocument();
    expect(screen.getByText('Remitente Test')).toBeInTheDocument();
    expect(screen.getByText('remitente@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByText('destinatario@ejemplo.com')).toBeInTheDocument();
    
    // Verificar que el cuerpo del email se renderiza correctamente
    expect(screen.getByText('Este es un correo de prueba')).toBeInTheDocument();
    
    // Verificar que los adjuntos están presentes
    expect(screen.getByText('documento.pdf')).toBeInTheDocument();
    expect(screen.getByText('imagen.jpg')).toBeInTheDocument();
    expect(screen.getAllByText(/KB/i)).toHaveLength(2);
  });

  // Prueba de interacción con botones
  it('llama a las funciones correspondientes al hacer clic en los botones', () => {
    render(
      <EmailDetail 
        email={mockEmail} 
        onBack={mockOnBack}
        onReply={mockOnReply}
        onDelete={mockOnDelete}
        onMoveToFolder={mockOnMoveToFolder}
        folders={mockFolders}
      />
    );

    // Botón de volver
    const backButton = screen.getByRole('button', { name: /volver/i });
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    
    // Botón de responder
    const replyButton = screen.getByRole('button', { name: /responder/i });
    fireEvent.click(replyButton);
    expect(mockOnReply).toHaveBeenCalledTimes(1);
    
    // Botón de eliminar
    const deleteButton = screen.getByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  // Prueba de navegación por teclado
  it('permite navegación por teclado', () => {
    render(
      <EmailDetail 
        email={mockEmail} 
        onBack={mockOnBack}
        onReply={mockOnReply}
        folders={mockFolders}
      />
    );

    // Simular presionar ESC para volver
    const emailDetailElement = screen.getByRole('region');
    fireEvent.keyDown(emailDetailElement, { key: 'Escape' });
    expect(mockOnBack).toHaveBeenCalledTimes(1);
    
    // Simular presionar 'r' para responder
    fireEvent.keyDown(emailDetailElement, { key: 'r' });
    expect(mockOnReply).toHaveBeenCalledTimes(1);
  });

  // Prueba del modal de selección de carpetas
  it('abre el modal de carpetas y maneja la selección correctamente', async () => {
    render(
      <EmailDetail 
        email={mockEmail} 
        onBack={mockOnBack}
        onMoveToFolder={mockOnMoveToFolder}
        folders={mockFolders}
      />
    );
    
    // Abrir modal
    const moveToFolderButton = screen.getByRole('button', { name: /mover a carpeta/i });
    fireEvent.click(moveToFolderButton);
    
    // Verificar que el modal está abierto
    expect(screen.getByTestId('folder-modal')).toBeInTheDocument();
    
    // Seleccionar una carpeta
    const selectFolderButton = screen.getByRole('button', { name: /seleccionar carpeta/i });
    fireEvent.click(selectFolderButton);
    
    // Verificar que la función onMoveToFolder se llamó con los parámetros correctos
    expect(mockOnMoveToFolder).toHaveBeenCalledWith('email-1', 'folder-1');
  });

  // Prueba de accesibilidad
  it('tiene atributos ARIA apropiados para accesibilidad', () => {
    render(
      <EmailDetail 
        email={mockEmail} 
        onBack={mockOnBack}
        folders={mockFolders}
      />
    );
    
    // Verificar que el componente principal tiene roles y etiquetas ARIA
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Detalle del correo electrónico');
    
    // Verificar que el contenido principal es enfocable
    const mainContent = screen.getByRole('article');
    expect(mainContent).toHaveAttribute('tabindex', '0');
    
    // Verificar estructura semántica
    expect(screen.getByRole('header')).toBeInTheDocument();
    expect(mainContent).toBeInTheDocument();
    
    // Verificar que los archivos adjuntos tienen estructura accesible
    if (mockEmail.attachments.length > 0) {
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(mockEmail.attachments.length);
    }
  });

  // Prueba con email sin asunto o sin adjuntos
  it('maneja correctamente emails sin asunto o sin adjuntos', () => {
    const emailSinAsunto = {
      ...mockEmail,
      subject: '',
      attachments: []
    };
    
    render(
      <EmailDetail 
        email={emailSinAsunto} 
        onBack={mockOnBack}
      />
    );
    
    expect(screen.getByText('(Sin asunto)')).toBeInTheDocument();
    expect(screen.queryByText(/adjuntos/i)).not.toBeInTheDocument();
  });
});
