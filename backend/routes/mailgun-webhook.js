import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import logger from '../logger.js';

// Asegura que variables estén disponibles
dotenv.config();

const router = express.Router();

function verifyMailgunSignature(signingKey, timestamp, token, signature) {
  try {
    if (!signingKey || !timestamp || !token || !signature) return false;

    // Protección contra replay (15 minutos)
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Number.isFinite(ts) && Math.abs(now - ts) > 15 * 60) {
      logger.warn('Webhook Mailgun: timestamp fuera de ventana (posible replay)');
      // no rechazamos por sólo timestamp, pero lo marcamos
    }

    const hmac = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch (e) {
    logger.error('Error verificando firma de Mailgun:', e);
    return false;
  }
}

// Mailgun envía application/json con {signature: {timestamp, token, signature}, event-data: {...}}
// También podría enviar form-urlencoded en algunos casos. Ya tenemos urlencoded/json habilitados en index.js
router.post('/', async (req, res) => {
  try {
    const signingKey = process.env.MAILGUN_SIGNING_KEY;

    // Intentar extraer firma de body JSON (event-data)
    const sig = req.body?.signature || {
      timestamp: req.body?.timestamp,
      token: req.body?.token,
      signature: req.body?.signature,
    };

    const timestamp = sig?.timestamp;
    const token = sig?.token;
    const signature = sig?.signature;

    const isVerified = signingKey
      ? verifyMailgunSignature(signingKey, timestamp, token, signature)
      : false;

    if (signingKey && !isVerified) {
      logger.warn('Webhook Mailgun: firma inválida', { timestamp, token });
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    // Normalizar evento
    const event = req.body['event-data'] || req.body;

    logger.info('Webhook Mailgun recibido', {
      verified: Boolean(isVerified || !signingKey),
      event: event?.event || event?.eventName || 'unknown',
      recipient: event?.recipient,
      messageId: event?.message?.headers?.['message-id'] || event?.MessageId,
    });

    // Aquí podrías persistir en BD si se requiere
    // await db.collection('mailgun_events').insertOne({ receivedAt: new Date(), verified: isVerified, event });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error en webhook Mailgun:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;
