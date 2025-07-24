/**
 * Servicio para generar recomendaciones inteligentes basadas en métricas 
 * de efectividad de correos electrónicos
 */
import AIEmailTrackingService from './AIEmailTrackingService';
import { EMAIL_TAGS } from './emailTrackingService';

class EmailRecommendationService {
  constructor() {
    this.trackingService = new AIEmailTrackingService();
    this.storageKeyRecommendations = 'emailRecommendations';
  }

  /**
   * Genera recomendaciones personalizadas basadas en métricas históricas
   * @param {string} category - Categoría de proveedor (opcional)
   * @param {string} searchQuery - Consulta de búsqueda (opcional)
   * @returns {Object} Objeto con recomendaciones
   */
  generateRecommendations(category = null, searchQuery = null) {
    try {
      // Obtener datos históricos
      const activities = this.trackingService.getActivities();
      const metrics = this.trackingService.getMetrics();
      const comparison = this.trackingService.getComparisonData();
      
      // Objeto base de recomendaciones
      const recommendations = {
        bestTimeToSend: this._calculateBestTimeToSend(activities),
        subjectLineRecommendations: this._generateSubjectRecommendations(activities),
        templateRecommendations: this._generateTemplateRecommendations(activities, category),
        customizationImpact: this._calculateCustomizationImpact(activities),
        responseTimeExpectations: this._calculateResponseTimeExpectations(activities, category),
        confidenceScore: 0
      };
      
      // Aplicar contexto de categoría si está disponible
      if (category) {
        recommendations.categorySpecific = this._generateCategorySpecificRecommendations(category, activities);
      }
      
      // Aplicar contexto de búsqueda si está disponible
      if (searchQuery) {
        recommendations.querySpecific = this._generateQuerySpecificRecommendations(searchQuery, activities);
      }
      
      // Calcular puntuación de confianza basada en la cantidad de datos disponibles
      recommendations.confidenceScore = this._calculateConfidenceScore(activities, category);
      
      // Guardar recomendaciones en localStorage para referencia
      this._saveRecommendations(recommendations, category, searchQuery);
      
      return recommendations;
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return this._getDefaultRecommendations();
    }
  }
  
  /**
   * Calcula el mejor momento del día para enviar correos basado en tasas de respuesta históricas
   * @private
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con recomendaciones de horario
   */
  _calculateBestTimeToSend(activities) {
    // Inicializar contadores por franja horaria
    const timeSlots = {
      morning: { sent: 0, responded: 0, rate: 0 },     // 8-12h
      afternoon: { sent: 0, responded: 0, rate: 0 },   // 12-16h
      evening: { sent: 0, responded: 0, rate: 0 },     // 16-20h
      night: { sent: 0, responded: 0, rate: 0 }        // 20-8h
    };
    
    // Analizar actividades
    activities.forEach(activity => {
      const timestamp = new Date(activity.timestamp);
      const hour = timestamp.getHours();
      
      // Determinar franja horaria
      let timeSlot = 'night';
      if (hour >= 8 && hour < 12) timeSlot = 'morning';
      else if (hour >= 12 && hour < 16) timeSlot = 'afternoon';
      else if (hour >= 16 && hour < 20) timeSlot = 'evening';
      
      // Incrementar contadores
      timeSlots[timeSlot].sent++;
      if (activity.responseReceived) {
        timeSlots[timeSlot].responded++;
      }
    });
    
    // Calcular tasas y determinar mejor franja
    let bestTimeSlot = 'morning';
    let bestRate = 0;
    
    Object.keys(timeSlots).forEach(slot => {
      const { sent, responded } = timeSlots[slot];
      const rate = sent > 0 ? (responded / sent) * 100 : 0;
      timeSlots[slot].rate = rate;
      
      if (sent >= 5 && rate > bestRate) {
        bestRate = rate;
        bestTimeSlot = slot;
      }
    });
    
    // Mappear nombres amigables
    const timeSlotNames = {
      morning: 'mañana (8-12h)',
      afternoon: 'mediodía (12-16h)',
      evening: 'tarde (16-20h)',
      night: 'noche (20-8h)'
    };
    
    // Preparar recomendación
    return {
      bestTimeSlot,
      bestTimeSlotName: timeSlotNames[bestTimeSlot],
      bestRate: timeSlots[bestTimeSlot].rate.toFixed(1),
      timeSlots,
      hasSufficientData: this._hasSufficientTimeData(timeSlots)
    };
  }
  
