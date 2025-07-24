import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderSelectionModal from '../../components/email/FolderSelectionModal';

describe('FolderSelectionModal', () => {
  // Datos de prueba
  const mockFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true },
    { id: 'work', name: 'Trabajo', system: false },
    { id: 'personal', name: 'Personal', system: false }
  ];
  
  // Props por defecto
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    folders: mockFolders,
    onSelectFolder: vi.fn(),
    title: 'Mover a carpeta',
    description: 'Selecciona una carpeta para mover el correo'
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <FolderSelectionModal {...defaultProps} isOpen={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('renderiza correctamente cuando está abierto', () => {
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Verificar elementos principales
    expect(screen.getByText('Mover a carpeta')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una carpeta para mover el correo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar carpetas...')).toBeInTheDocument();
    
    // Verificar que se muestran todas las carpetas
    mockFolders.forEach(folder => {
      expect(screen.getByText(folder.name)).toBeInTheDocument();
    });
  });
  
  it('llama a onClose cuando se hace clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    await user.click(screen.getByLabelText('Cerrar'));
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('filtra correctamente las carpetas al buscar', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar carpetas...');
    
    // Buscar "trabajo"
    await user.type(searchInput, 'trabajo');
    
    // Solo debería mostrar la carpeta "Trabajo"
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.queryByText('Bandeja de entrada')).not.toBeInTheDocument();
    expect(screen.queryByText('Enviados')).not.toBeInTheDocument();
    
    // Limpiar búsqueda
    await user.clear(searchInput);
    
    // Deberían mostrarse todas las carpetas de nuevo
    mockFolders.forEach(folder => {
      expect(screen.getByText(folder.name)).toBeInTheDocument();
    });
  });
  
  it('llama a onSelectFolder con la carpeta correcta al hacer clic', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Hacer clic en la carpeta "Trabajo"
    await user.click(screen.getByText('Trabajo'));
    
    // Verificar que se llamó a onSelectFolder con la carpeta correcta
    expect(defaultProps.onSelectFolder).toHaveBeenCalledWith(mockFolders[3]);
    
    // Verificar que se llamó a onClose
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
  
  it('muestra mensaje cuando no hay resultados de búsqueda', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar carpetas...');
    
    // Buscar algo que no existe
    await user.type(searchInput, 'carpetainexistente');
    
    // Debería mostrar mensaje de no resultados
    expect(screen.getByText('No se encontraron carpetas')).toBeInTheDocument();
  });
  
  it('soporta navegación con teclado en la lista de carpetas', async () => {
    render(<FolderSelectionModal {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar carpetas...');
    
    // Simular navegación con teclado
    fireEvent.focus(searchInput);
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    
    // Verificar que el primer elemento recibe el foco
    const folderItems = screen.getAllByRole('button', { name: /Mover a/i });
    expect(document.activeElement).toBe(folderItems[0]);
    
    // Navegar hacia abajo
    fireEvent.keyDown(folderItems[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(folderItems[1]);
    
    // Navegar hacia arriba
    fireEvent.keyDown(folderItems[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(folderItems[0]);
    
    // Seleccionar con Enter
    fireEvent.keyDown(folderItems[0], { key: 'Enter' });
    expect(defaultProps.onSelectFolder).toHaveBeenCalled();
  });
  
  it('cierra el modal al presionar ESC', () => {
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Simular presionar ESC
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
  
  it('mantiene foco dentro del modal (trampa de foco)', async () => {
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Los elementos focusables deben ser: botón cerrar, input búsqueda, carpetas, botón crear
    const closeButton = screen.getByLabelText('Cerrar');
    const searchInput = screen.getByPlaceholderText('Buscar carpetas...');
    const createButton = screen.getByText('Crear carpeta');
    
    // Verificar que el input de búsqueda recibe el foco inicialmente
    await waitFor(() => {
      expect(document.activeElement).toBe(searchInput);
    });
    
    // Verificar que el foco se mueve correctamente al tabular
    fireEvent.keyDown(searchInput, { key: 'Tab' });
    // El siguiente elemento serían las carpetas...
    
    // Simular llegar al último elemento y tabular
    fireEvent.focus(createButton);
    fireEvent.keyDown(createButton, { key: 'Tab' });
    
    // El foco debería volver al primer elemento (botón cerrar)
    expect(document.activeElement).toBe(closeButton);
  });
  
  it('muestra el formulario de creación al hacer clic en "Crear carpeta"', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Hacer clic en "Crear carpeta"
    await user.click(screen.getByText('Crear carpeta'));
    
    // Verificar que aparece el formulario
    expect(screen.getByPlaceholderText('Nombre de la carpeta')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });
  
  it('vuelve a la vista de carpetas al cancelar la creación', async () => {
    const user = userEvent.setup();
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Abrir formulario de creación
    await user.click(screen.getByText('Crear carpeta'));
    
    // Cancelar la creación
    await user.click(screen.getByText('Cancelar'));
    
    // Verificar que vuelve a la vista de carpetas
    expect(screen.getByPlaceholderText('Buscar carpetas...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nombre de la carpeta')).not.toBeInTheDocument();
  });
  
  it('proporciona atributos de accesibilidad apropiados', () => {
    render(<FolderSelectionModal {...defaultProps} />);
    
    // Verificar el rol de diálogo y atributos ARIA
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
    
    // Verificar que el título e instrucciones están conectados correctamente
    const titleId = dialog.getAttribute('aria-labelledby');
    const descriptionId = dialog.getAttribute('aria-describedby');
    
    expect(screen.getByText('Mover a carpeta').id).toBe(titleId);
    expect(screen.getByText('Selecciona una carpeta para mover el correo').id).toBe(descriptionId);
    
    // Verificar que los botones de carpeta tienen roles y etiquetas adecuadas
    const folderButtons = screen.getAllByRole('button', { name: /Mover a/i });
    folderButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
