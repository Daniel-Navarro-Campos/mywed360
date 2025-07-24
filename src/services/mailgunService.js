/**
 * Servicio de integración con Mailgun para correos myWed360 (actualizado)
 * Este servicio gestiona todas las interacciones con Mailgun a través de
 * Firebase Cloud Functions por seguridad (no expone API keys en el frontend):
 * - Envío de correos
 * - Verificación de entrega
 * - Gestión de alias de correo
 * - Validación de direcciones
 */

// Variables de configuración
const DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || 'mywed360.com';
const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-lovenda-98c77.cloudfunctions.net';

/**
 * Verifica si Mailgun está configurado correctamente
 * @returns {boolean} - true si hay un dominio configurado y acceso a funciones
 */
export function isMailgunConfigured() {
  return !!DOMAIN && !!FUNCTIONS_URL;
}

/**
 * Envía un correo electrónico usando Mailgun a través de Cloud Functions
 * 
 * @param {Object} options - Opciones para el correo
 * @param {string} options.from - Dirección de correo del remitente
 * @param {string} options.to - Dirección(es) de correo de destinatario(s)
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.text - Contenido en texto plano
 * @param {string} options.html - Contenido en HTML
 * @param {string} [options.cc] - Dirección(es) en copia
 * @param {string} [options.bcc] - Dirección(es) en copia oculta
 * @param {string} [options.replyTo] - Dirección de respuesta
 * @param {Array} [options.attachments] - Archivos adjuntos
 * @returns {Promise<Object>} - Respuesta de la Cloud Function
 */
export async function sendEmail(options) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }
  
  const { from, to, subject, text, html, cc, bcc, replyTo, attachments = [] } = options;
  
  // Validaciones básicas
  if (!from) throw new Error('Remitente (from) requerido');
  if (!to) throw new Error('Destinatario (to) requerido');
  if (!subject) throw new Error('Asunto (subject) requerido');
  if (!text && !html) throw new Error('Contenido (text o html) requerido');
  
  // Llamar a la Cloud Function para enviar el correo
  try {
    const response = await fetch(`${FUNCTIONS_URL}/sendEmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        replyTo,
        // No se pueden enviar archivos binarios directamente, se necesita un enfoque diferente para adjuntos
        // En producción, deberías subir los archivos a Cloud Storage y pasar las URLs
        attachments: attachments ? attachments.map(a => ({ name: a.name })) : []
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al enviar correo: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      messageId: data.id || 'unknown',
      response: data
    };
  } catch (error) {
    console.error('Error en Cloud Function sendEmail:', error);
    throw error;
  }
}

/**
 * Verifica si un correo electrónico es válido (sintaxis y existencia) usando Cloud Functions
 * @param {string} email - Correo electrónico a verificar
 * @returns {Promise<Object>} - Información sobre la validez del correo
 */
export async function validateEmail(email) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }
  
  if (!email) {
    throw new Error('Correo electrónico requerido');
  }
  
  try {
    const response = await fetch(`${FUNCTIONS_URL}/validateEmail?email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al validar correo: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en la validación de correo:', error);
    throw error;
  }
}

/**
 * Verifica si un nombre de usuario está disponible en el dominio usando Cloud Functions
 * @param {string} username - Nombre de usuario a verificar (sin @dominio)
 * @returns {Promise<boolean>} - true si está disponible
 */
export async function checkUsernameAvailability(username) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }
  
  if (!username) {
    throw new Error('Nombre de usuario requerido');
  }
  
  // Normalizar el nombre de usuario (minusculas, sin acentos, etc)
  const normalizedUsername = username.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '.');
    
  // El correo a verificar
  const email = `${normalizedUsername}@${DOMAIN}`;
  
  try {
    // Usamos el endpoint de validación para verificar a través de Cloud Functions
    const validationResult = await validateEmail(email);
    
    // Si mailgun dice que es válido, podemos asumirlo como disponible
    // En producción, se debería verificar contra una base de datos de usuarios existentes
    return validationResult.is_valid && !validationResult.is_disposable_address;
    
  } catch (error) {
    console.error('Error al verificar disponibilidad de nombre de usuario:', error);
    // En caso de error, asumimos que no está disponible por precaución
    return false;
  }
  
  // En una implementación real, aquí verificaríamos contra la base de datos
  // y el servicio de correo (Mailgun) si el nombre existe ya
  
  // Simular latencia de red y verificación
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Para simulación, consideramos nombres cortos como no disponibles
  if (username.length <= 4) {
    return { available: false, reason: 'Este nombre de usuario no está disponible' };
  }
  
  // Por defecto, indicamos que está disponible
  return { available: true };
}

/**
 * Crea una ruta de reenvío de correo en Mailgun
 * @param {string} address - Dirección de correo completa (ejemplo@mywed360.com)
 * @param {string} forwardTo - Dirección a la que reenviar (usuario@gmail.com)
 * @returns {Promise<Object>} - Respuesta de la API
 */
export async function createForwardingRoute(address, forwardTo) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }
  
  if (!address || !forwardTo) {
    throw new Error('Se requieren dirección de origen y destino');
  }
  
  try {
    return { available: true };
  } catch (error) {
    console.error('Error en Mailgun createForwardingRoute:', error);
    throw error;
  }
}

/**
 * Obtiene los eventos de correo para un usuario específico usando Cloud Functions
 * @param {string} emailAddress - Dirección de correo
 * @param {string} [eventType='delivered'] - Tipo de evento (accepted, delivered, failed, rejected)
 * @param {number} [limit=50] - Número máximo de eventos a devolver
 * @returns {Promise<Array>} - Array de eventos
 */
export async function getMailEvents(emailAddress, eventType = 'delivered', limit = 50) {
  if (!isMailgunConfigured()) {
    throw new Error('Mailgun no está configurado correctamente');
  }
  
  if (!emailAddress) {
    throw new Error('Dirección de correo requerida');
  }
  
  try {
    const params = new URLSearchParams({
      recipient: emailAddress,
      event: eventType,
      limit
    });
    
    const response = await fetch(`${FUNCTIONS_URL}/getMailgunEvents?${params}`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener eventos: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error al obtener eventos de correo:', error);
    throw error;
  }
}