  /**
   * Determina si hay suficientes datos para hacer recomendaciones de tiempo confiables
   * @private
   * @param {Object} timeSlots - Datos por franja horaria
   * @returns {boolean} True si hay suficientes datos
   */
  _hasSufficientTimeData(timeSlots) {
    // Verificar si al menos 2 franjas tienen 5+ envíos
    let slotsWithSufficientData = 0;
    
    Object.values(timeSlots).forEach(slot => {
      if (slot.sent >= 5) slotsWithSufficientData++;
    });
    
    return slotsWithSufficientData >= 2;
  }
  
  /**
   * Genera recomendaciones para líneas de asunto efectivas
   * @private
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con recomendaciones de asunto
   */
  _generateSubjectRecommendations(activities) {
    // Para una implementación real, esto requeriría analizar los asuntos de correos exitosos
    // Aquí incluiremos recomendaciones genéricas basadas en mejores prácticas
    
    return {
      recommendedPatterns: [
        'Consulta sobre [Servicio] para evento el [Fecha]',
        'Disponibilidad y presupuesto para [Evento]',
        'Interés en contratar [Servicio] - Lovenda'
      ],
      avoidPatterns: [
        'Consulta',
        'Información',
        'Hola'
      ],
      optimalLength: {
        min: 30,
        max: 60
      },
      includeElements: [
        'Fecha del evento',
        'Tipo de servicio',
        'Mención de Lovenda'
      ]
    };
  }
  
  /**
   * Genera recomendaciones para plantillas basadas en datos históricos
   * @private
   * @param {Array} activities - Actividades históricas
   * @param {string} category - Categoría de proveedor
   * @returns {Object} Objeto con recomendaciones de plantillas
   */
  _generateTemplateRecommendations(activities, category) {
    // Agrupar por plantilla/categoría
    const templateStats = {};
    
    activities.forEach(activity => {
      const templateCat = activity.templateCategory || 'general';
      
      if (!templateStats[templateCat]) {
        templateStats[templateCat] = {
          total: 0,
          responded: 0,
          responseRate: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        };
      }
      
      templateStats[templateCat].total++;
      
      if (activity.responseReceived) {
        templateStats[templateCat].responded++;
        
        if (activity.responseTime) {
          templateStats[templateCat].totalResponseTime += activity.responseTime;
        }
      }
    });
    
    // Calcular tasas y promedios
    Object.keys(templateStats).forEach(cat => {
      const stats = templateStats[cat];
      stats.responseRate = stats.total > 0 ? (stats.responded / stats.total) * 100 : 0;
      stats.avgResponseTime = stats.responded > 0 ? stats.totalResponseTime / stats.responded : 0;
    });
    
    // Encontrar mejor plantilla general
    let bestTemplate = 'general';
    let bestRate = 0;
    
    Object.keys(templateStats).forEach(cat => {
      // Solo considerar plantillas con suficientes datos
      if (templateStats[cat].total >= 5 && templateStats[cat].responseRate > bestRate) {
        bestRate = templateStats[cat].responseRate;
        bestTemplate = cat;
      }
    });
    
    // Si se especificó una categoría, filtrar para esa categoría
    let categorySpecificTemplate = null;
    if (category && templateStats[category] && templateStats[category].total > 0) {
      categorySpecificTemplate = {
        category,
        responseRate: templateStats[category].responseRate.toFixed(1),
        hasSufficientData: templateStats[category].total >= 5
      };
    }
    
    return {
      bestOverallTemplate: bestTemplate,
      bestOverallResponseRate: bestRate.toFixed(1),
      templateStats,
      categorySpecificTemplate,
      hasSufficientData: this._hasSufficientTemplateData(templateStats)
    };
  }
  
