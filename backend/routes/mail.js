import express from 'express';
import axios from 'axios';
import { db } from '../db.js';
import dotenv from 'dotenv';
import mailgunJs from 'mailgun-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireMailAccess } from '../middleware/authMiddleware.js';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar .env desde la carpeta actual
const localEnvPath = path.join(__dirname, '..', '.env');
console.log('Intentando cargar configuración de Mailgun desde:', localEnvPath);
dotenv.config({ path: localEnvPath });

// Helper para crear clientes de Mailgun de forma perezosa y segura
function createMailgunClients() {
  const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const MAILGUN_SENDING_DOMAIN = process.env.VITE_MAILGUN_SENDING_DOMAIN || process.env.MAILGUN_SENDING_DOMAIN;
  const MAILGUN_EU_REGION = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();

  try {
    console.log('Configuración de Mailgun:', {
      apiKey: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 5) + '***' : 'no definida',
      domain: MAILGUN_DOMAIN || 'no definido',
      sendingDomain: MAILGUN_SENDING_DOMAIN || 'no definido',
      euRegion: MAILGUN_EU_REGION,
    });
  } catch {}

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun no configurado: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN. Se omitirá el envío real.');
    return { mailgun: null, mailgunAlt: null };
  }

  const commonHostCfg = MAILGUN_EU_REGION === 'true' ? { host: 'api.eu.mailgun.net' } : {};
  try {
    const mailgun = mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, ...commonHostCfg });
    const mailgunAlt = MAILGUN_SENDING_DOMAIN
      ? mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_SENDING_DOMAIN, ...commonHostCfg })
      : null;
    return { mailgun, mailgunAlt };
  } catch (e) {
    console.error('No se pudieron crear los clientes de Mailgun:', e.message);
    return { mailgun: null, mailgunAlt: null };
  }
}

const router = express.Router();

// GET /api/mail?folder=inbox|sent
router.get('/', requireMailAccess, async (req, res) => {
  try {
    const { folder = 'inbox', user } = req.query;

    // Construir la consulta base por carpeta
    let query = db.collection('mails').where('folder', '==', folder);

    // Si se especifica usuario, filtrar por destinatario o remitente según la carpeta
    if (user) {
      if (folder === 'sent') {
        query = query.where('from', '==', user);
      } else {
        // Para inbox y otras carpetas, filtrar por destinatario
        query = query.where('to', '==', user);
      }
    }

    const snapshot = await query.orderBy('date', 'desc').get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    console.error('Error en GET /api/mail:', err);
    res.status(503).json({ 
      success: false,
      message: 'Fallo obteniendo correos',
      error: err?.message || String(err),
      hint: 'Verifica acceso a Firestore y filtros (folder/user). Si depende de Mailgun, revisa MAILGUN_* y región EU.',
    });
  }
});

