import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagsManager from '../../components/email/TagsManager';
import { useAuth } from '../../hooks/useAuth';
import * as tagService from '../../services/tagService';
import { toast } from 'react-toastify';

// Mock de los módulos necesarios
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/tagService', () => ({
  getUserTags: vi.fn(),
  getCustomTags: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  SYSTEM_TAGS: [
    { id: 'system1', name: 'Importante', color: '#e53e3e' },
    { id: 'system2', name: 'Trabajo', color: '#3182ce' }
  ]
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock para los componentes de Lucide React
vi.mock('lucide-react', () => ({
  Tag: () => <div data-testid="icon-tag">Tag Icon</div>,
  Plus: () => <div data-testid="icon-plus">Plus Icon</div>,
  Edit: () => <div data-testid="icon-edit">Edit Icon</div>,
  Trash: () => <div data-testid="icon-trash">Trash Icon</div>,
  X: () => <div data-testid="icon-x">X Icon</div>,
  Check: () => <div data-testid="icon-check">Check Icon</div>,
  Circle: () => <div data-testid="icon-circle">Circle Icon</div>
}));

// Mock para el componente Button
vi.mock('../../components/Button', () => ({
  default: ({ children, onClick, disabled }) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid="button-mock"
    >
      {children}
    </button>
  )
}));

