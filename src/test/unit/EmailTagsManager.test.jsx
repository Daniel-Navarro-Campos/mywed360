import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailTagsManager from '../../components/email/EmailTagsManager';
import { useAuth } from '../../hooks/useAuth';
import * as tagService from '../../services/tagService';

// Mock de los módulos necesarios
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/tagService', () => ({
  getUserTags: vi.fn(),
  getEmailTagsDetails: vi.fn(),
  addTagToEmail: vi.fn(),
  removeTagFromEmail: vi.fn()
}));

// Mock para los componentes de Lucide React
vi.mock('lucide-react', () => ({
  Tag: () => <div data-testid="icon-tag">Tag Icon</div>,
  X: () => <div data-testid="icon-x">X Icon</div>,
  Plus: () => <div data-testid="icon-plus">Plus Icon</div>,
  Check: () => <div data-testid="icon-check">Check Icon</div>
}));

// Mock para el componente Button
vi.mock('../../components/Button', () => ({
  default: ({ children, onClick }) => (
    <button onClick={onClick} data-testid="button-mock">{children}</button>
  )
}));

describe('EmailTagsManager', () => {
  // Datos de prueba
  const mockEmailId = 'email123';
  const mockCurrentUser = { uid: 'user123' };
  const mockOnTagsChange = vi.fn();
  
  const mockTags = [
    { id: 'tag1', name: 'Importante', color: '#FF0000' },
    { id: 'tag2', name: 'Personal', color: '#00FF00' }
  ];
  
  const mockAllTags = [
    ...mockTags,
    { id: 'tag3', name: 'Trabajo', color: '#0000FF' },
    { id: 'tag4', name: 'Familia', color: '#FFA500' }
  ];
  
  // Props por defecto
  const defaultProps = {
    emailId: mockEmailId,
    onTagsChange: mockOnTagsChange
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuración por defecto de los mocks
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser
    });
    
    tagService.getUserTags.mockReturnValue(mockAllTags);
    tagService.getEmailTagsDetails.mockReturnValue(mockTags);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('renderiza correctamente las etiquetas actuales del correo', () => {
    render(<EmailTagsManager {...defaultProps} />);
    
    // Verificar que se muestran las etiquetas
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    
    // Verificar que se llamó a las funciones apropiadas
    expect(tagService.getUserTags).toHaveBeenCalledWith(mockCurrentUser.uid);
    expect(tagService.getEmailTagsDetails).toHaveBeenCalledWith(mockCurrentUser.uid, mockEmailId);
  });
  
  it('muestra el botón para añadir etiquetas', () => {
    render(<EmailTagsManager {...defaultProps} />);
    
    // Verificar que se muestra el botón de añadir
    const addButton = screen.getByText('Añadir etiqueta');
    expect(addButton).toBeInTheDocument();
  });
  
  it('muestra el selector de etiquetas al hacer clic en "Añadir etiqueta"', async () => {
    const user = userEvent.setup();
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Hacer clic en el botón de añadir etiqueta
    await user.click(screen.getByText('Añadir etiqueta'));
    
    // Verificar que se muestra el selector con las etiquetas disponibles (las que no están ya asignadas)
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Familia')).toBeInTheDocument();
    
    // Verificar que no aparecen las etiquetas ya asignadas
    const etiquetasRepetidas = screen.getAllByText('Importante');
    expect(etiquetasRepetidas.length).toBe(1); // Solo aparece una vez (la ya asignada)
  });
  
  it('permite añadir una nueva etiqueta', async () => {
    const user = userEvent.setup();
    
    // Simular que se actualiza la lista de etiquetas después de añadir
    const updatedTags = [
      ...mockTags,
      { id: 'tag3', name: 'Trabajo', color: '#0000FF' }
    ];
    
    tagService.getEmailTagsDetails.mockImplementation((uid, emailId) => {
      // La primera vez devuelve las etiquetas iniciales, luego las actualizadas
      if (tagService.addTagToEmail.mock.calls.length > 0) {
        return updatedTags;
      }
      return mockTags;
    });
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Abrir selector de etiquetas
    await user.click(screen.getByText('Añadir etiqueta'));
    
    // Añadir la etiqueta "Trabajo"
    await user.click(screen.getByText('Trabajo'));
    
    // Verificar que se llamó a la función para añadir etiqueta
    expect(tagService.addTagToEmail).toHaveBeenCalledWith(mockCurrentUser.uid, mockEmailId, 'tag3');
    
    // Verificar que se llamó al callback onTagsChange con las etiquetas actualizadas
    expect(mockOnTagsChange).toHaveBeenCalledWith(updatedTags);
    
    // Verificar que se obtuvo la lista actualizada de etiquetas
    expect(getEmailTagsDetails).toHaveBeenCalledTimes(2);
  });
  
  it('permite eliminar una etiqueta', async () => {
    const user = userEvent.setup();
    
    // Simular que se actualiza la lista de etiquetas después de eliminar
    const updatedTags = [mockTags[1]]; // Solo queda la segunda etiqueta
    
    tagService.getEmailTagsDetails.mockImplementation((uid, emailId) => {
      // La primera vez devuelve las etiquetas iniciales, luego las actualizadas
      if (tagService.removeTagFromEmail.mock.calls.length > 0) {
        return updatedTags;
      }
      return mockTags;
    });
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Buscar botones de eliminar (X) y hacer clic en el primero
    const removeButtons = screen.getAllByRole('button');
    const firstRemoveButton = removeButtons.find(button => button.innerHTML.includes('X'));
    
    await user.click(firstRemoveButton);
    
    // Verificar que se llamó a la función para eliminar etiqueta
    expect(tagService.removeTagFromEmail).toHaveBeenCalledWith(mockCurrentUser.uid, mockEmailId, expect.any(String));
    
    // Verificar que se llamó al callback onTagsChange con las etiquetas actualizadas
    expect(mockOnTagsChange).toHaveBeenCalledWith(updatedTags);
    
    // Verificar que se obtuvo la lista actualizada de etiquetas
    expect(tagService.getEmailTagsDetails).toHaveBeenCalledTimes(2);
  });
  
  it('muestra mensaje cuando no hay más etiquetas disponibles para añadir', async () => {
    const user = userEvent.setup();
    
    // Simular que todas las etiquetas ya están asignadas
    tagService.getUserTags.mockReturnValue(mockTags);
    tagService.getEmailTagsDetails.mockReturnValue(mockTags);
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Abrir selector de etiquetas
    await user.click(screen.getByText('Añadir etiqueta'));
    
    // Verificar que se muestra el mensaje de no hay más etiquetas
    expect(screen.getByText('No hay más etiquetas disponibles')).toBeInTheDocument();
  });
  
  it('cierra el selector de etiquetas al hacer clic en "Cancelar"', async () => {
    const user = userEvent.setup();
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Abrir selector de etiquetas
    await user.click(screen.getByText('Añadir etiqueta'));
    
    // Verificar que se muestra el selector
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    
    // Cerrar el selector
    await user.click(screen.getByText('Cancelar'));
    
    // Verificar que el selector ya no está visible
    expect(screen.queryByText('Trabajo')).not.toBeInTheDocument();
  });
  
  it('no realiza operaciones si no hay usuario autenticado', () => {
    // Simular que no hay usuario autenticado
    useAuth.mockReturnValue({ currentUser: null });
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Verificar que no se llamaron a las funciones que dependen del usuario
    expect(tagService.getUserTags).not.toHaveBeenCalled();
    expect(tagService.getEmailTagsDetails).not.toHaveBeenCalled();
  });
  
  it('no realiza operaciones si no hay ID de correo', () => {
    render(<EmailTagsManager emailId={null} onTagsChange={mockOnTagsChange} />);
    
    // Verificar que no se llamaron a las funciones que dependen del ID de correo
    expect(tagService.getUserTags).not.toHaveBeenCalled();
    expect(tagService.getEmailTagsDetails).not.toHaveBeenCalled();
  });
  
  it('maneja errores al añadir una etiqueta', async () => {
    const user = userEvent.setup();
    
    // Simular un error al añadir etiqueta
    const mockError = new Error('Error al añadir etiqueta');
    tagService.addTagToEmail.mockImplementationOnce(() => {
      throw mockError;
    });
    
    // Espiar console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Abrir selector de etiquetas
    await user.click(screen.getByText('Añadir etiqueta'));
    
    // Intentar añadir una etiqueta
    await user.click(screen.getByText('Trabajo'));
    
    // Verificar que se registró el error
    expect(consoleSpy).toHaveBeenCalledWith('Error al añadir etiqueta:', mockError);
    
    // Verificar que no se llamó al callback onTagsChange
    expect(mockOnTagsChange).not.toHaveBeenCalled();
    
    // Restaurar console.error
    consoleSpy.mockRestore();
  });
  
  it('maneja errores al quitar una etiqueta', async () => {
    const user = userEvent.setup();
    
    // Simular un error al quitar etiqueta
    const mockError = new Error('Error al quitar etiqueta');
    tagService.removeTagFromEmail.mockImplementationOnce(() => {
      throw mockError;
    });
    
    // Espiar console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<EmailTagsManager {...defaultProps} />);
    
    // Buscar botones de eliminar (X) y hacer clic en el primero
    const removeButtons = screen.getAllByRole('button');
    const firstRemoveButton = removeButtons.find(button => button.innerHTML.includes('X'));
    
    await user.click(firstRemoveButton);
    
    // Verificar que se registró el error
    expect(consoleSpy).toHaveBeenCalledWith('Error al quitar etiqueta:', mockError);
    
    // Verificar que no se llamó al callback onTagsChange
    expect(mockOnTagsChange).not.toHaveBeenCalled();
    
    // Restaurar console.error
    consoleSpy.mockRestore();
  });
  
  it('aplica los estilos de color correctamente a las etiquetas', () => {
    render(<EmailTagsManager {...defaultProps} />);
    
    // Buscar contenedores de etiquetas
    const tagElements = screen.getAllByText(/Importante|Personal/);
    
    // Verificar los estilos para cada etiqueta (mirando su elemento padre)
    tagElements.forEach(tagElement => {
      const container = tagElement.closest('div');
      const tag = mockTags.find(tag => tag.name === tagElement.textContent);
      
      if (tag && container) {
        expect(container.style.backgroundColor).toBe(`${tag.color}20`);
        expect(container.style.color).toBe(tag.color);
        expect(container.style.borderColor).toBe(`${tag.color}50`);
      }
    });
  });
});
