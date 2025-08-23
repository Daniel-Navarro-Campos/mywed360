// Email service – interacts with backend API (Express + Firestore) or Mailgun API
// Email: { id, from, to, subject, body, date, folder, read, attachments }

// Servicio de correo con soporte para Mailgun, backend y fallback a localStorage
// Estructura Mail: { id, from, to, subject, body, date, folder, read, attachments }

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_URL;
const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || 'mywed360.com';

// Define si usamos Mailgun, backend o localStorage como fallback
export const USE_MAILGUN = !!MAILGUN_API_KEY;
// Permitimos usar backend aunque Mailgun esté configurado
export const USE_BACKEND = !!BASE;
const STORAGE_KEY = 'lovenda_mails';

// Obtener dirección de correo personalizada del usuario según su perfil
const getUserEmailAddress = (profile) => {
  if (!profile) return null;
  
  // Prioridad: myWed360Email configurado > emailUsername > emailAlias > generación fallback
  if (profile.myWed360Email && !profile.myWed360Email.startsWith('usuario@')) {
    return profile.myWed360Email;
  }

  // Prioridad de cuentas generadas dentro del dominio
  if (profile.emailUsername) {
    return `${profile.emailUsername}@${MAILGUN_DOMAIN}`;
  }
  
  if (profile.emailAlias) {
    return `${profile.emailAlias}@${MAILGUN_DOMAIN}`;
  }
  
  const loginEmail = profile.email || (profile.account && profile.account.email);
  // Usar email del perfil solo si pertenece al dominio configurado
  if (loginEmail && loginEmail.endsWith(`@${MAILGUN_DOMAIN}`)) {
    return loginEmail;
  }
  
  // Fallback a método anterior
  if (profile.emailAlias) {
    return `${profile.emailAlias}@${MAILGUN_DOMAIN}`;
  }
  
  if (profile.brideFirstName && profile.brideLastName) {
    const normalizedName = `${profile.brideFirstName.toLowerCase()}.${profile.brideLastName.toLowerCase()}`
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^a-z0-9.]/g, '.'); // Reemplazar caracteres no permitidos
    return `${normalizedName}@${MAILGUN_DOMAIN}`;
  }
  
  if (profile.brideFirstName) {
    const normalizedName = profile.brideFirstName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9.]/g, '.');
    return `${normalizedName}@${MAILGUN_DOMAIN}`;
  }
  
  if (profile.userId) {
    return `user${profile.userId}@${MAILGUN_DOMAIN}`;
  }

  // Intentar generar alias a partir del email de inicio de sesión primero
  if (loginEmail) {
    let prefix = loginEmail.split('@')[0].toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (prefix.length > 8) {
      prefix = prefix.slice(0,4);
    }
    if (prefix.length >=3 && prefix !== 'usuario') {
      return `${prefix}@${MAILGUN_DOMAIN}`;
    }
  }

  // Si no, generar a partir del nombre
  if (profile.name) {
    const first = profile.name.split(' ')[0].toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (first.length >= 3 && first !== 'usuario') {
      return `${first}@${MAILGUN_DOMAIN}`;
    }
  }

  if (profile.email) {
    let prefix = profile.email.split('@')[0].toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (prefix.length > 8) {
      // Usar los primeros 4 caracteres para un alias más corto (ej: dani)
      prefix = prefix.slice(0, 4);
    }
    if (prefix.length >= 3) {
      return `${prefix}@${MAILGUN_DOMAIN}`;
    }
  }
  
  return `usuario@${MAILGUN_DOMAIN}`;
};

// Almacena el usuario actual y su dirección de correo
let CURRENT_USER = null;
let CURRENT_USER_EMAIL = null;