  /**
   * Determina si hay suficientes datos para hacer recomendaciones de plantillas confiables
   * @private
   * @param {Object} templateStats - Estadísticas por plantilla
   * @returns {boolean} True si hay suficientes datos
   */
  _hasSufficientTemplateData(templateStats) {
    // Verificar si al menos 2 plantillas tienen 5+ envíos
    let templatesWithSufficientData = 0;
    
    Object.values(templateStats).forEach(stats => {
      if (stats.total >= 5) templatesWithSufficientData++;
    });
    
    return templatesWithSufficientData >= 2;
  }
  
  /**
   * Calcula el impacto de personalizar mensajes en la tasa de respuesta
   * @private
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con análisis de impacto
   */
  _calculateCustomizationImpact(activities) {
    const customized = {
      total: 0,
      responded: 0,
      rate: 0
    };
    
    const nonCustomized = {
      total: 0,
      responded: 0,
      rate: 0
    };
    
    // Analizar actividades
    activities.forEach(activity => {
      const target = activity.wasCustomized ? customized : nonCustomized;
      
      target.total++;
      if (activity.responseReceived) {
        target.responded++;
      }
    });
    
    // Calcular tasas
    customized.rate = customized.total > 0 ? (customized.responded / customized.total) * 100 : 0;
    nonCustomized.rate = nonCustomized.total > 0 ? (nonCustomized.responded / nonCustomized.total) * 100 : 0;
    
    // Calcular impacto
    const impact = customized.rate - nonCustomized.rate;
    
    return {
      customized: {
        ...customized,
        rate: customized.rate.toFixed(1)
      },
      nonCustomized: {
        ...nonCustomized,
        rate: nonCustomized.rate.toFixed(1)
      },
      impact: impact.toFixed(1),
      recommendCustomization: impact > 5, // Recomendar si hay al menos 5% de mejora
      hasSufficientData: customized.total >= 5 && nonCustomized.total >= 5
    };
  }
  
  /**
   * Calcula tiempos esperados de respuesta basados en datos históricos
   * @private
   * @param {Array} activities - Actividades históricas
   * @param {string} category - Categoría de proveedor
   * @returns {Object} Objeto con expectativas de tiempo de respuesta
   */
  _calculateResponseTimeExpectations(activities, category) {
    // Filtrar solo actividades con respuesta
    const respondedActivities = activities.filter(a => a.responseReceived && a.responseTime);
    
    // Si no hay suficientes datos, retornar expectativas por defecto
    if (respondedActivities.length < 5) {
      return {
        averageTime: '24-48',
        hasSufficientData: false
      };
    }
    
    // Calcular tiempo promedio general
    const avgTime = respondedActivities.reduce((sum, act) => sum + act.responseTime, 0) / respondedActivities.length;
    
    // Si se especificó categoría, calcular tiempo para esa categoría
    let categoryAvgTime = null;
    if (category) {
      const categoryActivities = respondedActivities.filter(a => a.templateCategory === category);
      
      if (categoryActivities.length >= 3) {
        categoryAvgTime = categoryActivities.reduce((sum, act) => sum + act.responseTime, 0) / categoryActivities.length;
      }
    }
    
    return {
      averageTime: avgTime.toFixed(1),
      medianTime: this._calculateMedianTime(respondedActivities),
      categoryAverageTime: categoryAvgTime ? categoryAvgTime.toFixed(1) : null,
      fastestResponse: Math.min(...respondedActivities.map(a => a.responseTime)).toFixed(1),
      slowestResponse: Math.max(...respondedActivities.map(a => a.responseTime)).toFixed(1),
      hasSufficientData: true
    };
  }
  
  /**
   * Calcula la mediana del tiempo de respuesta
   * @private
   * @param {Array} activities - Actividades con respuesta
   * @returns {string} Mediana formateada
   */
  _calculateMedianTime(activities) {
    const times = activities.map(a => a.responseTime).sort((a, b) => a - b);
    const mid = Math.floor(times.length / 2);
    
    const median = times.length % 2 === 0
      ? (times[mid - 1] + times[mid]) / 2
      : times[mid];
      
    return median.toFixed(1);
  }
  
