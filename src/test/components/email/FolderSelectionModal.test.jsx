import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FolderSelectionModal from '../../../components/email/FolderSelectionModal';
import userEvent from '@testing-library/user-event';

// Mock para el componente Button que se usa dentro del modal
vi.mock('../../../components/Button', () => ({
  default: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

describe('FolderSelectionModal Component', () => {
  // Carpetas de ejemplo para pruebas
  const mockFolders = [
    { id: 'folder-1', name: 'Importante' },
    { id: 'folder-2', name: 'Trabajo' },
    { id: 'folder-3', name: 'Personal' },
  ];

  // Funciones mock
  const mockOnClose = vi.fn();
  const mockOnSelectFolder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Prueba si el modal no renderiza nada cuando isOpen es falso
  it('no renderiza nada cuando isOpen es falso', () => {
    const { container } = render(
      <FolderSelectionModal
        isOpen={false}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  // Prueba de renderizado básico
  it('renderiza correctamente cuando isOpen es verdadero', () => {
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
        title="Título de prueba"
        description="Descripción de prueba"
      />
    );

    // Verificar elementos principales
    expect(screen.getByText('Título de prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar carpetas/i)).toBeInTheDocument();
    
    // Verificar que todas las carpetas se renderizan
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  // Prueba de búsqueda de carpetas
  it('filtra correctamente las carpetas según el término de búsqueda', async () => {
    const user = userEvent.setup();
    
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    // Buscar una carpeta específica
    const searchInput = screen.getByPlaceholderText(/buscar carpetas/i);
    await user.type(searchInput, 'Trabajo');
    
    // Verificar que solo se muestra la carpeta buscada
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.queryByText('Importante')).not.toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
    
    // Limpiar la búsqueda y verificar que todas las carpetas vuelven a aparecer
    await user.clear(searchInput);
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  // Prueba de navegación por teclado
  it('permite navegación por teclado entre las carpetas', async () => {
    const user = userEvent.setup();
    
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    // El input de búsqueda debería estar enfocado inicialmente
    expect(screen.getByPlaceholderText(/buscar carpetas/i)).toHaveFocus();
    
    // Presionar Tab para mover el foco a la lista de carpetas
    await user.tab();
    
    // Presionar flecha abajo para navegar por las carpetas
    const modalElement = screen.getByRole('dialog');
    fireEvent.keyDown(modalElement, { key: 'ArrowDown' });
    fireEvent.keyDown(modalElement, { key: 'ArrowDown' });
    
    // Presionar Enter para seleccionar una carpeta
    fireEvent.keyDown(document.activeElement, { key: 'Enter' });
    expect(mockOnSelectFolder).toHaveBeenCalled();
  });

  // Prueba de cierre del modal
  it('cierra el modal cuando se hace clic en el botón de cerrar', () => {
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    const closeButton = screen.getByLabelText(/cerrar diálogo/i);
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Prueba de selección de carpeta
  it('llama a onSelectFolder con el ID correcto al seleccionar una carpeta', () => {
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    // Hacer clic en la primera carpeta
    const firstFolder = screen.getByText('Importante').closest('div');
    fireEvent.click(firstFolder);
    expect(mockOnSelectFolder).toHaveBeenCalledWith('folder-1');
  });

  // Prueba de accesibilidad
  it('tiene los atributos ARIA apropiados para accesibilidad', () => {
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={mockFolders}
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    // Verificar los atributos ARIA del modal
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'folder-modal-title');
    
    // Verificar atributos de la lista
    const list = screen.getByRole('listbox');
    expect(list).toHaveAttribute('id', 'folder-list');
    
    // Verificar atributos de los elementos de la lista
    const folderItems = screen.getAllByRole('option');
    expect(folderItems).toHaveLength(3);
    expect(folderItems[0]).toHaveAttribute('aria-selected');
  });

  // Prueba de mensaje cuando no hay carpetas
  it('muestra un mensaje apropiado cuando no hay carpetas disponibles', () => {
    render(
      <FolderSelectionModal
        isOpen={true}
        onClose={mockOnClose}
        folders={[]} // Sin carpetas
        onSelectFolder={mockOnSelectFolder}
      />
    );
    
    expect(screen.getByText('No hay carpetas disponibles')).toBeInTheDocument();
  });
});