describe('TagsManager', () => {
  // Datos de prueba
  const mockCurrentUser = { uid: 'user123' };
  const mockCustomTags = [
    { id: 'tag1', name: 'Personal', color: '#d53f8c' },
    { id: 'tag2', name: 'Familia', color: '#38a169' }
  ];
  
  // Mock global del método confirm
  const originalConfirm = window.confirm;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuración por defecto de los mocks
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser
    });
    
    tagService.getCustomTags.mockReturnValue(mockCustomTags);
    
    // Mock del confirm para pruebas de eliminación
    window.confirm = vi.fn();
  });
  
  afterEach(() => {
    // Restaurar el método original confirm
    window.confirm = originalConfirm;
  });
  
  it('renderiza correctamente las etiquetas del sistema y personalizadas', () => {
    render(<TagsManager />);
    
    // Verificar que se muestran las etiquetas del sistema
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getAllByText('Predefinida')).toHaveLength(2);
    
    // Verificar que se muestran las etiquetas personalizadas
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Familia')).toBeInTheDocument();
    
    // Verificar que se llamó a la función para obtener etiquetas personalizadas
    expect(tagService.getCustomTags).toHaveBeenCalledWith(mockCurrentUser.uid);
  });
  
  it('muestra el botón para crear nuevas etiquetas', () => {
    render(<TagsManager />);
    
    // Verificar que se muestra el botón para crear etiquetas
    expect(screen.getByText('Nueva etiqueta')).toBeInTheDocument();
  });
  
  it('muestra el formulario de creación al hacer clic en el botón "Nueva etiqueta"', async () => {
    const user = userEvent.setup();
    render(<TagsManager />);
    
    // Hacer clic en el botón para crear etiqueta
    await user.click(screen.getByText('Nueva etiqueta'));
    
    // Verificar que se muestra el formulario
    expect(screen.getByPlaceholderText('Nombre de la etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByText('Crear etiqueta')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });
  
  it('oculta el formulario al hacer clic en "Cancelar"', async () => {
    const user = userEvent.setup();
    render(<TagsManager />);
    
    // Mostrar formulario
    await user.click(screen.getByText('Nueva etiqueta'));
    expect(screen.getByPlaceholderText('Nombre de la etiqueta')).toBeInTheDocument();
    
    // Ocultar formulario
    await user.click(screen.getByText('Cancelar'));
    expect(screen.queryByPlaceholderText('Nombre de la etiqueta')).not.toBeInTheDocument();
  });
  
  it('permite seleccionar un color para la etiqueta', async () => {
    const user = userEvent.setup();
    render(<TagsManager />);
    
    // Mostrar formulario
    await user.click(screen.getByText('Nueva etiqueta'));
    
    // Verificar que hay opciones de color (9 colores según el componente)
    const colorOptions = screen.getAllByTestId('icon-check');
    expect(colorOptions.length).toBeGreaterThan(0);
    
    // Hacer clic en una opción de color
    const colorElements = screen.getAllByRole('button');
    // Encontramos un elemento de color que no sea el botón principal
    const colorElement = colorElements.find(el => 
      !el.textContent.includes('Nueva etiqueta') && 
      !el.textContent.includes('Crear etiqueta') &&
      !el.textContent.includes('Cancelar')
    );
    
    if (colorElement) {
      await user.click(colorElement);
    }
  });
  
  it('crea una nueva etiqueta al enviar el formulario', async () => {
    const user = userEvent.setup();
    render(<TagsManager />);
    
    // Mostrar formulario
    await user.click(screen.getByText('Nueva etiqueta'));
    
    // Ingresar nombre de etiqueta
    const nameInput = screen.getByPlaceholderText('Nombre de la etiqueta');
    await user.type(nameInput, 'Nueva Etiqueta');
    
    // Crear etiqueta
    await user.click(screen.getByText('Crear etiqueta'));
    
    // Verificar que se llamó a la función para crear etiqueta
    expect(tagService.createTag).toHaveBeenCalledWith(
      mockCurrentUser.uid,
      'Nueva Etiqueta',
      expect.any(String) // El color podría ser cualquier string
    );
    
    // Verificar que se mostró un mensaje de éxito
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Nueva Etiqueta'));
    
    // Verificar que el formulario se ocultó
    expect(screen.queryByPlaceholderText('Nombre de la etiqueta')).not.toBeInTheDocument();
  });
  
  it('no crea etiquetas con nombre vacío', async () => {
    const user = userEvent.setup();
    render(<TagsManager />);
    
    // Mostrar formulario
    await user.click(screen.getByText('Nueva etiqueta'));
    
    // El botón de crear debería estar deshabilitado
    expect(screen.getByText('Crear etiqueta').closest('button')).toBeDisabled();
    
    // Intentar crear sin nombre
    await user.click(screen.getByText('Crear etiqueta'));
    
    // Verificar que no se llamó a la función para crear etiqueta
    expect(tagService.createTag).not.toHaveBeenCalled();
  });
  
  it('elimina una etiqueta existente cuando se confirma', async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(true); // Simular que el usuario confirma
    
    render(<TagsManager />);
    
    // Encontrar y hacer clic en el botón de eliminar de la primera etiqueta
    const deleteButtons = screen.getAllByTestId('icon-trash');
    await user.click(deleteButtons[0].closest('button'));
    
    // Verificar que se mostró el cuadro de diálogo de confirmación
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Personal'));
    
    // Verificar que se llamó a la función para eliminar etiqueta
    expect(tagService.deleteTag).toHaveBeenCalledWith(mockCurrentUser.uid, 'tag1');
    
    // Verificar que se mostró un mensaje de éxito
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Personal'));
  });
  
  it('no elimina una etiqueta cuando se cancela la confirmación', async () => {
    const user = userEvent.setup();
    window.confirm.mockReturnValue(false); // Simular que el usuario cancela
    
    render(<TagsManager />);
    
    // Encontrar y hacer clic en el botón de eliminar de la primera etiqueta
    const deleteButtons = screen.getAllByTestId('icon-trash');
    await user.click(deleteButtons[0].closest('button'));
    
    // Verificar que se mostró el cuadro de diálogo de confirmación
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Personal'));
    
    // Verificar que NO se llamó a la función para eliminar etiqueta
    expect(tagService.deleteTag).not.toHaveBeenCalled();
  });
  
  it('muestra mensaje cuando no hay etiquetas personalizadas', () => {
    // Simular que no hay etiquetas personalizadas
    tagService.getCustomTags.mockReturnValue([]);
    
    render(<TagsManager />);
    
    // Verificar que se muestra el mensaje de que no hay etiquetas
    expect(screen.getByText('No has creado etiquetas personalizadas')).toBeInTheDocument();
  });
  
  it('maneja errores al crear una etiqueta', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Error al crear etiqueta');
    
    // Simular un error al crear etiqueta
    tagService.createTag.mockImplementation(() => {
      throw mockError;
    });
    
    render(<TagsManager />);
    
    // Mostrar formulario
    await user.click(screen.getByText('Nueva etiqueta'));
    
    // Ingresar nombre de etiqueta
    const nameInput = screen.getByPlaceholderText('Nombre de la etiqueta');
    await user.type(nameInput, 'Nueva Etiqueta');
    
    // Intentar crear etiqueta
    await user.click(screen.getByText('Crear etiqueta'));
    
    // Verificar que se mostró un mensaje de error
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error'));
  });
  
  it('maneja errores al eliminar una etiqueta', async () => {
    const user = userEvent.setup();
    const mockError = new Error('Error al eliminar etiqueta');
    window.confirm.mockReturnValue(true); // Simular que el usuario confirma
    
    // Simular un error al eliminar etiqueta
    tagService.deleteTag.mockImplementation(() => {
      throw mockError;
    });
    
    render(<TagsManager />);
    
    // Encontrar y hacer clic en el botón de eliminar de la primera etiqueta
    const deleteButtons = screen.getAllByTestId('icon-trash');
    await user.click(deleteButtons[0].closest('button'));
    
    // Verificar que se mostró un mensaje de error
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Error'));
  });
  
  it('no realiza operaciones si no hay usuario autenticado', () => {
    // Simular que no hay usuario
    useAuth.mockReturnValue({
      currentUser: null
    });
    
    render(<TagsManager />);
    
    // Verificar que no se llamaron a las funciones que dependen del usuario
    expect(tagService.getCustomTags).not.toHaveBeenCalled();
  });
});
