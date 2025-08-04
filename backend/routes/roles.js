import express from 'express';
import admin from 'firebase-admin';
import logger from '../logger.js';

// Suponemos firebase-admin inicializado en index.js o guests.js
const db = admin.firestore();
const router = express.Router();

// Helpers ----------------------------------------------------
async function getUserRole(eventId, uid) {
  const doc = await db.collection('roles').doc(eventId).collection('members').doc(uid).get();
  return doc.exists ? doc.data().role : null;
}

function authMiddleware(req, res, next) {
  // Muy simplificado: el frontend debe enviar header Authorization: Bearer <uid>
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthenticated' });
  req.userId = auth.substring(7);
  next();
}

function allowRoles(allowed) {
  return async (req, res, next) => {
    const { eventId } = req.params;
    const role = await getUserRole(eventId, req.userId);
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

// Rutas ------------------------------------------------------
// Lista los colaboradores y sus roles (solo owner o planner)
router.get('/:eventId', authMiddleware, allowRoles(['owner', 'planner']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const snap = await db.collection('roles').doc(eventId).collection('members').get();
    const members = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    res.json(members);
  } catch (err) {
    logger.error('roles-list-error', err);
    res.status(500).json({ error: 'roles-list-failed' });
  }
});

// Asigna o cambia rol a un colaborador (solo owner)
router.post('/:eventId/assign', authMiddleware, allowRoles(['owner']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { uid, role } = req.body || {};
    const allowedRoles = ['owner', 'planner', 'assistant'];
    if (!uid || !allowedRoles.includes(role)) return res.status(400).json({ error: 'invalid-data' });
    await db.collection('roles').doc(eventId).collection('members').doc(uid).set({ role, assignedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ ok: true });
  } catch (err) {
    logger.error('role-assign-error', err);
    res.status(500).json({ error: 'role-assign-failed' });
  }
});

// Elimina colaborador (solo owner)
router.delete('/:eventId/:uid', authMiddleware, allowRoles(['owner']), async (req, res) => {
  try {
    const { eventId, uid } = req.params;
    await db.collection('roles').doc(eventId).collection('members').doc(uid).delete();
    res.json({ ok: true });
  } catch (err) {
    logger.error('role-remove-error', err);
    res.status(500).json({ error: 'role-remove-failed' });
  }
});

export default router;
