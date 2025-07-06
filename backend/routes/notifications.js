import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/notifications
router.get('/', async (_req, res) => {
  try {
    const snapshot = await db
      .collection('notifications')
      .orderBy('date', 'desc')
      .get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// POST /api/notifications { type, message }
router.post('/', async (req, res) => {
  try {
    const { type = 'info', message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const date = new Date().toISOString();
    const docRef = await db.collection('notifications').add({
      type,
      message,
      date,
      read: false,
    });
    const notif = { id: docRef.id, type, message, date, read: false };
    // TODO: broadcast via WebSocket/SSE later
    res.status(201).json(notif);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding notification' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('notifications').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await docRef.update({ read: true });
    res.json({ id, ...doc.data(), read: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('notifications').doc(id).delete();
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting notification' });
  }
});

export default router;
