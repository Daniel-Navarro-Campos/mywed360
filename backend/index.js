// Express backend for Lovenda
// Provides:
//   GET /api/transactions - proxy or mock to bank aggregator (Nordigen)
//   Health check at /

import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import mailRouter from './routes/mail.js';
import aiRouter from './routes/ai.js';
import notificationsRouter from './routes/notifications.js';

// Load environment variables (root .env)
const envPath = path.resolve(process.cwd(), '../.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('⚠️  .env file not found at', envPath);
} else {
  console.log('✅ .env loaded from', envPath);
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. Chat AI endpoints will return 500.');
}

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/mail', mailRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/ai', aiRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'lovenda-backend' });
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { bankId, from, to } = req.query;

    // If Nordigen credentials missing, return mock data
    const { NORDIGEN_SECRET_ID, NORDIGEN_SECRET_KEY, NORDIGEN_BASE_URL } =
      process.env;
    if (!NORDIGEN_SECRET_ID || !NORDIGEN_SECRET_KEY) {
      return res.json([
        {
          id: 'txn_demo_1',
          amount: 120.5,
          currency: 'EUR',
          date: '2025-07-01',
          description: 'Mock transaction 1',
        },
      ]);
    }

    // 1. Get access token from Nordigen
    const tokenResp = await axios.post(
      `${NORDIGEN_BASE_URL}/token/new/`,
      {
        secret_id: NORDIGEN_SECRET_ID,
        secret_key: NORDIGEN_SECRET_KEY,
      }
    );

    const access = tokenResp.data.access;

    // 2. Build query params
    const params = new URLSearchParams();
    if (bankId) params.append('bankId', bankId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    // 3. Fetch transactions from your own aggregator endpoint or Nordigen endpoint directly
    const txnResp = await axios.get(
      `${NORDIGEN_BASE_URL}/accounts/${bankId}/transactions/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    );

    res.json(txnResp.data.transactions.booked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

app.listen(PORT, () => {
  console.log(`Lovenda backend up on http://localhost:${PORT}`);
});