// Inicializar el servicio con el perfil del usuario
export async function initEmailService(userProfile) {
  CURRENT_USER = userProfile;
  CURRENT_USER_EMAIL = getUserEmailAddress(userProfile);
  
  // Verificar si el usuario ya tiene configurado un nombre de usuario para correo
  if (!userProfile.emailUsername && !userProfile.myWed360Email) {
    console.log('Usuario sin nombre de correo configurado. Recomendado configurar en /email/setup');
  }
  
  // Persistir en el perfil si aún no existe o cambió
  try {
    if (!userProfile.myWed360Email || userProfile.myWed360Email !== CURRENT_USER_EMAIL) {
      userProfile.myWed360Email = CURRENT_USER_EMAIL;
      // Guardar de nuevo en localStorage para futuras sesiones
      const storedProfile = localStorage.getItem('lovenda_user_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        parsed.myWed360Email = CURRENT_USER_EMAIL;
        localStorage.setItem('lovenda_user_profile', JSON.stringify(parsed));
      } else {
        localStorage.setItem('lovenda_user_profile', JSON.stringify(userProfile));
      }
    }
  } catch (e) {
    console.warn('No se pudo persistir myWed360Email:', e);
  }

  console.log(`Servicio de email inicializado para: ${CURRENT_USER_EMAIL}`);
  return CURRENT_USER_EMAIL;
}

