// Notifications service – interacts with backend API (Express + Firestore)
// Notification: { id, type, message, date, read, providerId?, trackingId?, dueDate?, action? }

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

export async function getNotifications() {
  try {
    const res = await fetch(`${BASE}/api/notifications`);
    if (!res.ok) throw new Error('Error fetching notifications');
    return res.json();
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Modo fallback: devolver notificaciones de localStorage
    return loadLocalNotifications();
  }
}

export async function addNotification(notification) {
  const { type = 'info', message, providerId, trackingId, dueDate, action } = notification;
  
  try {
    const res = await fetch(`${BASE}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        message, 
        providerId, 
        trackingId, 
        dueDate,
        action,
        date: new Date().toISOString(),
        read: false
      }),
    });
    
    if (!res.ok) throw new Error('Error adding notification');
    const notif = await res.json();
    window.dispatchEvent(new CustomEvent('lovenda-notif', { detail: { id: notif.id } }));
    return notif;
  } catch (error) {
    console.error('Error adding notification:', error);
    // Modo fallback: guardar notificación en localStorage
    return addLocalNotification({
      type, 
      message, 
      providerId, 
      trackingId, 
      dueDate,
      action,
      date: new Date().toISOString(), 
      read: false
    });
  }
}

export async function markNotificationRead(id) {
  try {
    const res = await fetch(`${BASE}/api/notifications/${id}/read`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Error marking notification as read');
    return res.json();
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Modo fallback: marcar como leída en localStorage
    return markLocalNotificationRead(id);
  }
}

export async function deleteNotification(id) {
  try {
    const res = await fetch(`${BASE}/api/notifications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting notification');
    // Eliminar también de localStorage por si acaso
    deleteLocalNotification(id);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    // Modo fallback: eliminar de localStorage
    return deleteLocalNotification(id);
  }
}

// =============== PROVIDER TRACKING NOTIFICATIONS ===============

/**
 * Crea una alerta de seguimiento urgente para un proveedor
 * @param {Object} provider - El proveedor para el cual crear la alerta
 * @param {Object} tracking - El registro de seguimiento relacionado
 * @param {string} reason - Motivo del seguimiento urgente
 */
export async function createUrgentTrackingAlert(provider, tracking, reason) {
  return addNotification({
    type: 'warning',
    message: `Seguimiento urgente: ${provider.name} - ${reason}`,
    providerId: provider.id,
    trackingId: tracking.id,
    action: 'viewTracking'
  });
}

/**
 * Crea un recordatorio automático para un proveedor según fecha
 * @param {Object} provider - El proveedor para el cual crear el recordatorio
 * @param {Date} dueDate - Fecha límite del recordatorio
 * @param {string} title - Título del recordatorio
 */
export async function createProviderReminder(provider, dueDate, title) {
  return addNotification({
    type: 'info',
    message: `Recordatorio: ${title} - ${provider.name}`,
    providerId: provider.id,
    dueDate: dueDate.toISOString(),
    action: 'viewProvider'
  });
}

/**
 * Verifica y genera notificaciones automáticas basadas en registros de seguimiento
 * @param {Array} trackingRecords - Lista de registros de seguimiento
 * @param {Array} providers - Lista de proveedores
 */
export function generateTrackingNotifications(trackingRecords, providers) {
  // Comprobar seguimientos urgentes (sin respuesta tras 7 días)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  // Filtrar seguimientos pendientes sin actualización por más de 7 días
  const urgentTrackings = trackingRecords.filter(track => {
    if (track.status !== 'Pendiente' && track.status !== 'Esperando respuesta') {
      return false;
    }
    
    const lastUpdate = new Date(track.lastUpdate || track.date);
    return lastUpdate < sevenDaysAgo;
  });
  
  // Generar notificaciones para seguimientos urgentes
  urgentTrackings.forEach(tracking => {
    // Buscar el proveedor correspondiente
    const provider = providers.find(p => p.id === tracking.providerId);
    if (provider) {
      createUrgentTrackingAlert(
        provider, 
        tracking, 
        'Sin respuesta por más de 7 días'
      );
    }
  });
  
  // Comprobar seguimientos próximos a vencer (recordatorios a 3 días)
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);
  
  // Filtrar seguimientos con fecha límite próxima
  const upcomingTrackings = trackingRecords.filter(track => {
    if (!track.dueDate) return false;
    
    const dueDate = new Date(track.dueDate);
    const isToday = dueDate.toDateString() === now.toDateString();
    const isInThreeDays = (
      dueDate > now && 
      dueDate <= threeDaysFromNow
    );
    
    return isToday || isInThreeDays;
  });
  
  // Generar recordatorios para seguimientos próximos
  upcomingTrackings.forEach(tracking => {
    const provider = providers.find(p => p.id === tracking.providerId);
    if (provider) {
      const dueDate = new Date(tracking.dueDate);
      const isToday = dueDate.toDateString() === now.toDateString();
      
      createProviderReminder(
        provider,
        dueDate,
        isToday ? 'Seguimiento vence HOY' : 'Seguimiento próximo a vencer'
      );
    }
  });
  
  return {
    urgentCount: urgentTrackings.length,
    reminderCount: upcomingTrackings.length
  };
}

