import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

// Suponemos que firebase-admin ya está inicializado en otro punto del backend
const db = admin.firestore();
const router = express.Router();

// Middleware de autenticación muy simple (usa UID en el header Authorization)
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthenticated' });
  }
  req.userId = auth.substring(7);
  next();
}

/**
 * POST /api/events
 * Crea una nueva boda/evento y asigna al usuario autenticado como "owner" (pareja).
 * Body: { name: string, date?: string, ... }
 * Respuesta: { eventId, ok }
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name = 'Mi boda', date = null, ...rest } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name-required' });

    // 1. Crear documento de evento
    const eventRef = db.collection('events').doc();
    const eventData = {
      name,
      date,
      ownerIds: [req.userId],
      plannerIds: [],
      assistantIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...rest,
    };
    await eventRef.set(eventData);

    // 2. Registrar rol en subcolección roles/{eventId}/members/{uid}
    await db
      .collection('roles')
      .doc(eventRef.id)
      .collection('members')
      .doc(req.userId)
      .set({ role: 'owner', assignedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.status(201).json({ ok: true, eventId: eventRef.id });
  } catch (err) {
    logger.error('event-create-error', err);
    res.status(500).json({ error: 'event-create-failed' });
  }
});

export default router;
