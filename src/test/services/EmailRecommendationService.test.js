import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmailRecommendationService from '../../services/EmailRecommendationService';
import AIEmailTrackingService from '../../services/AIEmailTrackingService';

// Mock del servicio de tracking
vi.mock('../../services/AIEmailTrackingService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      getActivities: vi.fn(),
      getMetrics: vi.fn(),
      getComparisonData: vi.fn()
    }))
  };
});

describe('EmailRecommendationService', () => {
  let recommendationService;
  let mockTrackingService;
  let localStorageMock;
  
  // Mock de datos de actividad para pruebas
  const mockActivities = [
    {
      id: 'ai_1',
      providerName: 'Fotógrafo Test',
      templateCategory: 'fotografía',
      wasCustomized: true,
      responseReceived: true,
      responseTime: 5.5,
      timestamp: '2023-01-01T10:30:00Z' // Mañana
    },
    {
      id: 'ai_2',
      providerName: 'DJ Prueba',
      templateCategory: 'música',
      wasCustomized: false,
      responseReceived: true,
      responseTime: 8.2,
      timestamp: '2023-01-01T14:30:00Z' // Tarde
    },
    {
      id: 'ai_3',
      providerName: 'Catering Example',
      templateCategory: 'catering',
      wasCustomized: true,
      responseReceived: false,
      timestamp: '2023-01-01T18:30:00Z' // Noche
    },
    {
      id: 'ai_4',
      providerName: 'Fotógrafo B',
      templateCategory: 'fotografía',
      wasCustomized: false,
      responseReceived: false,
      timestamp: '2023-01-02T10:30:00Z'
    },
    {
      id: 'ai_5',
      providerName: 'Catering B',
      templateCategory: 'catering',
      wasCustomized: true,
      responseReceived: true,
      responseTime: 3.2,
      timestamp: '2023-01-02T11:30:00Z'
    },
  ];
  
  // Mock de métricas
  const mockMetrics = {
    totalEmails: 5,
    totalResponses: 3,
    responseRate: 60,
    averageResponseTime: 5.6,
    categoryStats: {
      'fotografía': {
        total: 2,
        responded: 1,
        averageResponseTime: 5.5
      },
      'música': {
        total: 1,
        responded: 1,
        averageResponseTime: 8.2
      },
      'catering': {
        total: 2,
        responded: 1,
        averageResponseTime: 3.2
      }
    }
  };
  
  // Mock de datos de comparación
  const mockComparisonData = {
    ai: {
      total: 5,
      responded: 3,
      responseRate: '60.00',
      avgResponseTime: '5.6'
    },
    nonAi: {
      total: 10,
      responded: 5,
      responseRate: '50.00',
      avgResponseTime: '12.0'
    },
    difference: {
      responseRate: '10.00',
      avgResponseTime: '6.4'
    },
    categoryBreakdown: [
      {
        category: 'fotografía',
        total: 2,
        responseRate: '50.00',
        avgResponseTime: '5.5'
      },
      {
        category: 'música',
        total: 1,
        responseRate: '100.00',
        avgResponseTime: '8.2'
      },
      {
        category: 'catering',
        total: 2,
        responseRate: '50.00',
        avgResponseTime: '3.2'
      }
    ]
  };
  
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
    
    // Crear instancia de servicio y configurar mocks
    recommendationService = new EmailRecommendationService();
    mockTrackingService = recommendationService.trackingService;
    
    // Configurar respuestas mock
    mockTrackingService.getActivities.mockReturnValue(mockActivities);
    mockTrackingService.getMetrics.mockReturnValue(mockMetrics);
    mockTrackingService.getComparisonData.mockReturnValue(mockComparisonData);
    
    // Mockear console.error para evitar salida durante las pruebas
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
    expect(recommendationService).toBeDefined();
    expect(recommendationService.trackingService).toBeDefined();
    expect(recommendationService.storageKeyRecommendations).toBe('emailRecommendations');
  });
  
  it('debe generar recomendaciones básicas sin parámetros', () => {
    const recommendations = recommendationService.generateRecommendations();
    
    // Verificar que se generan todas las secciones de recomendaciones
    expect(recommendations).toBeDefined();
    expect(recommendations.bestTimeToSend).toBeDefined();
    expect(recommendations.subjectLineRecommendations).toBeDefined();
    expect(recommendations.templateRecommendations).toBeDefined();
    expect(recommendations.customizationImpact).toBeDefined();
    expect(recommendations.responseTimeExpectations).toBeDefined();
    expect(recommendations.confidenceScore).toBeDefined();
    
    // Verificar que se llamaron los métodos necesarios
    expect(mockTrackingService.getActivities).toHaveBeenCalled();
    expect(mockTrackingService.getMetrics).toHaveBeenCalled();
    expect(mockTrackingService.getComparisonData).toHaveBeenCalled();
    
    // Verificar que se guardaron las recomendaciones en localStorage
    expect(localStorage.setItem).toHaveBeenCalled();
  });
  
  it('debe calcular correctamente el mejor momento para enviar', () => {
    const recommendations = recommendationService.generateRecommendations();
    
    // Con nuestros datos de prueba, el mejor momento debería ser la mañana
    // ya que tiene mejor tasa de respuesta en nuestros datos mock
    expect(recommendations.bestTimeToSend.bestTimeSlot).toBe('morning');
    expect(recommendations.bestTimeToSend.hasSufficientData).toBeTruthy();
  });
  
  it('debe generar recomendaciones específicas para una categoría', () => {
    const recommendations = recommendationService.generateRecommendations('fotografía');
    
    // Verificar que se incluyen recomendaciones específicas para la categoría
    expect(recommendations.categorySpecific).toBeDefined();
    
    // Con los datos mock, debería haber suficientes datos para fotografía
    expect(recommendations.templateRecommendations.categorySpecificTemplate).toBeDefined();
    expect(recommendations.templateRecommendations.categorySpecificTemplate.category).toBe('fotografía');
  });
  
  it('debe generar recomendaciones basadas en una consulta de búsqueda', () => {
    const recommendations = recommendationService.generateRecommendations(null, 'fotografía para boda en Madrid');
    
    // Verificar que se incluyen recomendaciones basadas en la consulta
    expect(recommendations.querySpecific).toBeDefined();
    expect(recommendations.querySpecific.searchContext.includesLocation).toBe(true);
    expect(recommendations.querySpecific.searchContext.includesDate).toBe(false);
  });
  
  it('debe calcular correctamente el impacto de personalización', () => {
    const recommendations = recommendationService.generateRecommendations();
    
    // Con nuestros datos mock, la personalización debería tener impacto positivo
    expect(recommendations.customizationImpact).toBeDefined();
    expect(recommendations.customizationImpact.customized).toBeDefined();
    expect(recommendations.customizationImpact.nonCustomized).toBeDefined();
    
    // Verificar cálculo del impacto
    const customizedRate = parseFloat(recommendations.customizationImpact.customized.rate);
    const nonCustomizedRate = parseFloat(recommendations.customizationImpact.nonCustomized.rate);
    const calculatedImpact = (customizedRate - nonCustomizedRate).toFixed(1);
    
    expect(recommendations.customizationImpact.impact).toBe(calculatedImpact);
  });
  
  it('debe calcular correctamente las expectativas de tiempo de respuesta', () => {
    const recommendations = recommendationService.generateRecommendations();
    
    // Verificar que las expectativas de tiempo incluyen los valores correctos
    expect(recommendations.responseTimeExpectations).toBeDefined();
    expect(recommendations.responseTimeExpectations.hasSufficientData).toBe(true);
    
    // Con nuestros datos mock, el tiempo promedio debería ser calculado correctamente
    const respondedActivities = mockActivities.filter(a => a.responseReceived && a.responseTime);
    const avgTime = respondedActivities.reduce((sum, act) => sum + act.responseTime, 0) / respondedActivities.length;
    
    expect(recommendations.responseTimeExpectations.averageTime).toBe(avgTime.toFixed(1));
  });
  
  it('debe manejar errores durante la generación de recomendaciones', () => {
    // Forzar un error en getActivities
    mockTrackingService.getActivities.mockImplementationOnce(() => {
      throw new Error('Error simulado');
    });
    
    const recommendations = recommendationService.generateRecommendations();
    
    // Verificar que se devuelven recomendaciones por defecto
    expect(recommendations).toBeDefined();
    expect(console.error).toHaveBeenCalled();
    expect(recommendations.confidenceScore).toBe(20); // Puntuación baja por defecto
  });
  
  it('debe guardar y recuperar el historial de recomendaciones', () => {
    // Generar recomendaciones para guardarlas
    recommendationService.generateRecommendations('fotografía', 'fotos para boda');
    
    // Recuperar historial
    const history = recommendationService.getRecommendationsHistory();
    
    // Verificar que se guardó correctamente
    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].category).toBe('fotografía');
    expect(history[0].searchQuery).toBe('fotos para boda');
  });
  
  it('debe marcar una recomendación como aplicada', () => {
    // Preparar datos de prueba
    const mockRecommendations = [
      { id: 'rec_123', applied: false }
    ];
    
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockRecommendations));
    
    // Marcar como aplicada
    const success = recommendationService.markRecommendationAsApplied('rec_123');
    
    // Verificar que se actualizó correctamente
    expect(success).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Verificar que los datos se actualizaron
    const setItemCall = localStorage.setItem.mock.calls[0];
    const updatedData = JSON.parse(setItemCall[1]);
    
    expect(updatedData[0].applied).toBe(true);
    expect(updatedData[0].appliedAt).toBeDefined();
  });
  
  it('debe retornar false al marcar una recomendación que no existe', () => {
    localStorage.getItem.mockReturnValueOnce(JSON.stringify([
      { id: 'rec_123', applied: false }
    ]));
    
    const success = recommendationService.markRecommendationAsApplied('rec_456');
    
    expect(success).toBe(false);
  });
});
