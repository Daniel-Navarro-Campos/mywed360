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
      // seatingPlan raíz y subniveles
      'seatingPlan',
      'seatingPlan/banquet',
      'seatingPlan/banquet/areas',
      'seatingPlan/banquet/tables',
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

// ------------------------------
// Cloud Function: inicializar subcolección meetings al crear un usuario
// ------------------------------
exports.initUserMeetingsSubcollection = functions.firestore
  .document('users/{uid}')
  .onCreate(async (snap, context) => {
    const uid = context.params.uid;
    const ref = db.collection('users').doc(uid).collection('meetings').doc('_placeholder');
    try {
      await ref.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
      console.log(`Subcolección meetings creada para usuario ${uid}`);
    } catch (err) {
      console.error('Error creando subcolección meetings para usuario', uid, err);
    }
  });

// ------------------------------
// Cloud Function: eliminar weddingId redundante en users
// ------------------------------
exports.cleanupUserWeddingId = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const afterData = change.after.exists ? change.after.data() : null;
    if (!afterData) return null;
    if (!('weddingId' in afterData)) return null;

    const uid = context.params.uid;
    console.log(`Detectado campo weddingId redundante en users/${uid}. Eliminando…`);
    try {
      await change.after.ref.update({ weddingId: admin.firestore.FieldValue.delete() });
      console.log(`weddingId eliminado de users/${uid}`);
    } catch (err) {
      console.error('Error al eliminar weddingId en users/', uid, err);
    }
    return null;
  });

// ------------------------------
// Firestore trigger: sincronizar seatingPlan al modificar invitados
// ------------------------------
// ------------------------------
// Cloud Function: establecer campos por defecto al crear una boda
// ------------------------------
exports.initWeddingDefaultFields = functions.firestore
  .document('weddings/{weddingId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const defaults = {
      active: true,
      assistantIds: [],
      banquetPlace: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      location: '',
      name: 'Boda sin nombre',
      ownerIds: [],
      plannerIds: [],
      progress: 0,
      weddingDate: '',
    };
    const update = {};
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in data)) update[k] = v;
    }
    if (Object.keys(update).length) {
      await snap.ref.update(update);
      console.log(`Campos por defecto añadidos a boda ${context.params.weddingId}`);
    }
  });

// ------------------------------
// Firestore trigger: sincronizar seatingPlan al modificar invitados
// [eliminada] función legacy syncSeatingPlanOnGuestWrite
/*
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const weddingId = context.params.weddingId;
    const guestId = context.params.guestId;

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    const oldTableId = beforeData ? beforeData.tableId : undefined;
    const newTableId = afterData ? afterData.tableId : undefined;

    const tableColl = db.collection('weddings').doc(weddingId).collection('seatingPlan');
    const batch = db.batch();

    // Quitar invitado de la mesa antigua (si procede)
    if (oldTableId && oldTableId !== newTableId) {
      const oldRef = tableColl.doc(String(oldTableId));
      batch.set(
        oldRef,
        {
          assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Añadir invitado a la nueva mesa
    if (newTableId) {
      const newRef = tableColl.doc(String(newTableId));
      const newSnap = await newRef.get();
      if (newSnap.exists) {
        batch.set(
          newRef,
          {
            assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        // Crear documento de mesa con estructura mínima
        batch.set(newRef, {
          name: `Mesa ${newTableId}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          enabled: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    // Eliminar la mesa antigua si quedó vacía
    if (oldTableId && oldTableId !== newTableId) {
      const oldSnap = await tableColl.doc(String(oldTableId)).get();
      if (oldSnap.exists) {
        const assigned = oldSnap.get('assignedGuestIds') || [];
        if (assigned.length === 0) {
          await tableColl.doc(String(oldTableId)).delete();
        }
      }
    }
  });
*/

// ------------------------------
// Firestore trigger: sincronizar banquet/tables con invitados (nueva estructura)
// ------------------------------
/* LEGACY: desactivada tras migración a banquet/tables
exports.syncSeatingPlanOnGuestWrite = functions.firestore
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const { weddingId, guestId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const beforeTable = before ? before.tableId : null;
    const afterTable = after ? after.tableId : null;

    const tableRef = (tableId) => db.doc(`weddings/${weddingId}/seatingPlan/banquet/tables/${tableId}`);

    // Si el invitado estaba en una mesa y cambia/elimina
    if (beforeTable && beforeTable !== afterTable) {
      const ref = tableRef(beforeTable);
      await ref.update({
        assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      if (!snap.exists || (snap.data().assignedGuestIds || []).length === 0) {
        await ref.delete();
      }
    }

    // Si se elimina al invitado, salir
    if (!after) return;

    if (afterTable) {
      const ref = tableRef(afterTable);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          name: `Mesa ${afterTable}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });
*/

exports.syncBanquetTablesOnGuestWrite = functions.firestore
  .document('weddings/{weddingId}/guests/{guestId}')
  .onWrite(async (change, context) => {
    const { weddingId, guestId } = context.params;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const beforeTable = before ? before.tableId : null;
    const afterTable = after ? after.tableId : null;

    const tableRef = (tableId) => db.doc(`weddings/${weddingId}/seatingPlan/banquet/tables/${tableId}`);

    // Si el invitado estaba en una mesa y cambia/elimina
    if (beforeTable && beforeTable !== afterTable) {
      const ref = tableRef(beforeTable);
      await ref.update({
        assignedGuestIds: admin.firestore.FieldValue.arrayRemove(guestId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      const snap = await ref.get();
      if (!snap.exists || (snap.data().assignedGuestIds || []).length === 0) {
        await ref.delete();
      }
    }

    // Si se elimina al invitado, salir
    if (!after) return;

    if (afterTable) {
      const ref = tableRef(afterTable);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.update({
          assignedGuestIds: admin.firestore.FieldValue.arrayUnion(guestId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set({
          name: `Mesa ${afterTable}`,
          shape: 'circle',
          seats: 8,
          assignedGuestIds: [guestId],
          position: { x: 0, y: 0 },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
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
