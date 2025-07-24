import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmartEmailComposer from '../../components/email/SmartEmailComposer';
import EmailRecommendationService from '../../services/EmailRecommendationService';

// Mock del servicio de recomendaciones
vi.mock('../../services/EmailRecommendationService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      generateRecommendations: vi.fn().mockReturnValue({
        bestTimeToSend: {
          bestTimeSlot: 'morning',
          bestTimeSlotName: 'mañana (8-12h)',
          bestRate: '75.0'
        },
        subjectLineRecommendations: {
          recommendedPatterns: ['Consulta sobre [Servicio] para evento el [Fecha]']
        },
        templateRecommendations: {
          bestOverallTemplate: 'fotografía'
        },
        confidenceScore: 85
      }),
      markRecommendationAsApplied: vi.fn()
    }))
  };
});

// Mock del componente EmailRecommendationsPanel
vi.mock('../../components/email/EmailRecommendationsPanel', () => ({
  default: ({ category, searchQuery, onApplyRecommendation }) => (
    <div data-testid="recommendations-panel">
      <button 
        data-testid="apply-subject-recommendation"
        onClick={() => onApplyRecommendation('subject', 'Consulta sobre [Servicio] para evento el [Fecha]')}
      >
        Aplicar recomendación de asunto
      </button>
      <button 
        data-testid="apply-template-recommendation"
        onClick={() => onApplyRecommendation('template', 'fotografía')}
      >
        Aplicar recomendación de plantilla
      </button>
      <button 
        data-testid="apply-time-recommendation"
        onClick={() => onApplyRecommendation('time', { bestTimeSlot: 'morning' })}
      >
        Aplicar recomendación de hora
      </button>
    </div>
  )
}));

