import express from 'express';
import axios from 'axios';
import { db } from '../db.js';

const router = express.Router();

// GET /api/mail?folder=inbox|sent
router.get('/', async (req, res) => {
  try {
    const { folder = 'inbox' } = req.query;
    const snapshot = await db
      .collection('mails')
      .where('folder', '==', folder)
      .orderBy('date', 'desc')
      .get();
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching mails' });
  }
});

// POST /api/mail  { to, subject, body }
router.post('/', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const date = new Date().toISOString();

    // TODO: integrate real email provider e.g., SendGrid – placeholder only
    // await axios.post('https://api.sendgrid.com/v3/mail/send', {...})

    // Registro en carpeta 'sent' para el remitente
    const sentRef = await db.collection('mails').add({
      from: 'yo@lovenda.app',
      to,
      subject,
      body,
      date,
      folder: 'sent',
      read: true,
    });

    // Registro en carpeta 'inbox' para el destinatario (sin leer)
    await db.collection('mails').add({
      from: 'yo@lovenda.app',
      to,
      subject,
      body,
      date,
      folder: 'inbox',
      read: false,
    });

    res.status(201).json({ id: sentRef.id, to, subject, body, date, folder: 'sent', read: true, from: 'yo@lovenda.app' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error sending mail' });
  }
});

// PATCH /api/mail/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('mails').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await docRef.update({ read: true });
    res.json({ id, ...doc.data(), read: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating mail' });
  }
});

// DELETE /api/mail/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('mails').doc(id).delete();
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting mail' });
  }
});

export default router;
