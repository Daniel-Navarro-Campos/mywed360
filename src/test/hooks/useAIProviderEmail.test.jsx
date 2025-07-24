import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIProviderEmail } from '../../hooks/useAIProviderEmail';
import EmailTemplateService from '../../services/EmailTemplateService';

// Mock del hook useProviderEmail
vi.mock('../../hooks/useProviderEmail', () => ({
  useProviderEmail: () => ({
    userEmail: 'usuario.test@lovenda.com',
    sendEmailToProvider: vi.fn().mockResolvedValue(true),
    generateDefaultSubject: () => 'Asunto predeterminado',
    generateDefaultEmailBody: () => 'Cuerpo predeterminado'
  })
}));

// Mock del servicio EmailService
vi.mock('../../services/emailService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      logAIEmailActivity: vi.fn().mockResolvedValue(true),
      sendEmailToProvider: vi.fn().mockResolvedValue(true)
    }))
  };
});

// Mock del servicio EmailTemplateService
vi.mock('../../services/EmailTemplateService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      generateSubjectFromTemplate: vi.fn().mockImplementation((category, data) => 
        `Consulta sobre ${category} para boda - ${data.providerName}`),
      generateBodyFromTemplate: vi.fn().mockImplementation((category, data) => 
        `Cuerpo personalizado para ${data.providerName} con búsqueda: ${data.searchQuery}`),
      logTemplateUsage: vi.fn()
    }))
  };
});

describe('useAIProviderEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('devuelve las funciones y propiedades esperadas', () => {
    const { result } = renderHook(() => useAIProviderEmail());
    
    expect(result.current.userEmail).toBe('usuario.test@lovenda.com');
    expect(typeof result.current.sendEmailFromAIResult).toBe('function');
    expect(typeof result.current.generateAISubject).toBe('function');
    expect(typeof result.current.generateAIEmailBody).toBe('function');
    expect(result.current.isSending).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('genera un asunto personalizado basado en el resultado AI usando plantilla', () => {
    const { result } = renderHook(() => useAIProviderEmail());
    
    const aiResult = {
      id: 1,
      name: 'Florista Bella',
      service: 'Florería'
    };
    
    const subject = result.current.generateAISubject(aiResult);
    expect(subject).toContain('Florista Bella');
    expect(subject).toContain('Florería');
    
    // Verificar que se llamó al servicio de plantillas
    const templateServiceInstance = EmailTemplateService.mock.instances[0];
    expect(templateServiceInstance.generateSubjectFromTemplate).toHaveBeenCalledWith(
      'Florería',
      expect.objectContaining({
        providerName: 'Florista Bella'
      })
    );
  });
  
  it('genera un cuerpo de email personalizado basado en el resultado AI y la consulta usando plantilla', () => {
    const { result } = renderHook(() => useAIProviderEmail());
    
    const aiResult = {
      id: 1,
      name: 'Florista Bella',
      service: 'Florería',
      price: '500€ - 1000€',
      location: 'Madrid',
      aiSummary: 'Este proveedor ofrece arreglos florales modernos'
    };
    
    const searchQuery = 'flores estilo moderno para boda';
    const body = result.current.generateAIEmailBody(aiResult, searchQuery);
    
    // Verificar que el cuerpo contiene la información esperada (del mock)
    expect(body).toContain('Florista Bella');
    expect(body).toContain(searchQuery);
    
    // Verificar que se llamó al servicio de plantillas con los datos correctos
    const templateServiceInstance = EmailTemplateService.mock.instances[0];
    expect(templateServiceInstance.generateBodyFromTemplate).toHaveBeenCalledWith(
      'Florería',
      expect.objectContaining({
        providerName: 'Florista Bella',
        searchQuery: 'flores estilo moderno para boda',
        aiInsight: 'Este proveedor ofrece arreglos florales modernos',
        price: '500€ - 1000€',
        location: 'Madrid'
      })
    );
  });
  
  it('envía un email correctamente usando el resultado AI y registra el uso de plantilla', async () => {
    const { result } = renderHook(() => useAIProviderEmail());
    
    const aiResult = {
      id: 1,
      name: 'Florista Bella',
      service: 'Florería',
      location: 'Madrid'
    };
    
    const searchQuery = 'flores estilo moderno para boda';
    
    let success;
    await act(async () => {
      success = await result.current.sendEmailFromAIResult(aiResult, searchQuery);
    });
    
    expect(success).toBe(true);
    expect(result.current.isSending).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verificar que se registró el uso de la plantilla
    const templateServiceInstance = EmailTemplateService.mock.instances[0];
    expect(templateServiceInstance.logTemplateUsage).toHaveBeenCalledWith(
      'Florería', 
      aiResult, 
      false
    );
  });
  
  it('maneja errores durante el envío de email', async () => {
    // Modificar el mock para simular un error
    vi.mock('../../hooks/useProviderEmail', () => ({
      useProviderEmail: () => ({
        userEmail: 'usuario.test@lovenda.com',
        sendEmailToProvider: vi.fn().mockRejectedValue(new Error('Error de prueba')),
        generateDefaultSubject: () => 'Asunto predeterminado',
        generateDefaultEmailBody: () => 'Cuerpo predeterminado'
      })
    }), { virtual: true });
    
    const { result } = renderHook(() => useAIProviderEmail());
    
    const aiResult = {
      id: 1,
      name: 'Florista Bella',
      service: 'Florería'
    };
    
    const searchQuery = 'flores estilo moderno para boda';
    
    let success;
    await act(async () => {
      success = await result.current.sendEmailFromAIResult(aiResult, searchQuery);
    });
    
    expect(success).toBe(false);
    expect(result.current.error).not.toBeNull();
  });
  
  it('valida que la información del proveedor esté completa', async () => {
    const { result } = renderHook(() => useAIProviderEmail());
    
    const aiResult = null;
    const searchQuery = 'flores estilo moderno para boda';
    
    let success;
    await act(async () => {
      success = await result.current.sendEmailFromAIResult(aiResult, searchQuery);
    });
    
    expect(success).toBe(false);
    expect(result.current.error).not.toBeNull();
  });
});