function uuid() {
  return (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
}

function loadLocal() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveLocal(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// Funciones de integración con Mailgun - Ahora usando Firebase Cloud Functions como proxy seguro
// Flag para no seguir intentando si Mailgun/Firebase devuelve error permanente (CORS/404)
let mailgunDisabled = false;
// Control de errores backend para evitar spam de 500 y reintentos inmediatos
let backendDisabledUntil = 0; // epoch ms hasta cuándo no intentamos backend
const BACKEND_BACKOFF_MS = 30000; // 30s de backoff

async function fetchMailgunEvents(userEmail, eventType = 'delivered') {
  if (mailgunDisabled) {
    return []; // Salir temprano si se ha deshabilitado
  }
  if (!USE_MAILGUN) {
    console.warn('Configuración de Mailgun no disponible, usando datos locales');
    return []; // Devolver un array vacío en lugar de lanzar una excepción
  }
  
  const params = new URLSearchParams({
    recipient: userEmail,
    event: eventType,
    limit: 50
  });
  
  try {
    // Establecer un timeout para la petición
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos de timeout

    // Intentar primero el endpoint del backend y usar Cloud Function como fallback
    const backendBase = import.meta.env.VITE_BACKEND_BASE_URL;
    const endpointUrl = backendBase
      ? `${backendBase}/api/mailgun/events?${params.toString()}`
      : `${(import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-lovenda-98c77.cloudfunctions.net')}/getMailgunEvents?${params.toString()}`;

    const response = await fetch(endpointUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Error al obtener eventos de correo: ${response.status}`);
      // Deshabilitar futuros intentos para evitar spam de errores
      mailgunDisabled = true;
      return [];
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    // Manejar errores sin romper la aplicación
    console.error('Error con Mailgun, usando fallback:', error);
    // Deshabilitar futuros intentos
    mailgunDisabled = true;
    return []; // Devolver array vacío para continuar con la app
  }
}

// Convertir eventos de Mailgun a formato interno de emails
function mapMailgunEventsToMails(events, folder) {
  return events.map(event => {
    const message = event.message || {};
    const storage = event.storage || {};
    
    return {
      id: event.id || uuid(),
      from: message.headers?.from || event.message?.from || 'desconocido@ejemplo.com',
      to: message.headers?.to || event.recipient || CURRENT_USER_EMAIL,
      subject: message.headers?.subject || storage.subject || '(Sin asunto)',
      body: storage.bodyHtml || storage.bodyPlain || message.headers?.['message-id'] || '',
      date: new Date(event.timestamp * 1000).toISOString(),
      folder: folder,
      read: false,
      attachments: []
    };
  });
}

export async function getMails(folder = 'inbox') {
  if (!CURRENT_USER_EMAIL) {
    return { success: false, error: 'Servicio de email no inicializado' };
  }

  // Soporte para carpeta "all": combinar bandeja de entrada y enviados
  if (folder === 'all') {
    try {
      const inboxMails = await getMails('inbox');
      const sentMails  = await getMails('sent');
      // Unir y ordenar por fecha descendente
      const merged = [...inboxMails, ...sentMails].sort((a, b) => {
        const da = new Date(a.date || 0);
        const db = new Date(b.date || 0);
        return db - da;
      });
      return merged;
    } catch (err) {
      console.warn('Error obteniendo correos "all":', err);
      // Continuar con flujo normal si algo falla
    }
  }
  
  if (USE_MAILGUN) {
    try {
      // Para bandeja de entrada, obtenemos los correos recibidos
      if (folder === 'inbox') {
        const events = await fetchMailgunEvents(CURRENT_USER_EMAIL, 'delivered');
        const inboxMails = mapMailgunEventsToMails(events, folder);
        if (inboxMails.length > 0) {
          return inboxMails; // Mailgun devolvió datos
        }
        // Si Mailgun no devuelve nada, intentamos backend/Firestore como fallback
        console.info('Mailgun no devolvió eventos, usando backend como fallback');
        try {
          const backendUrl = BASE || 'http://localhost:4004';
          const res = await fetch(`${backendUrl}/api/mail?folder=${encodeURIComponent(folder)}&user=${encodeURIComponent(CURRENT_USER_EMAIL)}`);
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json)) {
              return json;
            }
          }
        } catch (err) {
          console.warn('Fallback backend también falló:', err);
        }
        return inboxMails;
      }
      // Para enviados, obtenemos los correos enviados por este usuario
      else if (folder === 'sent') {
        // Consulta diferente para correos enviados
        const events = await fetchMailgunEvents(CURRENT_USER_EMAIL, 'accepted');
        return mapMailgunEventsToMails(events, folder);
      }
      else {
        // Otras carpetas (borradores, spam, etc)
        return [];
      }
    } catch (error) {
      console.error('Error con Mailgun, usando fallback:', error);
      // Fallback al método normal si falla Mailgun
    }
  }
  
  if (USE_BACKEND) {
    try {
      const now = Date.now();
      if (now < backendDisabledUntil) {
        // Saltar intento durante backoff
        return [];
      }
      // Añadir timeout para evitar cuelgues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${BASE}/api/mail?folder=${encodeURIComponent(folder)}&user=${encodeURIComponent(CURRENT_USER_EMAIL)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        console.warn(`Backend /api/mail devolvió ${res.status}. Activando backoff ${BACKEND_BACKOFF_MS}ms`);
        backendDisabledUntil = Date.now() + BACKEND_BACKOFF_MS;
        return [];
      }
      const json = await res.json();
      // Si backend devuelve array directamente
      if (Array.isArray(json)) {
        // Si estamos en inbox y no llegó ningún mail y ya buscábamos por usuario,
        // intentar descubrir dirección correcta a partir de cualquier correo existente.
        if (folder === 'inbox' && json.length === 0 && CURRENT_USER_EMAIL && CURRENT_USER_EMAIL.startsWith('usuario')) {
          try {
            const altRes = await fetch(`${BASE}/api/mail?folder=inbox`); // sin filtro user
            if (altRes.ok) {
              const allMails = await altRes.json();
              const myMail = allMails.find(m => m.to && m.to.endsWith(`@${MAILGUN_DOMAIN}`));
              if (myMail) {
                const newAddr = myMail.to;
                console.log('Descubierta dirección real de correo:', newAddr);
                // Persistir y actualizar
                if (typeof window !== 'undefined') {
                  const stored = localStorage.getItem('lovenda_user_profile');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.myWed360Email = newAddr;
                    localStorage.setItem('lovenda_user_profile', JSON.stringify(parsed));
                  }
                }
                CURRENT_USER_EMAIL = newAddr;
                // Reintentar obtener mails con la dirección correcta
                const retry = await fetch(`${BASE}/api/mail?folder=${encodeURIComponent(folder)}&user=${encodeURIComponent(CURRENT_USER_EMAIL)}`);
                if (retry.ok) {
                  return await retry.json();
                }
              }
            }
          } catch (e) {
            console.warn('No se pudo descubrir dirección alternativa:', e);
          }
        }
        return json;
      }
      // Si el backend responde pero success es false, lanzamos para caer al fallback
      console.warn('Respuesta backend inesperada en /api/mail (no es array). Activando backoff.');
      backendDisabledUntil = Date.now() + BACKEND_BACKOFF_MS;
      return [];
    } catch (error) {
      console.error('Error con backend, usando localStorage:', error);
      backendDisabledUntil = Date.now() + BACKEND_BACKOFF_MS;
      // Fallback a localStorage si falla el backend
    }
  }
  
  // Fallback local
  const mails = loadLocal();
  return mails.filter(m => m.folder === folder && 
    (folder === 'sent' ? m.from === CURRENT_USER_EMAIL : m.to === CURRENT_USER_EMAIL));
}

import validateAttachments from '../utils/validateAttachments';
import * as MailgunService from './mailgunService';

// Enviar correo usando Mailgun API
export async function sendMailWithMailgun({ from, to, subject, body, attachments = [] }) {
  if (!USE_MAILGUN || !MailgunService.isMailgunConfigured()) {
    throw new Error('Configuración de Mailgun no disponible');
  }

  // Si no se proporciona remitente, usamos el correo del usuario actual
  if (!from && CURRENT_USER_EMAIL) {
    from = CURRENT_USER_EMAIL;
  }
  
  if (!from) {
    throw new Error('Remitente no especificado');
  }

  try {
    // Usar el nuevo servicio especializado de Mailgun
    const result = await MailgunService.sendEmail({
      from,
      to,
      subject,
      html: body,
      attachments: attachments.map((attachment, index) => ({
        file: attachment.file,
        name: attachment.filename || `adjunto-${index+1}`
      }))
    });
    
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
  } catch (error) {
    console.error('Error al enviar correo con Mailgun:', error);
    throw error;
  }
}

// Crear un alias de correo para el usuario
export async function createEmailAlias(userProfile, aliasName) {
  if (!USE_MAILGUN || !MAILGUN_API_KEY) {
    throw new Error('Configuración de Mailgun no disponible');
  }
  
  // Validamos y normalizamos el alias
  const normalizedAlias = aliasName.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]/g, '.');
  
  // Verificar que el alias sea válido
  if (!normalizedAlias || normalizedAlias.length < 3) {
    throw new Error('El alias debe tener al menos 3 caracteres válidos');
  }
  
  const newEmail = `${normalizedAlias}@${MAILGUN_DOMAIN}`;
  
  try {
    // Aquí iría la lógica para verificar disponibilidad del alias
    // y registrarlo en Mailgun si fuera necesario
    
    // Por ahora, simplemente actualizamos el perfil con el nuevo alias
    userProfile.emailAlias = normalizedAlias;
    CURRENT_USER = userProfile;
    CURRENT_USER_EMAIL = newEmail;
    
    return {
      success: true,
      email: newEmail,
      alias: normalizedAlias
    };
  } catch (error) {
    console.error('Error al crear alias de correo:', error);
    throw error;
  }
}

// Sanitiza HTML muy básico para eliminar scripts potencialmente peligrosos
function sanitizeHtml(html = '') {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
}

export async function sendMail({ to, subject = '', body = '', attachments = [] }) {
  // --- Validaciones previas ---
  // Destinatario requerido
  if (!to || to.trim() === '') {
    return { success: false, error: 'Destinatario es obligatorio' };
  }
  // Máximo 50 destinatarios
  const recipients = to.split(/[;,]+/).map(r => r.trim()).filter(Boolean);
  if (recipients.length > 50) {
    return { success: false, error: 'demasiados destinatarios' };
  }
  // Limitar asunto a 255 caracteres (truncar si es necesario)
  if (subject.length > 255) {
    subject = subject.slice(0, 255);
  }
  // Sanitizar body
  body = sanitizeHtml(body);

  // Validar adjuntos
  try {
    validateAttachments(attachments);
  } catch (err) {
    return { success: false, error: err.message };
  }
  if (!CURRENT_USER_EMAIL) {
    throw new Error('Servicio de email no inicializado con perfil de usuario');
  }

  // Intentar enviar con Mailgun si está configurado
  if (USE_MAILGUN) {
    try {
      const mailgunResponse = await sendMailWithMailgun({
        from: CURRENT_USER_EMAIL,
        to,
        subject,
        body,
        attachments
      });
      
      // Crear objeto de correo enviado para compatibilidad
      const mailSent = {
        id: mailgunResponse.messageId || uuid(),
        from: CURRENT_USER_EMAIL,
        to,
        subject,
        body,
        date: new Date().toISOString(),
        folder: 'sent',
        read: true,
        attachments: attachments || []
      };
      
      // Guardar en local también para respaldo
      const mails = loadLocal();
      mails.push(mailSent);
      saveLocal(mails);
      
      return { success: true, ...mailSent };
    } catch (error) {
      console.error('Error con Mailgun, usando fallback:', error);
      // Fallback al método normal si falla Mailgun
    }
  }
  
  // Backend fallback
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          from: CURRENT_USER_EMAIL,
          to, 
          subject, 
          body,
          attachments
        }),
      });
            if (!res.ok) {
        const message = `Error HTTP ${res.status}`;
        return { success: false, error: message };
      }
      const jsonBackend = await res.json();
      return jsonBackend;
    } catch (error) {
      console.error('Error con backend, usando localStorage:', error);
    }
  }
  
  // Fallback local
  const mails = loadLocal();
  const mailSent = {
    id: uuid(),
    from: CURRENT_USER_EMAIL,
    to,
    subject,
    body,
    date: new Date().toISOString(),
    folder: 'sent',
    read: true,
    attachments: attachments || []
  };
  mails.push(mailSent);
  
  // Simulamos recepción para pruebas locales
  // Solo si el destinatario es del mismo dominio
  if (to.includes(`@${MAILGUN_DOMAIN}`)) {
    const mailReceived = {
      ...mailSent,
      id: uuid(),
      folder: 'inbox',
      read: false,
    };
    mails.push(mailReceived);
  }
  
  saveLocal(mails);
  return { success: true, ...mailSent };
}

// Alias para compatibilidad con componentes y tests que usan sendEmail
export async function sendEmail(options) {
  return sendMail(options);
}

// Obtener correo individual (con fallback a local)
export async function getMail(id) {
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/mail/${id}`);
      if (!res.ok) {
        let json;
        try { json = await res.json(); } catch (_) {}
        const err = new Error(json?.message || 'Email no encontrado');
        err.status = res.status;
        throw err;
      }
      const json = await res.json();
      if (!json.success) {
        const err = new Error(json.message || 'Error al obtener correo');
        err.status = res.status;
        throw err;
      }
      return { success: true, ...json.data };
    } catch (error) {
      throw error;
    }
  }
  // Fallback local
  const mails = loadLocal();
  const mail = mails.find(m => m.id === id);
  if (!mail) {
    const err = new Error('Correo no encontrado');
    err.status = 404;
    throw err;
  }
  return mail;
}

export async function markAsRead(id) {
  console.log('[EmailService] markAsRead', { id, BASE });
  // Si hay backend disponible, priorizarlo siempre
  if (BASE) {
    try {
      const res = await fetch(`${BASE}/api/mail/${id}/read`, { method: 'POST' });
      if (!res.ok) throw new Error('Error marcar leído');
      const json = await res.json();
      return json.success ? json : { success: true };
    } catch (err) {
      console.warn('Fallo backend markAsRead, usando fallback local:', err);
    }
  }
  // Fallback a localStorage
  const mails = loadLocal();
  const updated = mails.map(m => m.id === id ? { ...m, read: true } : m);
  saveLocal(updated);
  return { success: true };
}

export async function deleteMail(id) {
  console.log('[EmailService] deleteMail', { id, BASE });
  // Intentar siempre backend primero
  if (BASE) {
    try {
      const res = await fetch(`${BASE}/api/mail/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando mail');
      return { success: true };
    } catch (err) {
      console.warn('Fallo backend deleteMail, usando fallback local:', err);
    }
  }
  // Fallback localStorage
  const mails = loadLocal();
  saveLocal(mails.filter(m => m.id !== id));
  return { success: true };
}

// ========== Funciones para gestión de plantillas de email ==========

// Clave para almacenamiento local de plantillas
const TEMPLATES_STORAGE_KEY = 'lovenda_email_templates';

// Importar plantillas predefinidas
import { allTemplates } from '../data/templates';

// Importar el servicio de caché
import templateCache from './TemplateCacheService';

/**
 * Carga las plantillas de email almacenadas. Si no existen, inicializa con las plantillas predefinidas.
 * @param {boolean} bypassCache - Si es true, ignora la caché y fuerza una carga fresca
 * @returns {Array} Array con todas las plantillas disponibles
 */
export async function getEmailTemplates(bypassCache = false) {
  // Verificar si hay datos en caché primero
  const { templates: cachedTemplates, fromCache } = templateCache.getCachedTemplates(bypassCache);
  
  // Si tenemos datos en caché, los usamos
  if (fromCache && cachedTemplates) {
    console.log('Usando plantillas desde caché');
    return cachedTemplates;
  }
  
  console.log('Cargando plantillas frescas (no en caché)');
  let templates = [];
  
  // Intentar cargar del backend si está disponible
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/email-templates?user=${encodeURIComponent(CURRENT_USER_EMAIL)}`);
      if (res.ok) {
        templates = await res.json();
        // Guardar en caché para futuras solicitudes
        templateCache.cacheAllTemplates(templates);
        return templates;
      }
    } catch (error) {
      console.error('Error al cargar plantillas del backend:', error);
      // Fallback a localStorage
    }
  }
  
  // Cargar de localStorage o inicializar con plantillas predefinidas
  try {
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (storedTemplates) {
      templates = JSON.parse(storedTemplates);
    } else {
      // Si no hay plantillas guardadas, inicializar con las predefinidas
      templates = allTemplates;
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(allTemplates));
    }
    
    // Guardar en caché para futuras solicitudes
    templateCache.cacheAllTemplates(templates);
    
    return templates;
  } catch (error) {
    console.error('Error al cargar plantillas:', error);
    return [];
  }
}

