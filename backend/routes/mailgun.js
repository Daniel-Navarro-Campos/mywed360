import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mailgunJs from 'mailgun-js';

// Asegura variables de entorno disponibles en Render o local
dotenv.config();

const router = express.Router();

// Habilitar CORS basico para tests desde frontend
router.use(cors({ origin: true }));

/**
 * GET /api/mailgun/test
 * Responde 200 si la configuración básica de Mailgun en el backend es correcta.
 *  - Verifica que MAILGUN_API_KEY y MAILGUN_DOMAIN estén definidos.
 *  - Opcionalmente hace una llamada "ping" sencilla al endpoint de dominios para confirmar conectividad.
 * Frontend sólo necesita un 200 para marcar la prueba como exitosa.
 */
router.all('/test', async (req, res) => {
  try {
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_EU_REGION } = process.env;
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return res.status(503).json({ success: false, message: 'Mailgun no está configurado en el servidor' });
    }

    // Realizar una petición ligera a la API de Mailgun para validar credenciales
    try {
      const hostCfg = MAILGUN_EU_REGION === 'true' ? { host: 'api.eu.mailgun.net' } : {};
      const mg = mailgunJs({ apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, ...hostCfg });
      // Llamada mínima que no consume cuota: obtener info de dominio
      await mg.request('GET', `/v3/domains/${MAILGUN_DOMAIN}`);
    } catch (err) {
      // Si la llamada falla, aún así devolvemos error para que el panel lo reporte
      return res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Error al contactar Mailgun' });
    }

    return res.status(200).json({ success: true, message: 'Mailgun test OK' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
