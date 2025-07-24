/**
 * Servicio para recolectar y analizar estadísticas de uso del sistema de correo
 * Proporciona métricas sobre actividad de correo, patrones de comunicación, 
 * distribución por etiquetas y carpetas, etc.
 */

import { getMails } from './emailService';
import { getUserFolders, getEmailsInFolder } from './folderService';
import { getUserTags, getEmailsByTag, getEmailTagsDetails } from './tagService';
import { getAggregatedStats, getDailyStats } from './emailMetricsService';

/**
 * Almacena las estadísticas de correo del usuario en localStorage
 * @param {string} userId - ID del usuario
 * @param {Object} stats - Estadísticas a almacenar
 */
const saveUserStats = (userId, stats) => {
  if (!userId) return;
  localStorage.setItem(`lovenda_email_stats_${userId}`, JSON.stringify(stats));
};

/**
 * Recupera las estadísticas de correo del usuario desde localStorage
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas del usuario o un objeto vacío
 */
const getUserStats = (userId) => {
  if (!userId) return {};
  try {
    const stats = localStorage.getItem(`lovenda_email_stats_${userId}`);
    return stats ? JSON.parse(stats) : {};
  } catch (error) {
    console.error('Error al recuperar estadísticas:', error);
    return {};
  }
};

/**
 * Genera estadísticas completas de uso del correo para el usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas completas
 */
const generateUserStats = async (userId) => {
  if (!userId) return {};
  
  try {
    // Intentar obtener métricas agregadas desde Firestore
    const aggregated = await getAggregatedStats(userId);
    if (aggregated) {
      // Guardar copia local para acceso offline
      saveUserStats(userId, { ...aggregated, lastUpdated: new Date().toISOString() });
      return aggregated;
    }

    // --- Fallback local: calcular métricas en el cliente ---
    const inboxEmails = await getMails('inbox');
    const sentEmails = await getMails('sent');
    const trashEmails = await getMails('trash');
    
    // Combinar todos los correos para análisis
    const allEmails = [...inboxEmails, ...sentEmails, ...trashEmails];
    
    // Estructura para las estadísticas
    const stats = {
      lastUpdated: new Date().toISOString(),
      emailCounts: {
        total: allEmails.length,
        inbox: inboxEmails.length,
        sent: sentEmails.length,
        trash: trashEmails.length,
        unread: inboxEmails.filter(email => !email.read).length
      },
      activityMetrics: calculateActivityMetrics(allEmails),
      folderDistribution: calculateFolderDistribution(userId, allEmails),
      tagDistribution: calculateTagDistribution(userId, allEmails),
      contactAnalysis: analyzeContacts(allEmails),
      responseMetrics: calculateResponseMetrics(inboxEmails, sentEmails)
    };
    
    // Guardar estadísticas en localStorage
    saveUserStats(userId, stats);
    
    return stats;
  } catch (error) {
    console.error('Error al generar estadísticas:', error);
    return {
      error: true,
      message: 'No se pudieron generar las estadísticas'
    };
  }
};

/**
 * Calcula métricas de actividad (correos por día/semana/mes)
 * @param {Array} emails - Lista de correos
 * @returns {Object} Métricas de actividad
 */
const calculateActivityMetrics = (emails) => {
  // Inicializar estructura de datos
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Inicializar contadores
  const metrics = {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
    daily: {} // Para gráfico diario
  };
  
  // Preparar estructura para gráfico diario (últimos 7 días)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    metrics.daily[dateStr] = {
      sent: 0,
      received: 0,
      date: dateStr
    };
  }
  
  // Analizar correos
  emails.forEach(email => {
    if (!email.date) return;
    
    const emailDate = new Date(email.date);
    
    // Determinar si es enviado o recibido
    const isSent = email.from && email.from.includes('@lovenda.app');
    
    // Contar por período
    if (emailDate >= today) {
      metrics.today++;
    } else if (emailDate >= yesterday) {
      metrics.yesterday++;
    }
    
    if (emailDate >= oneWeekAgo) {
      metrics.thisWeek++;
      
      // Agregar al gráfico diario
      const dateStr = emailDate.toISOString().split('T')[0];
      if (metrics.daily[dateStr]) {
        if (isSent) {
          metrics.daily[dateStr].sent++;
        } else {
          metrics.daily[dateStr].received++;
        }
      }
    }
    
    if (emailDate >= oneMonthAgo) {
      metrics.thisMonth++;
    }
  });
  
  // Convertir el objeto daily a un array para facilitar el renderizado
  metrics.dailyGraph = Object.values(metrics.daily);
  
  return metrics;
};

/**
 * Calcula la distribución de correos por carpeta
 * @param {string} userId - ID del usuario
 * @param {Array} emails - Lista de correos
 * @returns {Object} Distribución por carpetas
 */
const calculateFolderDistribution = (userId, emails) => {
  const folderDistribution = {
    system: {
      inbox: 0,
      sent: 0,
      trash: 0
    },
    custom: []
  };
  
  // Contar correos por carpeta del sistema
  emails.forEach(email => {
    if (email.folder === 'inbox') folderDistribution.system.inbox++;
    else if (email.folder === 'sent') folderDistribution.system.sent++;
    else if (email.folder === 'trash') folderDistribution.system.trash++;
  });
  
  // Obtener carpetas personalizadas
  const customFolders = getUserFolders(userId);
  
  // Contar correos por carpeta personalizada
  customFolders.forEach(folder => {
    const folderEmails = getEmailsInFolder(userId, folder.id);
    folderDistribution.custom.push({
      id: folder.id,
      name: folder.name,
      count: folderEmails.length
    });
  });
  
  return folderDistribution;
};

