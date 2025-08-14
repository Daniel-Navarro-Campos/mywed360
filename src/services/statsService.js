/**
 * Servicio para recolectar y analizar estadísticas de uso del sistema de correo
 * Proporciona métricas sobre actividad de correo, patrones de comunicación, 
 * distribución por etiquetas y carpetas, etc.
 */

import { getMails } from './emailService';
import { getUserFolders, getEmailsInFolder } from './folderService';
import { getUserTags, getEmailsByTag, getEmailTagsDetails } from './tagService';
import { getAggregatedStats, getDailyStats } from './emailMetricsService';

// --- Abstracción de almacenamiento (sobrecargable en tests) ---
let _storageProvider = () =>
  (typeof window !== 'undefined' && window.localStorage) ||
  (typeof globalThis !== 'undefined' && globalThis.localStorage) ||
  null;

// Permite inyectar un almacenamiento mockeado en los tests
const __setStorageProviderForTests = (providerFn) => {
  _storageProvider = providerFn;
};

// Utilidad para acceder a localStorage de forma segura (Node o JSDOM)
const safeLocalStorage = () => {
  if (typeof globalThis !== 'undefined') {
    return (globalThis.window && globalThis.window.localStorage) || globalThis.localStorage || null;
  }
  return null;
};

/**
 * Almacena las estadísticas de correo del usuario en localStorage
 * @param {string} userId - ID del usuario
 * @param {Object} stats - Estadísticas a almacenar
 */
const saveUserStats = (userId, stats) => {
  if (!userId) return;
  const ls = _storageProvider();
  if (ls && typeof ls.setItem === 'function') {
    ls.setItem(`lovenda_email_stats_${userId}`, JSON.stringify(stats));
  }
};

/**
 * Recupera las estadísticas de correo del usuario desde localStorage
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas del usuario o un objeto vacío
 */
const getUserStats = (userId) => {
  if (!userId) return {};
  try {
    const ls = _storageProvider();
    if (!ls || typeof ls.getItem !== 'function') return {};
    const raw = ls.getItem(`lovenda_email_stats_${userId}`);
    return raw ? JSON.parse(raw) : {};
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
    let aggregated = null;
    try {
      aggregated = await getAggregatedStats(userId);
    } catch (err) {
      // Silenciar errores de permisos o red: continuamos con cálculo local
      console.warn('getAggregatedStats failed, falling back to local calc:', err?.message);
    }
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
      folderDistribution: await calculateFolderDistribution(userId, allEmails),
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
const calculateFolderDistribution = async (userId, emails) => {
  const systemCounts = { inbox: 0, sent: 0, trash: 0 };

  // Contar correos por carpeta del sistema
  emails.forEach(email => {
    if (email.folder === 'inbox') systemCounts.inbox++;
    else if (email.folder === 'sent') systemCounts.sent++;
    else if (email.folder === 'trash') systemCounts.trash++;
  });

  // Carpetas personalizadas
  const customFolders = getUserFolders(userId);
  const customCounts = [];
  for (const folder of customFolders) {
    try {
      const emailsInFolder = await Promise.resolve(getEmailsInFolder(userId, folder.id));
      const count = Array.isArray(emailsInFolder) ? emailsInFolder.length : 0;
      customCounts.push({
        id: folder.id,
        name: folder.name,
        count
      });
    } catch (err) {
      customCounts.push({ id: folder.id, name: folder.name, count: 0 });
    }
  }

  // Generar arrays para gráficos
  const labels = ['Inbox', 'Sent', 'Trash', ...customCounts.map(c => c.name)];
  const data = [systemCounts.inbox, systemCounts.sent, systemCounts.trash, ...customCounts.map(c => c.count)];

  return {
    labels,
    data,
    system: systemCounts,
    custom: customCounts
  };
};

/**
 * Calcula la distribución de correos por etiquetas
 * @param {string} userId - ID del usuario
 * @param {Array} emails - Lista de correos
 * @returns {Object} Distribución por etiquetas
 */
// Devuelve distribución de etiquetas para gráficos
const calculateTagDistribution = (userId, emails) => {
  // Obtener todas las etiquetas disponibles
  const allTags = getUserTags(userId);

  const tagStats = allTags.map(tag => {
    const count = (getEmailsByTag(tag.id) || []).length;
    return { ...tag, count };
  }).sort((a, b) => b.count - a.count);

  const labels = tagStats.map(t => t.name);
  const data = tagStats.map(t => t.count);
  const colors = tagStats.map(t => t.color || '#888888');

  return {
    labels,
    data,
    colors,
    items: tagStats
  };
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
    if (email.from && !email.from.includes('@lovenda.app') && !email.from.includes('@lovenda.com')) {
      const senderName = extractNameFromEmail(email.from);
      const senderContact = contactMap.get(senderName) || { 
        email: email.from,
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
    if (email.to && !email.to.includes('@lovenda.app') && !email.to.includes('@lovenda.com')) {
      const recipientName = extractNameFromEmail(email.to);
      const recipientContact = contactMap.get(recipientName) || { 
        email: email.to,
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
  let contacts = Array.from(contactMap.values())
    .filter(c => !c.email?.includes('@lovenda.com'))
    .map(contact => {
      return {
        ...contact,
        count: contact.received // los tests esperan número de emails recibidos
      };
    })
    .sort((a, b) => b.received - a.received);
  
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
  // Mapear correos entrantes por id
  const inboxMap = new Map(inboxEmails.map(e => [e.id, e]));

  let totalResponseTime = 0;
  let responseCount = 0;

  // Respuestas del usuario a correos recibidos
  sentEmails.forEach(sent => {
    if (!sent.inReplyTo) return;
    const original = inboxMap.get(sent.inReplyTo);
    if (!original) return;
    const t1 = new Date(original.date);
    const t2 = new Date(sent.date);
    if (t1 && t2) {
      totalResponseTime += t2 - t1;
      responseCount++;
    }
  });

  // Respuestas recibidas a correos enviados
  inboxEmails.forEach(received => {
    if (!received.inReplyTo) return;
    const original = sentEmails.find(s => s.id === received.inReplyTo);
    if (!original) return;
    const t1 = new Date(original.date);
    const t2 = new Date(received.date);
    if (t1 && t2) {
      totalResponseTime += t2 - t1;
      responseCount++;
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
  saveUserStats,
  __setStorageProviderForTests
};