/**
 * Obtiene una plantilla específica por su ID
 * @param {string} templateId - ID de la plantilla a obtener
 * @param {boolean} bypassCache - Si es true, ignora la caché y fuerza una carga fresca
 * @returns {Object|null} La plantilla encontrada o null
 */
export async function getEmailTemplateById(templateId, bypassCache = false) {
  // Verificar si está en caché primero
  const { template: cachedTemplate, fromCache } = templateCache.getCachedTemplate(templateId, bypassCache);
  
  if (fromCache && cachedTemplate) {
    return cachedTemplate;
  }
  
  // Si no está en caché, cargar todas las plantillas y buscar
  const templates = await getEmailTemplates(bypassCache);
  const template = templates.find(t => t.id === templateId);
  
  // Guardar en caché para futuras solicitudes si existe
  if (template) {
    templateCache.cacheTemplate(template);
  }
  
  return template || null;
}

/**
 * Guarda una plantilla de email nueva o actualiza una existente
 * @param {Object} template - Objeto con datos de la plantilla
 * @returns {Object} La plantilla guardada
 */
export async function saveEmailTemplate(template) {
  let savedTemplate = null;
  
  // Intentar guardar en el backend si está disponible
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/email-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          user: CURRENT_USER_EMAIL
        })
      });
      
      if (res.ok) {
        savedTemplate = await res.json();
        // Actualizar caché con la plantilla guardada
        templateCache.cacheTemplate(savedTemplate);
        // Invalidar caché de todas las plantillas para forzar recarga en próxima solicitud
        templateCache.invalidateAllTemplates();
        return savedTemplate;
      }
    } catch (error) {
      console.error('Error al guardar plantilla en backend:', error);
      // Fallback a localStorage
    }
  }
  
  // Guardar en localStorage
  try {
    // Forzar carga fresca para asegurar datos actualizados
    const templates = await getEmailTemplates(true);
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      // Actualizar plantilla existente, preservando isSystem
      const isSystem = templates[existingIndex].isSystem;
      templates[existingIndex] = { ...template, isSystem };
      savedTemplate = templates[existingIndex];
    } else {
      // Añadir nueva plantilla
      templates.push(template);
      savedTemplate = template;
    }
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    
    // Actualizar caché con la plantilla guardada
    templateCache.cacheTemplate(savedTemplate);
    // Actualizar caché completa
    templateCache.cacheAllTemplates(templates, false);
    
    // Registrar uso de la plantilla para métricas
    if (savedTemplate.category) {
      templateCache.registerTemplateUsage(savedTemplate.id, savedTemplate.category);
    }
    
    return savedTemplate;
  } catch (error) {
    console.error('Error al guardar plantilla:', error);
    throw new Error('No se pudo guardar la plantilla');
  }
}

