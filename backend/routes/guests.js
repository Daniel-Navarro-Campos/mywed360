import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import logger from '../logger.js';

// ------------ Firestore Init -------------
// Se asume que ya existe inicialización global en otro punto del backend.
// Si no, se puede hacer aquí leyendo las credenciales del entorno.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    logger.warn('Firebase admin ya estaba inicializado o no hay credencial:', err.message);
  }
}

const db = admin.firestore();
const router = express.Router();

/**
 * POST /api/guests/invite
 * Body: { name: string, phone?: string, email?: string, eventId?: string }
 * Crea un invitado y devuelve link personalizado de RSVP.
 */
router.post('/invite', async (req, res) => {
  try {
    const { name, phone = '', email = '', eventId = 'default' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name-required' });

    const token = uuidv4();
    const docRef = db.collection('guests').doc(token);
    await docRef.set({
      name,
      phone,
      email,
      eventId,
      token,
      status: 'pending', // pending | accepted | rejected
      companions: 0,
      allergens: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
    res.json({ token, link });
  } catch (err) {
    logger.error('guest-invite-error', err);
    res.status(500).json({ error: 'guest-invite-failed' });
  }
});

/**
 * GET /api/guests/:token
 * Devuelve datos del invitado (sin datos sensibles).
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const snap = await db.collection('guests').doc(token).get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });
    const data = snap.data();
    res.json({ name: data.name, status: data.status, companions: data.companions, allergens: data.allergens });
  } catch (err) {
    logger.error('guest-get-error', err);
    res.status(500).json({ error: 'guest-get-failed' });
  }
});

/**
 * PUT /api/guests/:token
 * Body: { status: 'accepted' | 'rejected', companions?: number, allergens?: string }
 * Actualiza la respuesta del invitado.
 */
router.put('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { status, companions = 0, allergens = '' } = req.body || {};
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'invalid-status' });

    const docRef = db.collection('guests').doc(token);
    await docRef.update({ status, companions, allergens, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ ok: true });
  } catch (err) {
    logger.error('guest-update-error', err);
    res.status(500).json({ error: 'guest-update-failed' });
  }
});

/**
 * POST /api/guests/id/:docId/rsvp-link
 * Genera (o recupera) el enlace de RSVP para un invitado ya existente.
 * Devuelve { link, token }
 */
router.post('/id/:docId/rsvp-link', async (req, res) => {
  try {
    const { docId } = req.params;
    const docRef = db.collection('guests').doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'not-found' });

    let data = snap.data();
    let { token } = data;
    if (!token) {
      token = uuidv4();
      await docRef.update({ token, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      data = { ...data, token };
    }

    const link = `${process.env.FRONTEND_BASE_URL || 'http://localhost:5173'}/rsvp/${token}`;
    res.json({ token, link });
  } catch (err) {
    logger.error('rsvp-link-error', err);
    res.status(500).json({ error: 'rsvp-link-failed' });
  }
});

export default router;
