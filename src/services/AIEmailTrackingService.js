/**
 * Servicio especializado para el seguimiento y análisis de efectividad de correos
 * generados mediante búsqueda AI de proveedores.
 */
import { EMAIL_TAGS } from './emailTrackingService';

class AIEmailTrackingService {
  /**
   * Constructor del servicio
   */
  constructor() {
    this.storageKeyActivities = 'aiEmailActivities';
    this.storageKeyMetrics = 'aiEmailMetrics';
  }

  /**
   * Registra una actividad de email AI con información detallada
   * @param {Object} aiResult - Resultado de búsqueda AI utilizado
   * @param {string} searchQuery - Consulta original del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {string} - ID único del registro de actividad
   */
  registerActivity(aiResult, searchQuery, options = {}) {
    try {
      const activityId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      const activity = {
        id: activityId,
        aiResultId: aiResult?.id,
        providerName: aiResult?.name,
        providerCategory: aiResult?.service,
        searchQuery,
        templateCategory: options.templateCategory || aiResult?.service || 'general',
        wasCustomized: options.wasCustomized || false,
        timestamp: new Date().toISOString(),
        status: 'sent',
        responseReceived: false,
        responseTime: null,
        effectivenessScore: null,
        emailId: options.emailId || null
      };
      
      // Guardar en localStorage para desarrollo
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');
      activities.push(activity);
      localStorage.setItem(this.storageKeyActivities, JSON.stringify(activities));
      
      return activityId;
    } catch (error) {
      console.error('Error registrando actividad de email AI:', error);
      return null;
    }
  }
  
  /**
   * Actualiza el estado de un correo AI cuando se recibe respuesta
   * @param {string} activityId - ID de la actividad AI
   * @param {Object} responseData - Datos de la respuesta
   * @returns {boolean} - Éxito de la operación
   */
  updateWithResponse(activityId, responseData) {
    try {
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');
      const index = activities.findIndex(act => act.id === activityId);
      
      if (index === -1) return false;
      
      const now = new Date();
      const sentDate = new Date(activities[index].timestamp);
      const responseTime = (now - sentDate) / (1000 * 60 * 60); // horas
      
      // Actualizar la actividad con datos de respuesta
      activities[index] = {
        ...activities[index],
        status: 'responded',
        responseReceived: true,
        responseTime,
        responseDate: now.toISOString(),
        effectivenessScore: responseData.score || null
      };
      
      localStorage.setItem(this.storageKeyActivities, JSON.stringify(activities));
      
      // Actualizar métricas generales
      this.updateOverallMetrics();
      
      return true;
    } catch (error) {
      console.error('Error actualizando actividad AI con respuesta:', error);
      return false;
    }
  }
  
  /**
   * Obtiene todas las actividades de email AI, opcionalmente filtradas
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} - Actividades que coinciden con los filtros
   */
  getActivities(filters = {}) {
    try {
      const activities = JSON.parse(localStorage.getItem(this.storageKeyActivities) || '[]');
      
      if (Object.keys(filters).length === 0) return activities;
      
      return activities.filter(activity => {
        let incluir = true;
        
        if (filters.category) {
          incluir = incluir && activity.templateCategory === filters.category;
        }
        
        if (filters.status) {
          incluir = incluir && activity.status === filters.status;
        }
        
        if (filters.responded !== undefined) {
          incluir = incluir && activity.responseReceived === filters.responded;
        }
        
        if (filters.customized !== undefined) {
          incluir = incluir && activity.wasCustomized === filters.customized;
        }
        
        if (filters.providerName) {
          incluir = incluir && 
            activity.providerName &&
            activity.providerName.toLowerCase().includes(filters.providerName.toLowerCase());
        }
        
        return incluir;
      });
    } catch (error) {
      console.error('Error obteniendo actividades AI:', error);
      return [];
    }
  }
  