  /**
   * Genera recomendaciones específicas para una categoría
   * @private
   * @param {string} category - Categoría de proveedor
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con recomendaciones específicas
   */
  _generateCategorySpecificRecommendations(category, activities) {
    // Filtrar actividades para la categoría específica
    const categoryActivities = activities.filter(a => a.templateCategory === category);
    
    if (categoryActivities.length < 3) {
      return {
        hasSufficientData: false,
        recommendations: []
      };
    }
    
    // En una implementación real, aquí se aplicaría análisis específico por categoría
    // Proveer algunas recomendaciones basadas en la categoría
    
    const categoryRecommendations = {
      hasSufficientData: true,
      responseRate: (categoryActivities.filter(a => a.responseReceived).length / categoryActivities.length * 100).toFixed(1),
      recommendations: []
    };
    
    // Generar recomendaciones específicas según la categoría
    switch (category.toLowerCase()) {
      case 'fotografía':
        categoryRecommendations.recommendations = [
          'Mencionar el estilo específico de fotografías que buscas',
          'Preguntar por la disponibilidad de álbumes impresos',
          'Consultar sobre el tiempo de entrega de las fotos editadas'
        ];
        break;
        
      case 'catering':
        categoryRecommendations.recommendations = [
          'Especificar el número aproximado de invitados',
          'Mencionar restricciones alimentarias o preferencias',
          'Preguntar por opciones de menú y posibilidad de cata'
        ];
        break;
        
      case 'música':
        categoryRecommendations.recommendations = [
          'Especificar el estilo musical preferido',
          'Consultar sobre el repertorio y posibilidad de peticiones',
          'Preguntar por necesidades técnicas y espacio necesario'
        ];
        break;
        
      case 'flores':
        categoryRecommendations.recommendations = [
          'Mencionar la paleta de colores del evento',
          'Especificar las áreas que requieren decoración',
          'Consultar sobre flores de temporada disponibles'
        ];
        break;
        
      default:
        categoryRecommendations.recommendations = [
          'Ser específico sobre tus necesidades para el evento',
          'Mencionar fecha, ubicación y número de invitados',
          'Consultar disponibilidad antes de entrar en detalles'
        ];
    }
    
    return categoryRecommendations;
  }
  
  /**
   * Genera recomendaciones específicas basadas en la consulta de búsqueda
   * @private
   * @param {string} searchQuery - Consulta de búsqueda
   * @param {Array} activities - Actividades históricas
   * @returns {Object} Objeto con recomendaciones basadas en la búsqueda
   */
  _generateQuerySpecificRecommendations(searchQuery, activities) {
    // Análisis básico de la consulta
    const query = searchQuery.toLowerCase();
    const recommendations = [];
    
    // Detectar elementos clave en la consulta
    const hasLocation = /madrid|barcelona|valencia|sevilla|málaga|ciudad|zona|cerca/i.test(query);
    const hasDate = /202\d|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i.test(query);
    const hasBudget = /presupuesto|euros|precio|coste|económico/i.test(query);
    const hasSize = /grande|pequeño|íntimo|invitados|personas|gente|tamaño/i.test(query);
    
    // Generar recomendaciones contextuales
    if (!hasLocation) {
      recommendations.push('Especificar la ubicación del evento en tu mensaje');
    }
    
    if (!hasDate) {
      recommendations.push('Mencionar la fecha del evento para confirmar disponibilidad');
    }
    
    if (!hasBudget) {
      recommendations.push('Indicar un rango de presupuesto para obtener propuestas ajustadas');
    }
    
    if (!hasSize) {
      recommendations.push('Especificar el número aproximado de invitados o tamaño del evento');
    }
    
    return {
      searchContext: {
        includesLocation: hasLocation,
        includesDate: hasDate,
        includesBudget: hasBudget,
        includesSize: hasSize
      },
      recommendations
    };
  }
  
