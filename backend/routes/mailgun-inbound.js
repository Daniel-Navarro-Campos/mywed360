import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js'; // Firestore
import { analyzeEmail } from '../services/emailAnalysis.js';

const router = express.Router();

/**
 * Comprueba la firma que Mailgun envía en cada webhook.
 * Docs: https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
 */
function verifyMailgunSignature(timestamp, token, signature, apiKey) {
  // Según Mailgun, se concatena timestamp + token y se aplica HMAC-SHA256 con la API-Key
  const encodedToken = crypto
    .createHmac('sha256', apiKey)
    .update(timestamp + token)
    .digest('hex');
  return encodedToken === signature;
}

router.post('/', (req, res) => {
  const apiKey = process.env.MAILGUN_API_KEY || process.env.VITE_MAILGUN_API_KEY;

  // Extraer datos de cabecera common para la firma
  const { timestamp, token, signature } = req.body;

  if (apiKey) {
    // Verificar firma solo si tenemos la clave privada configurada
    if (!verifyMailgunSignature(timestamp, token, signature, apiKey)) {
      console.warn('Webhook Mailgun firma no válida');
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }
  } else {
    // Entorno local / CI sin clave: continuar pero advertir
    console.warn('⚠️  MAILGUN_API_KEY no definido; se omite verificación de firma (solo dev)');
  }

  // Extraer campos principales del mensaje
  const {
    recipient,
    sender,
    subject,
    'body-plain': bodyPlain,
    'stripped-text': strippedText,
    'stripped-html': strippedHtml,
  } = req.body;

  // Persistir el correo en Firestore
  const bodyContent = bodyPlain || strippedText || strippedHtml || '';
  const date = new Date().toISOString();

  /*
    Mailgun puede enviar varios destinatarios separados por comas. Procesamos cada uno
    individualmente para que cada usuario reciba su propio registro en la carpeta inbox.
  */
  const recipients = recipient ? recipient.split(/,\s*/).map(r => r.trim()) : [];

  const savePromises = recipients.map(async (rcpt) => {
    try {
      const mailRef = await db.collection('mails').add({
        from: sender,
        to: rcpt,
        subject,
        body: bodyContent,
        date,
        folder: 'inbox',
        read: false,
        via: 'mailgun'
      });

      // Análisis IA automático
      try {
        const insights = await analyzeEmail({ subject, body: bodyContent });
        await db.collection('emailInsights').doc(mailRef.id).set({
          ...insights,
          mailId: mailRef.id,
          createdAt: date,
        });
      } catch (aiErr) {
        console.error('⚠️  Error analizando correo:', aiErr);
      }
    } catch (err) {
      console.error('❌ Error guardando correo entrante en Firestore:', err);
    }
  });

  console.log('📧 Email recibido de Mailgun:', {
    recipients,
    sender,
    subject,
    body: bodyContent,
  });

  // Esperar a que todas las escrituras terminen pero sin bloquear la respuesta si tardan
  Promise.allSettled(savePromises).then(() => {
    console.log('✅ Correo entrante guardado en Firestore');
  });

  // Mailgun requiere respuesta 200 OK
  return res.json({ success: true });
});

export default router;