/**
 * Calcula la distribución de correos por etiquetas
 * @param {string} userId - ID del usuario
 * @param {Array} emails - Lista de correos
 * @returns {Object} Distribución por etiquetas
 */
const calculateTagDistribution = (userId, emails) => {
  // Obtener todas las etiquetas disponibles
  const allTags = getUserTags(userId);
  
  // Inicializar contadores para cada etiqueta
  const tagStats = allTags.map(tag => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    count: 0
  }));
  
  // Contar correos por etiqueta
  allTags.forEach(tag => {
    const taggedEmails = getEmailsByTag(userId, tag.id);
    const tagStat = tagStats.find(ts => ts.id === tag.id);
    if (tagStat) {
      tagStat.count = taggedEmails.length;
    }
  });
  
  // Ordenar por cantidad (mayor a menor)
  tagStats.sort((a, b) => b.count - a.count);
  
  return tagStats;
};

/**
 * Analiza la distribución de correos por contactos
 * @param {Array} emails - Lista de correos
 * @returns {Object} Análisis de contactos
 */
const analyzeContacts = (emails) => {
  const contactMap = new Map();
  
  emails.forEach(email => {
    // Procesar remitente
    if (email.from && !email.from.includes('@lovenda.app')) {
      const senderName = extractNameFromEmail(email.from);
      const senderContact = contactMap.get(senderName) || { 
        name: senderName, 
        sent: 0, 
        received: 0,
        lastContact: null
      };
      
      senderContact.received++;
      
      if (!senderContact.lastContact || new Date(email.date) > new Date(senderContact.lastContact)) {
        senderContact.lastContact = email.date;
      }
      
      contactMap.set(senderName, senderContact);
    }
    
    // Procesar destinatario
    if (email.to && !email.to.includes('@lovenda.app')) {
      const recipientName = extractNameFromEmail(email.to);
      const recipientContact = contactMap.get(recipientName) || { 
        name: recipientName, 
        sent: 0, 
        received: 0,
        lastContact: null 
      };
      
      recipientContact.sent++;
      
      if (!recipientContact.lastContact || new Date(email.date) > new Date(recipientContact.lastContact)) {
        recipientContact.lastContact = email.date;
      }
      
      contactMap.set(recipientName, recipientContact);
    }
  });
  
  // Convertir a array y ordenar por número total de interacciones
  const contacts = Array.from(contactMap.values())
    .map(contact => ({
      ...contact,
      total: contact.sent + contact.received
    }))
    .sort((a, b) => b.total - a.total);
  
  return {
    topContacts: contacts.slice(0, 5),
    totalContacts: contacts.length,
    contacts: contacts
  };
};

/**
 * Extrae el nombre de una dirección de correo
 * @param {string} emailAddress - Dirección de correo (puede incluir nombre)
 * @returns {string} Nombre extraído
 */
const extractNameFromEmail = (emailAddress) => {
  if (!emailAddress) return 'Desconocido';
  
  // Si tiene formato "Nombre <email@ejemplo.com>"
  const match = emailAddress.match(/^([^<]+)\s*<([^>]+)>$/);
  if (match) {
    return match[1].trim();
  }
  
  // Si es solo correo, extraer parte local
  const parts = emailAddress.split('@');
  if (parts.length === 2) {
    return parts[0];
  }
  
  return emailAddress;
};

/**
 * Calcula métricas de respuesta (tiempo promedio, tasa de respuesta)
 * @param {Array} inboxEmails - Correos recibidos
 * @param {Array} sentEmails - Correos enviados
 * @returns {Object} Métricas de respuesta
 */
const calculateResponseMetrics = (inboxEmails, sentEmails) => {
  // Mapear correos enviados por referencia a correo original (In-Reply-To)
  const repliesMap = new Map();
  
  sentEmails.forEach(email => {
    if (email.inReplyTo) {
      repliesMap.set(email.inReplyTo, email);
    }
  });
  
  // Analizar tiempos de respuesta
  let totalResponseTime = 0;
  let responseCount = 0;
  
  inboxEmails.forEach(receivedEmail => {
    const reply = repliesMap.get(receivedEmail.id);
    
    if (reply) {
      const receivedDate = new Date(receivedEmail.date);
      const replyDate = new Date(reply.date);
      
      if (receivedDate && replyDate) {
        const responseTime = replyDate - receivedDate;
        totalResponseTime += responseTime;
        responseCount++;
      }
    }
  });
  
  // Calcular métricas
  const metrics = {
    responseRate: inboxEmails.length > 0 ? (responseCount / inboxEmails.length) : 0,
    averageResponseTime: responseCount > 0 ? (totalResponseTime / responseCount) : null,
    responseCount: responseCount,
    formattedAvgResponseTime: null
  };
  
  // Formatear tiempo de respuesta promedio en formato amigable
  if (metrics.averageResponseTime !== null) {
    const avgMinutes = Math.floor(metrics.averageResponseTime / (1000 * 60));
    
    if (avgMinutes < 60) {
      metrics.formattedAvgResponseTime = `${avgMinutes} minutos`;
    } else if (avgMinutes < 24 * 60) {
      metrics.formattedAvgResponseTime = `${Math.floor(avgMinutes / 60)} horas`;
    } else {
      metrics.formattedAvgResponseTime = `${Math.floor(avgMinutes / (60 * 24))} días`;
    }
  }
  
  return metrics;
};

export {
  generateUserStats,
  getUserStats,
  saveUserStats
};
