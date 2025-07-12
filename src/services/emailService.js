// Email service – interacts with backend API (Express + Firestore) or Mailgun API
// Email: { id, from, to, subject, body, date, folder, read, attachments }

// Servicio de correo con soporte para Mailgun, backend y fallback a localStorage
// Estructura Mail: { id, from, to, subject, body, date, folder, read, attachments }

const BASE = import.meta.env.VITE_BACKEND_BASE_URL;
const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN || 'lovenda.com';

// Define si usamos Mailgun, backend o localStorage como fallback
const USE_MAILGUN = !!MAILGUN_API_KEY;
const USE_BACKEND = !USE_MAILGUN && !!BASE;
const STORAGE_KEY = 'lovenda_mails';

// Obtener dirección de correo personalizada del usuario según su perfil
const getUserEmailAddress = (profile) => {
  if (!profile) return null;
  
  // Prioridad: dirección ya asignada > nombre+apellido > nombre > id
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
  
  return `usuario@${MAILGUN_DOMAIN}`;
};

// Almacena el usuario actual y su dirección de correo
let CURRENT_USER = null;
let CURRENT_USER_EMAIL = null;

// Inicializar el servicio con el perfil del usuario
export function initEmailService(userProfile) {
  CURRENT_USER = userProfile;
  CURRENT_USER_EMAIL = getUserEmailAddress(userProfile);
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

// Funciones de integración con Mailgun
async function fetchMailgunEvents(userEmail, eventType = 'delivered') {
  if (!USE_MAILGUN || !MAILGUN_API_KEY) {
    throw new Error('Configuración de Mailgun no disponible');
  }
  
  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events`;
  const params = new URLSearchParams({
    recipient: userEmail,
    event: eventType,
    limit: 50
  });
  
  const auth = btoa(`api:${MAILGUN_API_KEY}`);
  
  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error de Mailgun: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error al obtener eventos de Mailgun:', error);
    throw error;
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
    throw new Error('Servicio de email no inicializado con perfil de usuario');
  }
  
  if (USE_MAILGUN) {
    try {
      // Para bandeja de entrada, obtenemos los correos recibidos
      if (folder === 'inbox') {
        const events = await fetchMailgunEvents(CURRENT_USER_EMAIL, 'delivered');
        return mapMailgunEventsToMails(events, folder);
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
      const res = await fetch(`${BASE}/api/mail?folder=${encodeURIComponent(folder)}&user=${encodeURIComponent(CURRENT_USER_EMAIL)}`);
      if (!res.ok) throw new Error('Error fetching mails');
      return res.json();
    } catch (error) {
      console.error('Error con backend, usando localStorage:', error);
      // Fallback a localStorage si falla el backend
    }
  }
  
  // Fallback local
  const mails = loadLocal();
  return mails.filter(m => m.folder === folder && 
    (folder === 'sent' ? m.from === CURRENT_USER_EMAIL : m.to === CURRENT_USER_EMAIL));
}

// Enviar correo usando Mailgun API
async function sendMailWithMailgun({ from, to, subject, body, attachments = [] }) {
  if (!USE_MAILGUN || !MAILGUN_API_KEY) {
    throw new Error('Configuración de Mailgun no disponible');
  }

  // Si no se proporciona remitente, usamos el correo del usuario actual
  if (!from && CURRENT_USER_EMAIL) {
    from = CURRENT_USER_EMAIL;
  }
  
  if (!from) {
    throw new Error('Remitente no especificado');
  }

  const url = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
  const auth = btoa(`api:${MAILGUN_API_KEY}`);
  
  // Preparar datos para formulario
  const formData = new FormData();
  formData.append('from', from);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('html', body);
  
  // Añadir adjuntos si existen
  if (attachments && attachments.length) {
    attachments.forEach((attachment, index) => {
      if (attachment.file) {
        formData.append('attachment', attachment.file, attachment.filename || `adjunto-${index+1}`);
      }
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al enviar correo: ${response.status} ${errorData}`);
    }
    
    const responseData = await response.json();
    return {
      success: true,
      messageId: responseData.id,
      response: responseData
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

export async function sendMail({ to, subject, body, attachments }) {
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
      
      return mailSent;
    } catch (error) {
      console.error('Error con Mailgun, usando fallback:', error);
      // Fallback al método normal si falla Mailgun
    }
  }
  
  // Backend fallback
  if (USE_BACKEND) {
    try {
      const res = await fetch(`${BASE}/api/mail`, {
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
      if (!res.ok) throw new Error('Error sending mail');
      return res.json();
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
  return mailSent;
}

export async function markAsRead(id) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/${id}/read`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Error marking mail as read');
    return res.json();
  }
  const mails = loadLocal();
  const updated = mails.map(m => m.id === id ? { ...m, read: true } : m);
  saveLocal(updated);
  return true;
}

export async function deleteMail(id) {
  if (USE_BACKEND) {
    const res = await fetch(`${BASE}/api/mail/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting mail');
    return;
  }
  const mails = loadLocal();
  saveLocal(mails.filter(m => m.id !== id));
}
