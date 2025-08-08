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

// Simple in-memory stores (dev only)
const stateStore = new Map();
let tinkTokens = null; // {access_token, expires_in, created}


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
    tinkTokens = { ...tokenResp.data, created: Date.now() };
    console.log('🌐 Tink tokens saved');

    // Redirect to frontend success page
    res.redirect('http://localhost:5173/finanzas?linked=1');
  } catch (err) {
    console.error('Tink callback error', err.response?.data || err.message);
    res.status(500).send('tink-error');
  }
});

// GET /api/bank/transactions
router.get('/transactions', async (req, res) => {
  try {
    if (!tinkTokens?.access_token) return res.json([]);
    // Refresh token if expired (simplified)
    const now = Date.now();
    if (now - tinkTokens.created > (tinkTokens.expires_in - 60) * 1000) {
      const refreshResp = await axios.post('https://api.tink.com/api/v1/oauth/token', null, {
        params: {
          refresh_token: tinkTokens.refresh_token,
          client_id: TINK_CLIENT_ID,
          client_secret: TINK_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      });
      tinkTokens = { ...refreshResp.data, created: Date.now() };
    }

    // Get accounts
    const accResp = await axios.get('https://api.tink.com/data/v2/accounts', {
      headers: { Authorization: `Bearer ${tinkTokens.access_token}` },
    });
    const accountIds = accResp.data.accounts.map(a => a.id);

    // Fetch transactions for each account (first 100)
    let transactions = [];
    for (const accId of accountIds) {
      const txResp = await axios.get(`https://api.tink.com/data/v2/transactions?accountId=${accId}&limit=100`, {
        headers: { Authorization: `Bearer ${tinkTokens.access_token}` },
      });
      transactions.push(...txResp.data.transactions);
    }

    // Map to simplified object
    const mapped = transactions.map(t => ({
      id: t.id,
      date: t.date || t.dates?.booked,
      amount: t.amount?.value,
      currency: t.amount?.currencyCode,
      description: t.descriptions?.display ?? t.descriptions?.original,
      category: t.categoryType,
      type: t.amount?.value >= 0 ? 'income' : 'expense',
    }));

    res.json(mapped);
  } catch(err) {
    console.error('Error fetching Tink transactions', err.response?.data || err.message);
    res.status(500).json({ error: 'tink-tx-error' });
  }
});

export default router;