/**
 * Elimina una plantilla de email
 * @param {string} templateId - ID de la plantilla a eliminar
 * @returns {boolean} Éxito de la operación
 */
export async function deleteEmailTemplate(templateId) {
  // Verificar que no sea una plantilla del sistema
  const templates = await getEmailTemplates();
  const templateToDelete = templates.find(t => t.id === templateId);
  
  if (!templateToDelete) {
    return false; // No existe la plantilla
  }
  
  if (templateToDelete.isSystem) {
    throw new Error('No se pueden eliminar plantillas del sistema');
  }
  
  let success = false;
  
  // Intentar eliminar en backend si está disponible
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/email-templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: CURRENT_USER_EMAIL })
      });
      
      if (res.ok) {
        success = true;
      }
    } catch (error) {
      console.error('Error al eliminar plantilla en backend:', error);
      // Fallback a localStorage
    }
  }
  
  // Eliminar de localStorage si no se pudo en backend o si no se usa backend
  if (!success) {
    try {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
      success = true;
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      return false;
    }
  }
  
  // Si se eliminó exitosamente, actualizar caché
  if (success) {
    // Invalidar la plantilla en caché
    templateCache.invalidateTemplate(templateId);
    
    // Forzar recarga de la lista completa en próximo acceso
    if (USE_BACKEND) {
      templateCache.invalidateAllTemplates();
    } else {
      // Si no hay backend, actualizar caché con la lista actualizada
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      templateCache.cacheAllTemplates(updatedTemplates);
    }
    
    console.log(`Plantilla ${templateId} eliminada y caché actualizada`);
  }
  
  return success;
}

/**
 * Reinicia las plantillas predefinidas del sistema
 * @returns {Array} Lista de plantillas restauradas
 */
export async function resetPredefinedTemplates() {
  try {
    // Obtener todas las plantillas actuales
    const currentTemplates = await getEmailTemplates();
    
    // Filtrar las plantillas personalizadas (no son del sistema)
    const customTemplates = currentTemplates.filter(template => !template.isSystem);
    
    // Combinar plantillas personalizadas con las predefinidas actualizadas
    const updatedTemplates = [...customTemplates, ...allTemplates];
    
    // Guardar la nueva colección
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    
    return updatedTemplates;
  } catch (error) {
    console.error('Error al resetear plantillas predefinidas:', error);
    throw new Error('No se pudieron restaurar las plantillas predefinidas');
  }
}

// =======================
// Exportación por defecto
// =======================
const EmailService = {
  initEmailService,
  getUserEmailAddress,
  getMails,
  getMail,
  sendMail,
  sendEmail,
  sendMailWithMailgun,
  deleteMail,
  markAsRead,
  createEmailAlias,
  getEmailTemplates,
  getEmailTemplateById,
  saveEmailTemplate,
  deleteEmailTemplate,
  resetPredefinedTemplates
};

export default EmailService;