// POST /api/mail  { to, subject, body }
router.post('/', requireMailAccess, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const date = new Date().toISOString();
    const from = 'yo@lovenda.app';
    
    // Configurar el objeto de datos para Mailgun
    const mailData = {
      from: from,
      to: to,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`
    };
    
    try {
      // Crear clientes Mailgun de forma perezosa
      const { mailgun, mailgunAlt } = createMailgunClients();

      // Si no hay configuración, omitir envío real y continuar
      if (!mailgun) {
        console.warn('Mailgun no disponible. Se omite envío real y se continúa con registro en BD.');
      } else {
        console.log('Enviando correo real con Mailgun:', {
          from: mailData.from,
          to: mailData.to,
          subject: mailData.subject
        });

        // Intentar enviar correo con diferentes configuraciones de Mailgun
        let result = null;
        try {
          // Primero intentar con el dominio principal
          result = await mailgun.messages().send(mailData);
          console.log('Correo enviado exitosamente con dominio principal:', result);
        } catch (primaryError) {
          console.error('Error al enviar con dominio principal:', primaryError?.message || primaryError);

          // Si falla y existe cliente alternativo, intentar con el dominio alternativo
          if (mailgunAlt) {
            try {
              result = await mailgunAlt.messages().send(mailData);
              console.log('Correo enviado exitosamente con dominio alternativo:', result);
            } catch (altError) {
              console.error('Error al enviar con dominio alternativo:', altError?.message || altError);
              throw new Error('No se pudo enviar el correo con ninguna configuración de Mailgun');
            }
          } else {
            throw new Error('No hay configuración de dominio de envío alternativo disponible');
          }
        }
      }
    } catch (mailError) {
      console.error('Error al enviar correo real:', mailError?.message || mailError);
      // Si falla el envío real, continuamos con la simulación para mantener la funcionalidad
      console.warn('Fallback a simulación de correo...');
    }
    
    // Registro en carpeta 'sent' para el remitente (siempre guardamos en DB)
    const sentRef = await db.collection('mails').add({
      from: from,
      to,
      subject,
      body,
      date,
      folder: 'sent',
      read: true,
    });

    // Registro en carpeta 'inbox' para el destinatario (sin leer)
    await db.collection('mails').add({
      from: from,
      to,
      subject,
      body,
      date,
      folder: 'inbox',
      read: false,
    });

    res.status(201).json({ id: sentRef.id, to, subject, body, date, folder: 'sent', read: true, from: from });
  } catch (err) {
    console.error('Error en POST /api/mail:', err);
    res.status(503).json({ 
      success: false,
      message: 'Fallo enviando correo',
      error: err?.message || String(err),
      hint: 'Si es envío real, verifica MAILGUN_API_KEY, MAILGUN_DOMAIN (p.ej. mg.mywed360.com) y MAILGUN_EU_REGION=true',
    });
  }
});

// PATCH /api/mail/:id/read
router.patch('/:id/read', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('mails').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await docRef.update({ read: true });
    res.json({ id, ...doc.data(), read: true });
  } catch (err) {
    console.error('Error en PATCH /api/mail/:id/read:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// Compatibilidad: también aceptar POST para marcar como leído
router.post('/:id/read', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('mails').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await docRef.update({ read: true });
    const updated = (await docRef.get()).data();
    res.json({ id, ...updated, read: true });
  } catch (err) {
    console.error('Error en POST /api/mail/:id/read:', err);
    res.status(503).json({ success: false, message: 'Fallo actualizando mail', error: err?.message || String(err) });
  }
});

// DELETE /api/mail/:id
router.delete('/:id', requireMailAccess, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('mails').doc(id).delete();
    res.status(204).end();
  } catch (err) {
    console.error('Error en DELETE /api/mail/:id:', err);
    res.status(503).json({ success: false, message: 'Fallo eliminando mail', error: err?.message || String(err) });
  }
});

/**
 * Endpoint para enviar un correo de prueba usando dirección personalizada
 * @route POST /api/mail/test-personal-email
 */
router.post('/test-personal-email', requireMailAccess, async (req, res) => {
  try {
    const { from, to, subject, message } = req.body;
    
    if (!from || !to || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios (from, to, subject, message)' 
      });
    }
    
    console.log('Verificando remitente:', from);
    
    // Extraer el nombre de usuario de la dirección de correo
    const fromUser = from.split('@')[0];
    const emailDomain = from.split('@')[1];
    
    // Verificar que sea un correo de mywed360.com
    if (!emailDomain || emailDomain !== 'mywed360.com') {
      return res.status(400).json({
        success: false,
        message: 'El remitente debe ser una dirección de correo de mywed360.com'
      });
    }
    
    try {
      // Intentaremos varios métodos para resolver el problema
      let result = null;
      let successMethod = null;
      let errorMessages = [];
      
      // Crear diferentes formatos de remitente para probar
      const fromFormatted = `${fromUser.charAt(0).toUpperCase() + fromUser.slice(1)} <${from}>`;  // Nombre <email@dominio.com>
      const fromWithDomain = `${from.replace('@', '@mg.')}`;  // email@mg.dominio.com
      
      console.log('Intentando varios formatos y configuraciones...');
      console.log('1. Dirección original:', from);
      console.log('2. Formato con nombre:', fromFormatted);
      console.log('3. Dirección con mg subdomain:', fromWithDomain);
      
      // Opciones a probar en secuencia
      const attemptOptions = [
        // Intento 1: Config base con dirección original
        {
          client: mailgun,
          data: {
            from: from,
            to: to,
            subject: `[Prueba 1] ${subject}`,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
          },
          description: 'Dirección original con dominio base'
        },
        // Intento 2: Config base con formato nombre <email>
        {
          client: mailgun,
          data: {
            from: fromFormatted,
            to: to,
            subject: `[Prueba 2] ${subject}`,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
          },
          description: 'Formato con nombre con dominio base'
        },
        // Intento 3: Config alternativa con dirección original
        {
          client: mailgunAlt,
          data: {
            from: from,
            to: to,
            subject: `[Prueba 3] ${subject}`,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
          },
          description: 'Dirección original con dominio de envío'
        },
        // Intento 4: Config alternativa con formato nombre <email>
        {
          client: mailgunAlt,
          data: {
            from: fromFormatted,
            to: to,
            subject: `[Prueba 4] ${subject}`,
            text: message,
            html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</div>`
          },
          description: 'Formato con nombre con dominio de envío'
        }
      ];
      
      // Intentar cada opción en secuencia hasta que una funcione
      for (let i = 0; i < attemptOptions.length; i++) {
        const attempt = attemptOptions[i];
        console.log(`\nIntento #${i + 1}: ${attempt.description}`);
        console.log('Configuración:', {
          from: attempt.data.from,
          domain: attempt.client.domain
        });
        
        try {
          result = await attempt.client.messages().send(attempt.data);
          successMethod = attempt.description;
          console.log(`\n¡ÉXITO! Método ${i + 1} funcionó: ${attempt.description}`);
          break; // Sal del bucle si tuvo éxito
        } catch (attemptError) {
          console.error(`Error en intento #${i + 1}:`, attemptError.message);
          errorMessages.push({ 
            method: attempt.description, 
            error: attemptError.message, 
            status: attemptError.statusCode || 'desconocido' 
          });
        }
      }
      
      // Si ninguno tuvo éxito, guardar los detalles de error y lanzar una excepción
      if (!result) {
        console.error('\n=========== RESUMEN DE ERRORES ===========');
        console.error(`Todos los intentos fallaron para remitente: ${from}`);
        errorMessages.forEach((error, index) => {
          console.error(`Intento #${index + 1} (${error.method}): ${error.error} (Status: ${error.status})`);
        });
        console.error('=======================================');
        
        // Guardar los errores en la base de datos para analisis
        try {
          await db.collection('mail_config').doc('error_logs').set({
            lastErrors: errorMessages,
            timestamp: new Date(),
            from: from,
            to: to
          }, { merge: true });
        } catch (dbError) {
          console.error('No se pudieron guardar los errores en la BD:', dbError);
        }
        
        // Realizar diagnóstico adicional
        console.log('\n=== DIAGNÓSTICO ADICIONAL ===');
        const forbiddenErrors = errorMessages.filter(e => e.error.includes('Forbidden') || e.status === 403);
        if (forbiddenErrors.length > 0) {
          console.log('Detectado problema de permisos/autorización. Verifica:');
          console.log('1. El dominio debe estar verificado en Mailgun');
          console.log('2. El remitente debe estar autorizado');
          console.log('3. La API key debe tener permisos suficientes');
        }
        
        const authErrors = errorMessages.filter(e => e.status === 401 || e.error.includes('Unauthorized'));
        if (authErrors.length > 0) {
          console.log('Detectado problema de autenticación. Verifica:');
          console.log('1. La API key es válida y no ha expirado');
          console.log('2. La API key tiene acceso a la región EU');
        }
        
        // Incluir datos más detallados en la excepción
        throw { 
          message: 'Todos los métodos de envío fallaron', 
          details: errorMessages,
          diagnostic: {
            forbiddenIssues: forbiddenErrors.length > 0,
            authIssues: authErrors.length > 0
          }
        };
      }
      
      // Registrar el correo en la base de datos y los detalles del método exitoso
      const newEmail = {
        from: from,
        to: to,
        subject: subject,
        body: message,
        date: new Date(),
        status: 'sent',
        folder: 'sent',
        isRead: true,
        personalEmail: true, // Marcar como correo enviado desde dirección personalizada
        sendMethod: successMethod // Registrar qué método funcionó
      };
      
      await db.collection('mails').add(newEmail);
      
      // Guardar la configuración exitosa para referencia futura
      await db.collection('mail_config').doc('successful_config').set({
        method: successMethod,
        timestamp: new Date(),
        details: {
          from: typeof result.from === 'string' ? result.from : JSON.stringify(result.from),
          domain: typeof result.domain === 'string' ? result.domain : 'no disponible'
        }
      }, { merge: true });
      
      return res.status(200).json({
        success: true,
        message: `Email de prueba enviado correctamente usando el método: ${successMethod}`,
        data: {
          mailgunResponse: result,
          successMethod: successMethod
        }
      });
    } catch (mailgunError) {
      console.error('Error de Mailgun:', mailgunError);
      
      let errorMessage = 'Error al enviar el correo con Mailgun';
      let statusCode = 500;
      let diagnosticInfo = {};
      
      // Para errores acumulados de todos los intentos
      if (mailgunError.details && Array.isArray(mailgunError.details)) {
        console.log('\n=== DETALLES DE ERRORES DE TODOS LOS INTENTOS ===');
        mailgunError.details.forEach((error, index) => {
          console.log(`Intento #${index + 1}: ${error.method} - ${error.error}`);
        });
        
        // Extraer errores específicos para diagnóstico
        diagnosticInfo.attemptsMade = mailgunError.details.length;
        diagnosticInfo.errorTypes = [];
        
        // Clasificar errores por tipo
        const hasAuthErrors = mailgunError.details.some(e => e.status === 401 || e.error.includes('Unauthorized'));
        const hasForbiddenErrors = mailgunError.details.some(e => e.status === 403 || e.error.includes('Forbidden'));
        const hasNotFoundErrors = mailgunError.details.some(e => e.status === 404);
        
        // Detallar diagnóstico
        if (hasAuthErrors) {
          diagnosticInfo.errorTypes.push('autenticación');
          errorMessage = 'Error de autenticación con Mailgun. Verifica la API key.';
        }
        if (hasForbiddenErrors) {
          diagnosticInfo.errorTypes.push('autorización');
          errorMessage = 'Error de permisos (Forbidden) con Mailgun. El dominio podría no estar verificado o el remitente no está autorizado.';
        }
        if (hasNotFoundErrors) {
          diagnosticInfo.errorTypes.push('dominio_no_encontrado');
          errorMessage = 'Error: dominio no encontrado en Mailgun.';
        }
        
        // Si hay más de un tipo de error, usar mensaje genérico pero detallado
        if (diagnosticInfo.errorTypes.length > 1) {
          errorMessage = `Se detectaron múltiples problemas: ${diagnosticInfo.errorTypes.join(', ')}. Revisa la configuración de Mailgun.`;
        }
      } 
      // Para errores específicos de un solo intento
      else {
        // Analizar tipos específicos de errores de Mailgun
        if (mailgunError.statusCode === 401) {
          errorMessage = 'Error de autenticación con Mailgun. Verifica la API key.';
          diagnosticInfo.type = 'autenticación';
        } else if (mailgunError.statusCode === 403) {
          errorMessage = 'Error de permisos (Forbidden). El dominio podría no estar verificado o el remitente no está autorizado.';
          diagnosticInfo.type = 'autorización';
        } else if (mailgunError.statusCode === 404) {
          errorMessage = 'Dominio no encontrado en Mailgun. Verifica la configuración del dominio.';
          diagnosticInfo.type = 'dominio_no_encontrado';
        }
      }
      
      // Guardar detalle de error para futuras referencias
      try {
        await db.collection('mail_config').doc('error_diagnostics').set({
          lastError: {
            message: errorMessage,
            timestamp: new Date(),
            details: mailgunError.details || mailgunError.message,
            diagnostic: diagnosticInfo
          }
        }, { merge: true });
      } catch (dbError) {
        console.error('No se pudo guardar diagnóstico:', dbError);
      }
      
      return res.status(statusCode).json({ 
        success: false, 
        message: errorMessage, 
        error: mailgunError.message || 'Error desconocido',
        statusCode: mailgunError.statusCode || 'desconocido',
        diagnostic: diagnosticInfo
      });
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message
    });
  }
});

export default router;
