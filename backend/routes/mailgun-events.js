import express from 'express';
import dotenv from 'dotenv';
import mailgunJs from 'mailgun-js';
import path from 'path';

// Cargar variables de entorno (buscando .env en raíz del proyecto)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Sanea dominios: quita comillas, protocolo, rutas, espacios. Devuelve hostname en minúsculas
function sanitizeDomain(input) {
  if (!input) return input;
  let s = String(input).trim();
  // quita comillas envolventes
  s = s.replace(/^['"]|['"]$/g, '');
  // quita protocolo
  s = s.replace(/^\s*https?:\/\//i, '');
  // corta en primera '/'
  s = s.split('/')[0];
  // elimina espacios
  s = s.replace(/\s+/g, '');
  return s.toLowerCase();
}

// Helper para crear el cliente de Mailgun de forma segura
function createMailgun() {
  const RAW_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const RAW_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const RAW_EU = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();

  const MAILGUN_API_KEY = RAW_API_KEY ? RAW_API_KEY.trim() : RAW_API_KEY;
  const MAILGUN_DOMAIN_RAW_TRIM = RAW_DOMAIN ? RAW_DOMAIN.trim() : RAW_DOMAIN;
  const MAILGUN_DOMAIN = MAILGUN_DOMAIN_RAW_TRIM ? sanitizeDomain(MAILGUN_DOMAIN_RAW_TRIM) : MAILGUN_DOMAIN_RAW_TRIM;
  const MAILGUN_EU_REGION = RAW_EU ? RAW_EU.trim() : RAW_EU;

  // Logging enmascarado para diagnóstico sin exponer secretos
  try {
    console.log('[mailgun-events] Configuración detectada:', {
      apiKey: MAILGUN_API_KEY ? MAILGUN_API_KEY.slice(0, 5) + '***' : 'no definida',
      domain: MAILGUN_DOMAIN || 'no definido',
      euRegion: MAILGUN_EU_REGION,
    });
  } catch {}

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun no configurado en mailgun-events: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN');
    return null;
  }
  // Validación con regex: solo letras, números, guiones y puntos; debe contener al menos un punto
  const domainRegex = /^(?=.{1,253}$)(?!-)([a-z0-9-]+\.)+[a-z0-9-]+$/i;
  const isValidDomain = !!MAILGUN_DOMAIN && domainRegex.test(MAILGUN_DOMAIN);
  if (!isValidDomain) {
    console.warn('[mailgun-events] MAILGUN_DOMAIN inválido tras saneado:', MAILGUN_DOMAIN_RAW_TRIM, '=>', MAILGUN_DOMAIN);
    return { __invalidDomain: true };
  }
  const hostCfg = MAILGUN_EU_REGION === 'true' ? { host: 'api.eu.mailgun.net' } : {};
  try {
    return mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, ...hostCfg });
  } catch (e) {
    console.error('No se pudo crear el cliente de Mailgun (events):', e.message);
    return null;
  }
}

const router = express.Router();

/**
 * GET /api/mailgun/events
 * Devuelve la lista de eventos de Mailgun para un destinatario concreto.
 * Query params:
 *   recipient (string, requerido)  - Dirección de correo del destinatario
 *   event     (string, opcional)   - Tipo de evento (delivered|opened|failed|etc.)
 *   limit     (number, opcional)   - Máximo de eventos a devolver (1-300, default 50)
 */
router.get('/', async (req, res) => {
  try {
    const { recipient, event = 'delivered', limit = 50 } = req.query;

    if (!recipient) {
      return res.status(400).json({ success: false, message: 'Parámetro "recipient" es obligatorio' });
    }

    const mailgun = createMailgun();
    if (!mailgun) {
      return res.status(503).json({ success: false, message: 'Mailgun no está configurado en el servidor' });
    }
    if (mailgun.__invalidDomain) {
      return res.status(503).json({
        success: false,
        message: 'MAILGUN_DOMAIN inválido',
        hint: 'Usa solo el dominio verificado (hostname), p.ej. mg.mywed360.com. No incluyas https:// ni rutas.'
      });
    }

    const query = {
      recipient,
      event,
      limit: Math.min(parseInt(limit, 10) || 50, 300),
      // Orden descendente para obtener los más recientes primero
      // Mailgun acepta "ascending" / "descending" como string
      ascending: 'no'
    };

    // Obtener eventos desde Mailgun
    let data;
    try {
      data = await mailgun.events().get(query);
    } catch (mgErr) {
      // Log detallado para diagnosticar problemas (status, mensaje y cuerpo)
      const status = mgErr?.statusCode || mgErr?.status || 'unknown';
      const body = mgErr?.response?.body || mgErr?.message || mgErr;
      console.error('Error Mailgun events().get:', status, body);
      const msg = mgErr?.message || String(mgErr);
      console.error('Error Mailgun events().get:', msg);
      return res.status(503).json({
        success: false,
        message: 'Fallo consultando eventos de Mailgun',
        error: msg,
        hint: 'Verifica MAILGUN_API_KEY, MAILGUN_DOMAIN (p.ej. mg.mywed360.com) y MAILGUN_EU_REGION=true',
      });
    }

    return res.json({ success: true, items: (data && data.items) || [] });
  } catch (error) {
    console.error('Error al obtener eventos de Mailgun:', error);
    return res.status(503).json({ success: false, message: 'Error al obtener eventos de Mailgun', error: error.message });
  }
});

export default router;
