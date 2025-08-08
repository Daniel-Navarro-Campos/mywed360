import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

const {
  TINK_CLIENT_ID,
  TINK_CLIENT_SECRET,
  TINK_REDIRECT_URI,
} = process.env;

if (!TINK_CLIENT_ID || !TINK_CLIENT_SECRET || !TINK_REDIRECT_URI) {
  console.warn('⚠️  Tink credentials missing in .env – /api/bank endpoints will be disabled');
}

// Simple in-memory map state->user (dev only)
const stateStore = new Map();

// GET /api/bank/create-link  -> {link}
router.get('/create-link', (req, res) => {
  if (!TINK_CLIENT_ID) return res.status(500).json({ error: 'tink-not-configured' });
  const state = crypto.randomBytes(8).toString('hex');
  // TODO: store state per user (here we just save in memory)
  stateStore.set(state, { created: Date.now() });
  const params = new URLSearchParams({
    client_id: TINK_CLIENT_ID,
    redirect_uri: TINK_REDIRECT_URI,
    scope: 'accounts:read,transactions:read',
    market: 'ES',
    locale: 'es_ES',
    response_type: 'code',
    state,
  });
  const link = `https://link.tink.com/1.0/authorize/?${params.toString()}`;
  res.json({ link });
});

// GET /api/bank/callback?code=XXX&state=YYY
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send('missing-params');
    if (!stateStore.has(state)) return res.status(400).send('invalid-state');
    stateStore.delete(state);

    // Exchange code for token
    const tokenResp = await axios.post('https://api.tink.com/api/v1/oauth/token', null, {
      params: {
        code,
        client_id: TINK_CLIENT_ID,
        client_secret: TINK_CLIENT_SECRET,
        grant_type: 'authorization_code',
      },
    });

    // Save tokens – for demo, just log. TODO: persist securely per user.
    console.log('🌐 Tink tokens', tokenResp.data);

    // Redirect to frontend success page
    res.redirect('http://localhost:5173/finanzas?linked=1');
  } catch (err) {
    console.error('Tink callback error', err.response?.data || err.message);
    res.status(500).send('tink-error');
  }
});

export default router;