  /**
   * Calcula la puntuación de confianza para las recomendaciones
   * @private
   * @param {Array} activities - Actividades históricas
   * @param {string} category - Categoría de proveedor
   * @returns {number} Puntuación de confianza (0-100)
   */
  _calculateConfidenceScore(activities, category) {
    // Base: cantidad de datos disponibles
    let baseScore = 0;
    
    // Por cantidad total de actividades
    if (activities.length >= 50) baseScore = 100;
    else if (activities.length >= 30) baseScore = 80;
    else if (activities.length >= 15) baseScore = 60;
    else if (activities.length >= 5) baseScore = 40;
    else baseScore = 20;
    
    // Ajustar por categoría específica si está disponible
    if (category) {
      const categoryActivities = activities.filter(a => a.templateCategory === category);
      let categoryMultiplier = 1;
      
      if (categoryActivities.length >= 20) categoryMultiplier = 1.2;
      else if (categoryActivities.length >= 10) categoryMultiplier = 1.1;
      else if (categoryActivities.length >= 5) categoryMultiplier = 1.05;
      else if (categoryActivities.length < 3) categoryMultiplier = 0.8;
      
      baseScore = Math.min(100, baseScore * categoryMultiplier);
    }
    
    // Ajustar por distribución de respuestas
    const responded = activities.filter(a => a.responseReceived).length;
    if (activities.length > 0) {
      const responseRate = (responded / activities.length);
      
      // Penalizar si la tasa de respuesta es muy baja o muy alta (datos poco representativos)
      if (responseRate < 0.1 || responseRate > 0.9) {
        baseScore *= 0.9;
      }
    }
    
    return Math.round(baseScore);
  }
  
  /**
   * Guarda las recomendaciones generadas para referencia futura
   * @private
   * @param {Object} recommendations - Recomendaciones generadas
   * @param {string} category - Categoría de proveedor
   * @param {string} searchQuery - Consulta de búsqueda
   */
  _saveRecommendations(recommendations, category, searchQuery) {
    try {
      const savedRecommendations = JSON.parse(localStorage.getItem(this.storageKeyRecommendations) || '[]');
      
      // Limitar a las últimas 10 recomendaciones
      if (savedRecommendations.length >= 10) {
        savedRecommendations.pop();
      }
      
      // Añadir nueva recomendación
      savedRecommendations.unshift({
        id: `rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        category,
        searchQuery,
        recommendations,
        applied: false
      });
      
      localStorage.setItem(this.storageKeyRecommendations, JSON.stringify(savedRecommendations));
    } catch (error) {
      console.error('Error guardando recomendaciones:', error);
    }
  }
  
  /**
   * Retorna las recomendaciones por defecto cuando no hay datos suficientes
   * @private
   * @returns {Object} Recomendaciones por defecto
   */
  _getDefaultRecommendations() {
    return {
      bestTimeToSend: {
        bestTimeSlot: 'morning',
        bestTimeSlotName: 'mañana (8-12h)',
        hasSufficientData: false
      },
      subjectLineRecommendations: {
        recommendedPatterns: [
          'Consulta sobre [Servicio] para evento el [Fecha]',
          'Disponibilidad y presupuesto para [Evento]',
          'Interés en contratar [Servicio] - Lovenda'
        ],
        optimalLength: {
          min: 30,
          max: 60
        }
      },
      templateRecommendations: {
        bestOverallTemplate: 'general',
        hasSufficientData: false
      },
      customizationImpact: {
        recommendCustomization: true,
        hasSufficientData: false
      },
      responseTimeExpectations: {
        averageTime: '24-48',
        hasSufficientData: false
      },
      confidenceScore: 20
    };
  }
  
  /**
   * Obtiene recomendaciones previamente generadas
   * @returns {Array} Historial de recomendaciones
   */
  getRecommendationsHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeyRecommendations) || '[]');
    } catch (error) {
      console.error('Error obteniendo historial de recomendaciones:', error);
      return [];
    }
  }
  
  /**
   * Marca una recomendación como aplicada
   * @param {string} recommendationId - ID de la recomendación
   * @returns {boolean} Éxito de la operación
   */
  markRecommendationAsApplied(recommendationId) {
    try {
      const savedRecommendations = JSON.parse(localStorage.getItem(this.storageKeyRecommendations) || '[]');
      const index = savedRecommendations.findIndex(r => r.id === recommendationId);
      
      if (index === -1) return false;
      
      savedRecommendations[index].applied = true;
      savedRecommendations[index].appliedAt = new Date().toISOString();
      
      localStorage.setItem(this.storageKeyRecommendations, JSON.stringify(savedRecommendations));
      return true;
    } catch (error) {
      console.error('Error marcando recomendación como aplicada:', error);
      return false;
    }
  }
}

export default EmailRecommendationService;