  /**
   * Calcula y actualiza métricas generales de efectividad
   * @private
   */
  updateOverallMetrics() {
    try {
      const activities = this.getActivities();
      const responded = activities.filter(act => act.responseReceived);
      const customized = activities.filter(act => act.wasCustomized);
      const customizedWithResponse = customized.filter(act => act.responseReceived);
      
      // Calcular métricas por categoría
      const categoriesMap = {};
      activities.forEach(act => {
        const cat = act.templateCategory || 'general';
        
        if (!categoriesMap[cat]) {
          categoriesMap[cat] = {
            total: 0,
            responded: 0,
            customized: 0,
            totalResponseTime: 0,
            averageResponseTime: 0
          };
        }
        
        categoriesMap[cat].total++;
        
        if (act.wasCustomized) {
          categoriesMap[cat].customized++;
        }
        
        if (act.responseReceived) {
          categoriesMap[cat].responded++;
          
          if (act.responseTime) {
            categoriesMap[cat].totalResponseTime += act.responseTime;
          }
        }
      });
      
      // Calcular promedios
      Object.keys(categoriesMap).forEach(cat => {
        const stats = categoriesMap[cat];
        stats.averageResponseTime = stats.responded > 0 
          ? stats.totalResponseTime / stats.responded 
          : 0;
      });
      
      // Calcular métricas generales
      const metrics = {
        timestamp: new Date().toISOString(),
        totalEmails: activities.length,
        totalResponses: responded.length,
        responseRate: activities.length > 0 
          ? (responded.length / activities.length) * 100 
          : 0,
        customizedRate: activities.length > 0 
          ? (customized.length / activities.length) * 100 
          : 0,
        customizedResponseRate: customized.length > 0 
          ? (customizedWithResponse.length / customized.length) * 100 
          : 0,
        averageResponseTime: responded.length > 0 
          ? responded.reduce((sum, act) => sum + (act.responseTime || 0), 0) / responded.length 
          : 0,
        categoryStats: categoriesMap
      };
      
      // Guardar métricas
      localStorage.setItem(this.storageKeyMetrics, JSON.stringify(metrics));
      
      return metrics;
    } catch (error) {
      console.error('Error actualizando métricas:', error);
      return null;
    }
  }
  
  /**
   * Obtiene las métricas actuales de efectividad
   * @returns {Object} - Métricas actuales
   */
  getMetrics() {
    try {
      const storedMetrics = localStorage.getItem(this.storageKeyMetrics);
      
      if (storedMetrics) {
        return JSON.parse(storedMetrics);
      }
      
      return this.updateOverallMetrics();
    } catch (error) {
      console.error('Error obteniendo métricas AI:', error);
      return null;
    }
  }
  
  /**
   * Obtiene datos para el panel de comparación de efectividad AI vs no-AI
   * @returns {Object} - Datos de comparación
   */
  getComparisonData() {
    try {
      // Obtener métricas AI
      const aiMetrics = this.getMetrics();
      
      // Obtener datos de correos no-AI desde localStorage (simulado)
      // En producción, esta información vendría de la base de datos
      const emailData = JSON.parse(localStorage.getItem('emailTrackings') || '[]');
      const nonAiEmails = emailData.filter(e => !e.isAIGenerated);
      const nonAiResponses = nonAiEmails.filter(e => e.hasResponse);
      
      // Calcular métricas para correos no-AI
      const nonAiResponseRate = nonAiEmails.length > 0
        ? (nonAiResponses.length / nonAiEmails.length) * 100
        : 0;
      
      // Calcular tiempo de respuesta promedio para no-AI (si hay datos disponibles)
      let nonAiAvgResponseTime = 0;
      if (nonAiResponses.length > 0) {
        let totalTime = 0;
        let countWithTime = 0;
        
        nonAiResponses.forEach(email => {
          if (email.sentDate && email.responseDate) {
            const sentDate = new Date(email.sentDate);
            const responseDate = new Date(email.responseDate);
            const responseTime = (responseDate - sentDate) / (1000 * 60 * 60); // horas
            totalTime += responseTime;
            countWithTime++;
          }
        });
        
        nonAiAvgResponseTime = countWithTime > 0 ? totalTime / countWithTime : 0;
      }
      
      // Preparar datos de comparación
      return {
        ai: {
          total: aiMetrics.totalEmails || 0,
          responded: aiMetrics.totalResponses || 0,
          responseRate: aiMetrics.responseRate.toFixed(2),
          avgResponseTime: aiMetrics.averageResponseTime.toFixed(1)
        },
        nonAi: {
          total: nonAiEmails.length,
          responded: nonAiResponses.length,
          responseRate: nonAiResponseRate.toFixed(2),
          avgResponseTime: nonAiAvgResponseTime.toFixed(1)
        },
        difference: {
          responseRate: (aiMetrics.responseRate - nonAiResponseRate).toFixed(2),
          avgResponseTime: (nonAiAvgResponseTime - aiMetrics.averageResponseTime).toFixed(1)
        },
        categoryBreakdown: Object.keys(aiMetrics.categoryStats || {}).map(cat => ({
          category: cat,
          total: aiMetrics.categoryStats[cat].total,
          responseRate: aiMetrics.categoryStats[cat].total > 0
            ? ((aiMetrics.categoryStats[cat].responded / aiMetrics.categoryStats[cat].total) * 100).toFixed(2)
            : '0.00',
          avgResponseTime: aiMetrics.categoryStats[cat].averageResponseTime.toFixed(1)
        }))
      };
    } catch (error) {
      console.error('Error obteniendo datos de comparación:', error);
      return {
        ai: { total: 0, responded: 0, responseRate: '0.00', avgResponseTime: '0.0' },
        nonAi: { total: 0, responded: 0, responseRate: '0.00', avgResponseTime: '0.0' },
        difference: { responseRate: '0.00', avgResponseTime: '0.0' },
        categoryBreakdown: []
      };
    }
  }
}

export default AIEmailTrackingService;
