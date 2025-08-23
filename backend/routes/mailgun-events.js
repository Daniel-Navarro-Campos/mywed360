import express from 'express';
import dotenv from 'dotenv';
import mailgunJs from 'mailgun-js';
import path from 'path';

// Cargar variables de entorno (buscando .env en raíz del proyecto)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Helper para crear el cliente de Mailgun de forma segura
function createMailgun() {
  const MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY || process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN;
  const MAILGUN_EU_REGION = (process.env.VITE_MAILGUN_EU_REGION || process.env.MAILGUN_EU_REGION || '').toString();

  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun no configurado en mailgun-events: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN');
    return null;
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

    const query = {
      recipient,
      event,
      limit: Math.min(parseInt(limit, 10) || 50, 300),
      // Orden descendente para obtener los más recientes primero
      // Mailgun acepta "ascending" / "descending" como string
      ascending: 'no'
    };

    // Obtener eventos desde Mailgun
    const data = await mailgun.events().get(query);

    return res.json({ success: true, items: data.items || [] });
  } catch (error) {
    console.error('Error al obtener eventos de Mailgun:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener eventos de Mailgun', error: error.message });
  }
});

export default router;
