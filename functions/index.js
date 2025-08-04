const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');
const admin = require('firebase-admin');
// Inicializar Admin SDK solo una vez
if (!admin.apps?.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Configuración para Mailgun
// Usar variable de entorno primero; si no existe, intentar leer de funciones config y evitar TypeError
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || functions.config().mailgun?.key || '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || functions.config().mailgun?.domain || 'mywed360.com';
// Permitir sobreescribir la URL base (soporta US y EU)
const MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL || functions.config().mailgun?.base_url || 'https://api.mailgun.net/v3';

// Función para obtener eventos de Mailgun
exports.getMailgunEvents = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Verificar que el usuario está autenticado (recomendado usar Firebase Auth)
      // const authHeader = request.headers.authorization;
      // if (!authHeader || !authHeader.startsWith('Bearer ')) {
      //   return response.status(401).json({ error: 'Unauthorized' });
      // }
      // const idToken = authHeader.split('Bearer ')[1];
      // await admin.auth().verifyIdToken(idToken);

      // Obtener parámetros de consulta
      const { recipient, from, event = 'delivered', limit = 50 } = request.query;
      
      if (!recipient && !from) {
        return response.status(400).json({ error: 'Se requiere "recipient" o "from"' });
      }
      
      // Construir URL para Mailgun
      const params = new URLSearchParams({
        event,
        limit
      });
      if (recipient) params.append('recipient', recipient);
      if (from) params.append('from', from);

      // Determinar dominio a consultar: si el email pertenece a mywed360.com usar dominio raíz, si es mg.mywed360.com usar subdominio
      let targetDomain = MAILGUN_DOMAIN;
      const sampleEmail = recipient || from;
      if (sampleEmail) {
        const domainPart = sampleEmail.split('@')[1] || '';
        if (domainPart === 'mywed360.com') {
          targetDomain = 'mywed360.com';
        } else if (domainPart === 'mg.mywed360.com') {
          targetDomain = 'mg.mywed360.com';
        }
      }
      
      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
      
      // Hacer solicitud a Mailgun API
      const mailgunResponse = await fetch(`${MAILGUN_BASE_URL}/${targetDomain}/events?${params.toString()}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({ 
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText
        });
      }
      
      const data = await mailgunResponse.json();
      return response.json(data);
      
    } catch (error) {
      console.error('Error processing Mailgun events request:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// Función para enviar correos a través de Mailgun
exports.sendEmail = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    // Configurar CORS de forma explícita
    response.set('Access-Control-Allow-Origin', '*');
    response.set('Access-Control-Allow-Headers', 'Content-Type');
    response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // Preflight
    if (request.method === 'OPTIONS') {
      return response.status(204).send('');
    }
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
      // Extraer datos del cuerpo
      const { from, to, subject, body, html, attachments } = request.body;
      
      if (!from || !to || !subject || (!body && !html)) {
        return response.status(400).json({ error: 'Missing required fields' });
      }
      
      // Construir formData para Mailgun
      const formData = new URLSearchParams();
      formData.append('from', from);
      formData.append('to', to);
      formData.append('subject', subject);
      
      if (body) formData.append('text', body);
      if (html) formData.append('html', html);
      
      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
      
      // Hacer solicitud a Mailgun API
      const mailgunResponse = await fetch(`${MAILGUN_BASE_URL}/${MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      
      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({ 
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText
        });
      }
      
      const data = await mailgunResponse.json();
      return response.json(data);
      
    } catch (error) {
      console.error('Error sending email:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});

// ------------------------------
// Webhook: recepción de eventos de Mailgun
// ------------------------------
exports.mailgunWebhook = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Mailgun puede enviar un único evento o un array bajo "signature"+"event-data"
      const events = Array.isArray(request.body) ? request.body : [request.body];

      const batch = db.batch();

      events.forEach(evt => {
        const id = evt['event-data']?.id || evt.id || `${Date.now()}-${Math.random()}`;
        const data = evt['event-data'] || evt;
        batch.set(db.collection('mailgunEvents').doc(id), data, { merge: true });
      });

      await batch.commit();
      return response.json({ received: events.length });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return response.status(500).json({ error: err.message });
    }
  });
});