// =============== EMAIL NOTIFICATIONS ===============

/**
 * Muestra una notificación en la interfaz de usuario
 * @param {Object} notification - Configuración de la notificación
 * @param {string} notification.title - Título de la notificación
 * @param {string} notification.message - Mensaje de la notificación
 * @param {string} notification.type - Tipo de notificación (success, error, info, warning)
 * @param {number} notification.duration - Duración en ms (opcional, por defecto 3000ms)
 */
export function showNotification({ title, message, type = 'info', duration = 3000 }) {
  // Crear evento personalizado para el sistema de notificaciones
  const event = new CustomEvent('lovenda-toast', { 
    detail: { title, message, type, duration }
  });
  
  // Disparar evento para que lo capture el componente de notificaciones
  window.dispatchEvent(event);
  
  // También registrar en consola para desarrollo
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}

/**
 * Crea una notificación relacionada con un nuevo email recibido
 * @param {Object} email - Datos del email recibido
 */
export async function createNewEmailNotification(email) {
  // Añadir al sistema de notificaciones
  await addNotification({
    type: 'info',
    message: `Nuevo email de ${email.from}: ${email.subject || '(Sin asunto)'}`,
    action: 'viewEmail',
    emailId: email.id
  });
  
  // Mostrar toast inmediato
  showNotification({
    title: 'Nuevo email',
    message: `Has recibido un nuevo email de ${email.from}`,
    type: 'info',
    duration: 5000
  });
}

/**
 * Genera notificaciones para emails importantes o que requieren acción
 * @param {Array} emails - Lista de emails para analizar
 */
export function generateEmailNotifications(emails) {
  if (!emails || !emails.length) return { count: 0 };
  
  // Filtrar emails no leídos
  const unreadEmails = emails.filter(email => !email.read);
  
  // Notificar sobre emails no leídos
  if (unreadEmails.length > 0) {
    showNotification({
      title: 'Emails sin leer',
      message: `Tienes ${unreadEmails.length} ${unreadEmails.length === 1 ? 'email sin leer' : 'emails sin leer'}`,
      type: 'info'
    });
  }
  
  // Filtrar emails importantes y no leídos para notificaciones persistentes
  const importantUnread = unreadEmails.filter(email => 
    email.folder === 'important' || 
    email.subject?.toLowerCase().includes('urgente')
  );
  
  // Crear notificaciones persistentes para emails importantes
  importantUnread.forEach(email => {
    addNotification({
      type: 'warning',
      message: `Email importante: ${email.subject || '(Sin asunto)'}`,
      action: 'viewEmail',
      emailId: email.id
    });
  });
  
  return {
    count: unreadEmails.length,
    importantCount: importantUnread.length
  };
}

// =============== LOCAL STORAGE FALLBACK ===============

// Funciones helper para almacenamiento local de notificaciones
function loadLocalNotifications() {
  try {
    const notifications = JSON.parse(localStorage.getItem('lovenda_notifications') || '[]');
    return notifications;
  } catch (e) {
    console.error('Error loading local notifications:', e);
    return [];
  }
}

function saveLocalNotifications(notifications) {
  try {
    localStorage.setItem('lovenda_notifications', JSON.stringify(notifications));
    return true;
  } catch (e) {
    console.error('Error saving local notifications:', e);
    return false;
  }
}

function addLocalNotification(notification) {
  const notifications = loadLocalNotifications();
  const newNotification = {
    ...notification,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  
  notifications.push(newNotification);
  saveLocalNotifications(notifications);
  
  window.dispatchEvent(new CustomEvent('lovenda-notif', { 
    detail: { id: newNotification.id } 
  }));
  
  return newNotification;
}

function markLocalNotificationRead(id) {
  const notifications = loadLocalNotifications();
  const updatedNotifications = notifications.map(notif => 
    notif.id === id ? { ...notif, read: true } : notif
  );
  
  saveLocalNotifications(updatedNotifications);
  return updatedNotifications.find(n => n.id === id) || null;
}

function deleteLocalNotification(id) {
  const notifications = loadLocalNotifications();
  const updatedNotifications = notifications.filter(notif => notif.id !== id);
  
  saveLocalNotifications(updatedNotifications);
  return true;
}
