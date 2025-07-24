import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/email-insights/:mailId
router.get('/:mailId', async (req, res) => {
  const { mailId } = req.params;
  if (!mailId) return res.status(400).json({ error: 'mailId required' });
  try {
    const doc = await db.collection('emailInsights').doc(mailId).get();
    if (!doc.exists) {
      return res.json({});
    }
    return res.json(doc.data());
  } catch (err) {
    console.error('Error fetching emailInsights:', err);
    res.status(500).json({ error: 'internal', details: err.message });
  }
});

export default router;