describe('SmartEmailComposer', () => {
  const mockProvider = {
    id: 'provider-1',
    name: 'Fotógrafo Test',
    email: 'fotografo@test.com',
    service: 'fotografía'
  };
  
  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Fotografía General',
      category: 'fotografía',
      subjectTemplate: 'Consulta sobre [Servicio] con [Proveedor]',
      messageTemplate: 'Hola [Proveedor], estoy interesado en contratar servicios de [Servicio] para mi evento.'
    },
    {
      id: 'template-2',
      name: 'Catering General',
      category: 'catering',
      subjectTemplate: 'Servicios de [Servicio] para evento',
      messageTemplate: 'Hola [Proveedor], me gustaría recibir información sobre sus servicios de [Servicio].'
    }
  ];
  
  const mockOnSend = vi.fn();
  const mockOnCancel = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('debe renderizarse correctamente', () => {
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        searchQuery="fotografía boda madrid"
        onSend={mockOnSend}
        onCancel={mockOnCancel}
        templates={mockTemplates}
      />
    );
    
    // Verificar elementos principales
    expect(screen.getByText('Redactar Correo')).toBeInTheDocument();
    expect(screen.getByText(/a Fotógrafo Test/)).toBeInTheDocument();
    expect(screen.getByLabelText('Asunto')).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeInTheDocument();
  });
  
  it('debe cargar una plantilla inicial basada en la categoría del proveedor', () => {
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Verificar que se cargó la plantilla de fotografía
    const asuntoInput = screen.getByLabelText('Asunto');
    const mensajeInput = screen.getByLabelText('Mensaje');
    
    expect(asuntoInput.value).toBe('Consulta sobre fotografía con Fotógrafo Test');
    expect(mensajeInput.value).toContain('Hola Fotógrafo Test, estoy interesado');
    expect(mensajeInput.value).toContain('servicios de fotografía');
  });
  
  it('debe mostrar/ocultar el panel de recomendaciones al hacer clic en el botón', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Por defecto el panel no debería estar visible
    expect(screen.queryByTestId('recommendations-panel')).not.toBeInTheDocument();
    
    // Hacer clic en el botón de recomendaciones
    const toggleButton = screen.getByRole('button', { name: /mostrar recomendaciones/i });
    await user.click(toggleButton);
    
    // Verificar que ahora está visible
    expect(screen.getByTestId('recommendations-panel')).toBeInTheDocument();
    
    // Hacer clic nuevamente para ocultar
    await user.click(toggleButton);
    
    // Verificar que se ha ocultado
    expect(screen.queryByTestId('recommendations-panel')).not.toBeInTheDocument();
  });
  
  it('debe aplicar recomendación de asunto', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Mostrar panel de recomendaciones
    const toggleButton = screen.getByRole('button', { name: /mostrar recomendaciones/i });
    await user.click(toggleButton);
    
    // Aplicar recomendación de asunto
    const applySubjectBtn = screen.getByTestId('apply-subject-recommendation');
    await user.click(applySubjectBtn);
    
    // Verificar que se aplicó la recomendación
    const asuntoInput = screen.getByLabelText('Asunto');
    expect(asuntoInput.value).toBe('Consulta sobre fotografía para evento el próximamente');
    
    // Verificar que se muestra mensaje de feedback
    expect(screen.getByText('Línea de asunto actualizada con la recomendación')).toBeInTheDocument();
  });
  
  it('debe aplicar recomendación de plantilla', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Mostrar panel de recomendaciones
    const toggleButton = screen.getByRole('button', { name: /mostrar recomendaciones/i });
    await user.click(toggleButton);
    
    // Aplicar recomendación de plantilla
    const applyTemplateBtn = screen.getByTestId('apply-template-recommendation');
    await user.click(applyTemplateBtn);
    
    // Verificar que se muestra mensaje de feedback
    expect(screen.getByText(/Plantilla ".*" aplicada/)).toBeInTheDocument();
  });
  
  it('debe programar el envío para un horario recomendado', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Mostrar panel de recomendaciones
    const toggleButton = screen.getByRole('button', { name: /mostrar recomendaciones/i });
    await user.click(toggleButton);
    
    // Aplicar recomendación de horario
    const applyTimeBtn = screen.getByTestId('apply-time-recommendation');
    await user.click(applyTimeBtn);
    
    // Verificar que se muestra mensaje de feedback
    expect(screen.getByText(/Correo programado para mañana/)).toBeInTheDocument();
    
    // Verificar que hay una fecha programada
    const programarInput = screen.getByLabelText(/datetime-local/i);
    expect(programarInput.value).not.toBe('');
  });
  
  it('debe mostrar error al intentar enviar sin asunto o mensaje', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        onSend={mockOnSend}
      />
    );
    
    // Limpiar campos
    const asuntoInput = screen.getByLabelText('Asunto');
    const mensajeInput = screen.getByLabelText('Mensaje');
    
    await user.clear(asuntoInput);
    await user.clear(mensajeInput);
    
    // Intentar enviar
    const enviarBtn = screen.getByRole('button', { name: /enviar/i });
    await user.click(enviarBtn);
    
    // Verificar mensaje de error
    expect(screen.getByText('Por favor, completa el asunto y el mensaje antes de enviar.')).toBeInTheDocument();
    expect(mockOnSend).not.toHaveBeenCalled();
  });
  
  it('debe enviar el correo con los datos correctos', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        searchQuery="fotografía boda"
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Editar campos
    const asuntoInput = screen.getByLabelText('Asunto');
    const mensajeInput = screen.getByLabelText('Mensaje');
    
    await user.clear(asuntoInput);
    await user.clear(mensajeInput);
    
    await user.type(asuntoInput, 'Asunto de prueba');
    await user.type(mensajeInput, 'Mensaje de prueba');
    
    // Enviar correo
    const enviarBtn = screen.getByRole('button', { name: /enviar/i });
    await user.click(enviarBtn);
    
    // Verificar que se llamó a onSend con los datos correctos
    expect(mockOnSend).toHaveBeenCalledTimes(1);
    expect(mockOnSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'fotografo@test.com',
        subject: 'Asunto de prueba',
        message: 'Mensaje de prueba',
        provider: mockProvider,
        searchQuery: 'fotografía boda'
      })
    );
  });
  
  it('debe cambiar entre programar y enviar según haya fecha programada', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
      />
    );
    
    // Por defecto debería mostrar "Enviar"
    let enviarBtn = screen.getByRole('button', { name: /enviar/i });
    expect(enviarBtn).toBeInTheDocument();
    
    // Configurar una fecha programada
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().substring(0, 16);
    
    const programarInput = screen.getByLabelText(/datetime-local/i);
    await user.type(programarInput, dateString);
    
    // Ahora debería mostrar "Programar"
    enviarBtn = screen.getByRole('button', { name: /programar/i });
    expect(enviarBtn).toBeInTheDocument();
    
    // Limpiar fecha
    const limpiarBtn = screen.getByRole('button', { name: /limpiar/i });
    await user.click(limpiarBtn);
    
    // Volver a mostrar "Enviar"
    enviarBtn = screen.getByRole('button', { name: /enviar/i });
    expect(enviarBtn).toBeInTheDocument();
  });
  
  it('debe llamar a onCancel cuando se hace clic en cancelar', async () => {
    const user = userEvent.setup();
    
    render(
      <SmartEmailComposer 
        provider={mockProvider}
        templates={mockTemplates}
        onSend={mockOnSend}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelarBtn = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelarBtn);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