// ------------------------------
// Tarea programada: Agregación diaria
// ------------------------------
const { FieldValue } = admin.firestore;

exports.aggregateDailyMetrics = functions.pubsub
  .schedule('0 2 * * *') // Todos los días a las 02:00
  .timeZone('Europe/Madrid')
  .onRun(async () => {
    const now = new Date();
    const yyyyMMdd = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayStartTs = dayStart.getTime() / 1000; // seg

    // Obtener eventos del día
    const snapshot = await db
      .collection('mailgunEvents')
      .where('event-data.timestamp', '>=', dayStartTs)
      .get();

    const metricsByUser = {};

    snapshot.forEach(doc => {
      const evt = doc.data()['event-data'] || doc.data();
      const { event, recipient } = evt;
      if (!recipient) return;
      const userId = recipient.split('@')[0]; // Supuesto: alias = userId
      if (!metricsByUser[userId]) {
        metricsByUser[userId] = { sent: 0, received: 0, opens: 0, clicks: 0, bounces: 0 };
      }
      switch (event) {
        case 'delivered':
          metricsByUser[userId].sent += 1;
          break;
        case 'stored':
        case 'inbound':
          metricsByUser[userId].received += 1;
          break;
        case 'opened':
          metricsByUser[userId].opens += 1;
          break;
        case 'clicked':
          metricsByUser[userId].clicks += 1;
          break;
        case 'failed':
          metricsByUser[userId].bounces += 1;
          break;
        default:
          break;
      }
    });

    const batch = db.batch();

    Object.entries(metricsByUser).forEach(([userId, daily]) => {
      const docRef = db.collection('emailMetrics').doc(userId);
      batch.set(
        docRef,
        {
          sent: FieldValue.increment(daily.sent),
          received: FieldValue.increment(daily.received),
          opens: FieldValue.increment(daily.opens),
          clicks: FieldValue.increment(daily.clicks),
          bounces: FieldValue.increment(daily.bounces),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Subcolección diaria
      const dailyRef = docRef.collection('daily').doc(yyyyMMdd);
      batch.set(
        dailyRef,
        { date: yyyyMMdd, ...daily, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    });

    await batch.commit();
    console.log(`Aggregated metrics for ${Object.keys(metricsByUser).length} users`);
  });

// Función para validar correo electrónico
// ------------------------------
// Cloud Function: inicializar subcolecciones al crear una boda
// ------------------------------
exports.initWeddingSubcollections = functions.firestore
  .document('weddings/{weddingId}')
  .onCreate(async (snap, context) => {
    const weddingId = context.params.weddingId;
    const subCollections = [
      'guests',
      'seatingPlan',
      'designs',
      'suppliers',
      'momentosEspeciales',
      'timing',
      'checklist',
      'ayudaCeremonia',
      'disenoWeb',
      'ideas'
    ];

    const batch = db.batch();
    subCollections.forEach((sub) => {
      const ref = db
        .collection('weddings')
        .doc(weddingId)
        .collection(sub)
        .doc('_placeholder');
      batch.set(ref, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
    console.log(`Subcolecciones iniciales creadas para boda ${weddingId}`);
  });

exports.validateEmail = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { email } = request.query;
      
      if (!email) {
        return response.status(400).json({ error: 'Email is required' });
      }
      
      // Crear autenticación Basic para Mailgun
      const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
      
      // Hacer solicitud a Mailgun API
      const mailgunResponse = await fetch(`${MAILGUN_BASE_URL}/address/validate?address=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });
      
      if (!mailgunResponse.ok) {
        const errorText = await mailgunResponse.text();
        console.error('Error from Mailgun:', mailgunResponse.status, errorText);
        return response.status(mailgunResponse.status).json({ 
          error: `Error de Mailgun: ${mailgunResponse.status}`,
          details: errorText
        });
      }
      
      const data = await mailgunResponse.json();
      return response.json(data);
      
    } catch (error) {
      console.error('Error validating email:', error);
      return response.status(500).json({ error: error.message });
    }
  });
});
