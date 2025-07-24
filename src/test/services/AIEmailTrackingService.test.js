import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AIEmailTrackingService from '../../services/AIEmailTrackingService';

describe('AIEmailTrackingService', () => {
  let trackingService;
  let localStorageMock;
  
  // Mock de localStorage
  beforeEach(() => {
    localStorageMock = {
      store: {},
      getItem: vi.fn((key) => localStorageMock.store[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock.store[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock.store[key];
      }),
      clear: vi.fn(() => {
        localStorageMock.store = {};
      })
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    trackingService = new AIEmailTrackingService();
    
    // Mockear console.log/error para evitar salida durante las pruebas
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.resetAllMocks();
    
    // Restaurar localStorage original
    Object.defineProperty(window, 'localStorage', {
      value: window.localStorage,
      writable: true
    });
  });
  
  it('debe inicializarse correctamente', () => {
    expect(trackingService).toBeDefined();
    expect(trackingService.storageKeyActivities).toBe('aiEmailActivities');
    expect(trackingService.storageKeyMetrics).toBe('aiEmailMetrics');
  });
  
  it('debe registrar una actividad AI correctamente', () => {
    const aiResult = {
      id: 123,
      name: 'Fotógrafo Test',
      service: 'fotografía'
    };
    
    const searchQuery = 'fotografía para boda';
    const options = { templateCategory: 'fotografía', wasCustomized: false };
    
    const activityId = trackingService.registerActivity(aiResult, searchQuery, options);
    
    // Verificar que se generó un ID
    expect(activityId).toBeDefined();
    expect(typeof activityId).toBe('string');
    expect(activityId.startsWith('ai_')).toBe(true);
    
    // Verificar que se llamó a localStorage.setItem con los datos correctos
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Verificar que los datos se almacenaron correctamente
    const storedDataArg = localStorage.setItem.mock.calls[0][1];
    const storedData = JSON.parse(storedDataArg);
    
    expect(Array.isArray(storedData)).toBe(true);
    expect(storedData.length).toBe(1);
    expect(storedData[0].aiResultId).toBe(123);
    expect(storedData[0].providerName).toBe('Fotógrafo Test');
    expect(storedData[0].providerCategory).toBe('fotografía');
    expect(storedData[0].searchQuery).toBe('fotografía para boda');
    expect(storedData[0].templateCategory).toBe('fotografía');
    expect(storedData[0].wasCustomized).toBe(false);
  });
  
  it('debe manejar errores durante el registro de actividad', () => {
    // Forzar un error en setItem
    localStorage.setItem.mockImplementationOnce(() => {
      throw new Error('Error simulado');
    });
    
    const activityId = trackingService.registerActivity({}, 'consulta');
    
    expect(console.error).toHaveBeenCalled();
    expect(activityId).toBeNull();
  });
  
  it('debe actualizar una actividad cuando se recibe respuesta', () => {
    // Preparar datos de prueba
    const aiResult = { id: 123, name: 'Proveedor Test' };
    localStorage.getItem.mockReturnValueOnce(JSON.stringify([
      { id: 'ai_123', aiResultId: 123, timestamp: new Date().toISOString() }
    ]));
    
    const success = trackingService.updateWithResponse('ai_123', { score: 5 });
    
    expect(success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
    
    const storedDataArg = localStorage.setItem.mock.calls[0][1];
    const storedData = JSON.parse(storedDataArg);
    
    expect(storedData[0].status).toBe('responded');
    expect(storedData[0].responseReceived).toBe(true);
    expect(storedData[0].responseTime).toBeDefined();
    expect(storedData[0].effectivenessScore).toBe(5);
  });
  
  it('debe retornar false al actualizar una actividad que no existe', () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify([
      { id: 'ai_123', aiResultId: 123 }
    ]));
    
    const success = trackingService.updateWithResponse('ai_456', { score: 5 });
    
    expect(success).toBe(false);
  });
  
  it('debe obtener actividades filtradas correctamente', () => {
    const mockActivities = [
      { 
        id: 'ai_1', 
        providerName: 'Fotógrafo A', 
        templateCategory: 'fotografía', 
        responseReceived: true,
        status: 'responded',
        wasCustomized: true
      },
      { 
        id: 'ai_2', 
        providerName: 'Catering B', 
        templateCategory: 'catering', 
        responseReceived: false,
        status: 'sent',
        wasCustomized: false
      }
    ];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    
    // Sin filtros
    let result = trackingService.getActivities();
    expect(result).toHaveLength(2);
    
    // Filtrar por categoría
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    result = trackingService.getActivities({ category: 'fotografía' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ai_1');
    
    // Filtrar por estado de respuesta
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    result = trackingService.getActivities({ responded: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ai_1');
    
    // Filtrar por personalización
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    result = trackingService.getActivities({ customized: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ai_1');
    
    // Filtrar por nombre de proveedor
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    result = trackingService.getActivities({ providerName: 'Catering' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ai_2');
  });
  
  it('debe calcular métricas correctamente', () => {
    const mockActivities = [
      {
        id: 'ai_1',
        templateCategory: 'fotografía',
        responseReceived: true,
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
        responseTime: 5.5,
        wasCustomized: true
      },
      {
        id: 'ai_2',
        templateCategory: 'fotografía',
        responseReceived: false,
        timestamp: new Date().toISOString(),
        wasCustomized: false
      },
      {
        id: 'ai_3',
        templateCategory: 'catering',
        responseReceived: true,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
        responseTime: 3.2,
        wasCustomized: false
      }
    ];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockActivities));
    
    const metrics = trackingService.updateOverallMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.totalEmails).toBe(3);
    expect(metrics.totalResponses).toBe(2);
    expect(metrics.responseRate).toBe((2/3) * 100);
    
    // Verificar estadísticas por categoría
    expect(metrics.categoryStats).toBeDefined();
    expect(metrics.categoryStats.fotografía).toBeDefined();
    expect(metrics.categoryStats.fotografía.total).toBe(2);
    expect(metrics.categoryStats.fotografía.responded).toBe(1);
    
    expect(metrics.categoryStats.catering).toBeDefined();
    expect(metrics.categoryStats.catering.total).toBe(1);
    expect(metrics.categoryStats.catering.responded).toBe(1);
  });
  
  it('debe obtener datos de comparación', () => {
    // Mock de datos de email
    const mockEmailTrackings = [
      { isAIGenerated: true, hasResponse: true, sentDate: '2023-01-01T10:00:00Z', responseDate: '2023-01-01T18:00:00Z' },
      { isAIGenerated: false, hasResponse: true, sentDate: '2023-01-01T10:00:00Z', responseDate: '2023-01-02T10:00:00Z' },
      { isAIGenerated: false, hasResponse: false, sentDate: '2023-01-01T10:00:00Z' },
      { isAIGenerated: false, hasResponse: true, sentDate: '2023-01-01T10:00:00Z', responseDate: '2023-01-01T22:00:00Z' }
    ];
    
    // Mock de métricas AI
    const mockMetrics = {
      totalEmails: 1,
      totalResponses: 1,
      responseRate: 100,
      averageResponseTime: 8,
      categoryStats: {
        fotografía: {
          total: 1,
          responded: 1,
          averageResponseTime: 8
        }
      }
    };
    
    // Mock para getMetrics
    vi.spyOn(trackingService, 'getMetrics').mockReturnValue(mockMetrics);
    
    // Mock para localStorage.getItem (emailTrackings)
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockEmailTrackings));
    
    const comparison = trackingService.getComparisonData();
    
    expect(comparison).toBeDefined();
    expect(comparison.ai).toBeDefined();
    expect(comparison.nonAi).toBeDefined();
    expect(comparison.difference).toBeDefined();
    
    // Verificar datos de AI
    expect(comparison.ai.total).toBe(1);
    expect(comparison.ai.responded).toBe(1);
    expect(comparison.ai.responseRate).toBe('100.00');
    
    // Verificar datos de no-AI
    expect(comparison.nonAi.total).toBe(3);
    expect(comparison.nonAi.responded).toBe(2);
    
    // Verificar desglose por categoría
    expect(comparison.categoryBreakdown).toHaveLength(1);
    expect(comparison.categoryBreakdown[0].category).toBe('fotografía');
  });
});
