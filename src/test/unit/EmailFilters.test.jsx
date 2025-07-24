import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailFilters from '../../components/email/EmailFilters';

describe('EmailFilters', () => {
  // Props comunes para las pruebas
  const onApplyFiltersMock = vi.fn();
  const onResetFiltersMock = vi.fn();
  
  // Configuración inicial para cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renderiza correctamente en estado colapsado', () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Verificar que se muestra el título
    expect(screen.getByText('Filtros avanzados')).toBeInTheDocument();
    
    // Verificar que está colapsado (los filtros no son visibles)
    expect(screen.queryByText('De (Remitente)')).not.toBeInTheDocument();
    expect(screen.queryByText('Para (Destinatario)')).not.toBeInTheDocument();
  });
  
  it('expande y colapsa el panel de filtros al hacer clic en la cabecera', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Verificar que inicialmente está colapsado
    expect(screen.queryByText('De (Remitente)')).not.toBeInTheDocument();
    
    // Hacer clic para expandir
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Verificar que se muestra el contenido
    expect(screen.getByText('De (Remitente)')).toBeInTheDocument();
    expect(screen.getByText('Para (Destinatario)')).toBeInTheDocument();
    
    // Hacer clic para colapsar de nuevo
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Verificar que el contenido ya no es visible
    await waitFor(() => {
      expect(screen.queryByText('De (Remitente)')).not.toBeInTheDocument();
    });
  });
  
  it('aplica los filtros cuando se hace clic en el botón "Aplicar filtros"', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Llenar algunos campos de filtro
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('De (Remitente)'), 'remitente@ejemplo.com');
    await user.type(screen.getByLabelText('Asunto contiene'), 'presupuesto');
    
    // Marcar la casilla "Solo no leídos"
    fireEvent.click(screen.getByLabelText('Solo no leídos'));
    
    // Hacer clic en el botón de aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó a la función con los filtros correctos
    expect(onApplyFiltersMock).toHaveBeenCalledWith(expect.objectContaining({
      from: 'remitente@ejemplo.com',
      subject: 'presupuesto',
      isUnread: true
    }));
  });
  
  it('limpia todos los filtros cuando se hace clic en "Limpiar filtros"', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Llenar algunos campos de filtro
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('De (Remitente)'), 'remitente@ejemplo.com');
    await user.type(screen.getByLabelText('Asunto contiene'), 'presupuesto');
    
    // Marcar la casilla "Solo no leídos"
    fireEvent.click(screen.getByLabelText('Solo no leídos'));
    
    // Hacer clic en el botón de limpiar filtros
    fireEvent.click(screen.getByText('Limpiar filtros'));
    
    // Verificar que se llamó a la función de reseteo
    expect(onResetFiltersMock).toHaveBeenCalled();
    
    // Verificar que los campos se limpiaron
    expect(screen.getByLabelText('De (Remitente)')).toHaveValue('');
    expect(screen.getByLabelText('Asunto contiene')).toHaveValue('');
    expect(screen.getByLabelText('Solo no leídos')).not.toBeChecked();
  });
  
  it('permite seleccionar y deseleccionar etiquetas', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Verificar que todas las etiquetas están presentes
    expect(screen.getByText('Importante')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    
    // Seleccionar una etiqueta
    fireEvent.click(screen.getByText('Importante'));
    
    // Aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó con la etiqueta seleccionada
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining(['important'])
      })
    );
    
    // Deseleccionar la etiqueta
    fireEvent.click(screen.getByText('Importante'));
    
    // Aplicar filtros de nuevo
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que ahora no hay etiquetas seleccionadas
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: []
      })
    );
  });
  
  it('carga filtros iniciales correctamente', () => {
    // Filtros iniciales para la prueba
    const initialFilters = {
      from: 'inicial@ejemplo.com',
      subject: 'tema inicial',
      isUnread: true,
      labels: ['important', 'work']
    };
    
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock}
        initialFilters={initialFilters}
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Verificar que los campos tienen los valores iniciales
    expect(screen.getByLabelText('De (Remitente)')).toHaveValue('inicial@ejemplo.com');
    expect(screen.getByLabelText('Asunto contiene')).toHaveValue('tema inicial');
    expect(screen.getByLabelText('Solo no leídos')).toBeChecked();
    
    // Verificar estado visual de las etiquetas (comprobamos solo una por simplicidad)
    const importanteLabel = screen.getByText('Importante');
    expect(importanteLabel.parentElement).toHaveClass('bg-red-500');
    
    const trabajoLabel = screen.getByText('Trabajo');
    expect(trabajoLabel.parentElement).toHaveClass('bg-blue-500');
  });
  
  it('maneja correctamente cambios en los campos de texto', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Cambiar valor de un campo
    const user = userEvent.setup();
    const fromInput = screen.getByLabelText('De (Remitente)');
    await user.type(fromInput, 'nuevo@ejemplo.com');
    
    // Aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó con el valor actualizado
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'nuevo@ejemplo.com'
      })
    );
  });
  
  it('maneja correctamente los cambios en los campos de fecha', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Cambiar fechas
    const dateFromInput = screen.getByLabelText('Desde fecha');
    const dateToInput = screen.getByLabelText('Hasta fecha');
    
    fireEvent.change(dateFromInput, { target: { value: '2025-01-01' } });
    fireEvent.change(dateToInput, { target: { value: '2025-12-31' } });
    
    // Aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó con los valores de fecha correctos
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      })
    );
  });
  
  it('maneja correctamente los cambios en las casillas de verificación', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Marcar ambas casillas
    fireEvent.click(screen.getByLabelText('Con archivos adjuntos'));
    fireEvent.click(screen.getByLabelText('Solo no leídos'));
    
    // Aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó con los valores correctos
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasAttachment: true,
        isUnread: true
      })
    );
    
    // Desmarcar una casilla
    fireEvent.click(screen.getByLabelText('Con archivos adjuntos'));
    
    // Aplicar filtros de nuevo
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se actualizó correctamente
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasAttachment: false,
        isUnread: true
      })
    );
  });
  
  it('permite seleccionar múltiples etiquetas simultáneamente', async () => {
    render(
      <EmailFilters 
        onApplyFilters={onApplyFiltersMock} 
        onResetFilters={onResetFiltersMock} 
      />
    );
    
    // Expandir el panel
    fireEvent.click(screen.getByText('Filtros avanzados'));
    
    // Seleccionar varias etiquetas
    fireEvent.click(screen.getByText('Importante'));
    fireEvent.click(screen.getByText('Personal'));
    fireEvent.click(screen.getByText('Proveedor'));
    
    // Aplicar filtros
    fireEvent.click(screen.getByText('Aplicar filtros'));
    
    // Verificar que se llamó con todas las etiquetas seleccionadas
    expect(onApplyFiltersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: expect.arrayContaining(['important', 'personal', 'provider'])
      })
    );
  });
});
