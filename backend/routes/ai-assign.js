// backend/routes/ai-assign.js
// Endpoint: POST /api/ai-assign
// Recibe: { tables: [{id, guestId}], guests: [{id, ...}] }
// Devuelve: { assignments: { [tableId]: guestId } }
// Asigna de forma sencilla el primer invitado sin mesa a cada mesa libre.

import express from 'express';
import logger from '../logger.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { tables = [], guests = [] } = req.body || {};
  if (!Array.isArray(tables) || !Array.isArray(guests)) {
    return res.status(400).json({ error: 'tables and guests arrays required' });
  }

  // guests que ya tienen mesa (guestId en tabla)
  const seatedIds = tables.map((t) => t.guestId).filter(Boolean);
  const unseatedGuests = guests.filter((g) => !seatedIds.includes(g.id));
  const freeTables = tables.filter((t) => !t.guestId && (t.enabled !== false));

  const assignments = {};
  let idx = 0;
  freeTables.forEach((tbl) => {
    if (idx < unseatedGuests.length) {
      assignments[tbl.id] = unseatedGuests[idx].id;
      idx += 1;
    }
  });

  logger.info('AI-assign generated', {
    requestedTables: tables.length,
    freeTables: freeTables.length,
    unseatedGuests: unseatedGuests.length,
    assigned: Object.keys(assignments).length,
  });

  res.json({ assignments });
});

export default router;
