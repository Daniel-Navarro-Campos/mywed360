// Express backend for Lovenda
// Provides:
//   GET /api/transactions - proxy or mock to bank aggregator (Nordigen)
//   Health check at /

import dotenv from 'dotenv';
// Cargar variables de entorno lo antes posible desde secret file (Render) o .env local
import fs from 'fs';
import path from 'path';

const secretEnvPath = '/etc/secrets/app.env';
if (fs.existsSync(secretEnvPath)) {
  dotenv.config({ path: secretEnvPath });
  console.log('✅ Variables de entorno cargadas desde secret file', secretEnvPath);
} else {
  dotenv.config(); // fallback a .env local
}
import express from 'express';
import cors from 'cors';
import axios from 'axios';
// Importar middleware de autenticación (ESM) - debe cargarse antes que las rutas para inicializar Firebase Admin correctamente
import {
  requireAuth,
  requireMailAccess,
  optionalAuth
} from './middleware/authMiddleware.js';

import mailRouter from './routes/mail.js';
import aiRouter from './routes/ai.js';
import aiAssignRouter from './routes/ai-assign.js';
import aiImageRouter from './routes/ai-image.js';
import aiSuppliersRouter from './routes/ai-suppliers.js';
import emailInsightsRouter from './routes/email-insights.js';
import notificationsRouter from './routes/notifications.js';
import guestsRouter from './routes/guests.js';
import rolesRouter from './routes/roles.js';
import eventsRouter from './routes/events.js';
import mailgunDebugRoutes from './routes/mailgun-debug.js';
import mailgunInboundRouter from './routes/mailgun-inbound.js';
import mailgunEventsRouter from './routes/mailgun-events.js';
import mailgunWebhookRouter from './routes/mailgun-webhook.js';
import mailgunTestRouter from './routes/mailgun.js';
import diagnosticRouter from './routes/diagnostic.js';
import logger from './logger.js';
import instagramWallRouter from './routes/instagram-wall.js';
import weddingNewsRouter from './routes/wedding-news.js';


// Load environment variables (root .env)
const envPath = path.resolve(process.cwd(), '.env');
let result = dotenv.config({ path: envPath });

// Si no se encuentra en la ruta actual, intentar buscar en el directorio padre
if (result.error) {
  const parentEnvPath = path.resolve(process.cwd(), '../.env');
  result = dotenv.config({ path: parentEnvPath });
}
if (result.error) {
  console.warn('⚠️  .env file not found at', envPath);
} else {
  console.log('✅ .env loaded from', envPath);
}
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not set. Chat AI endpoints will return 500.');
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4004; // Render inyecta PORT

const app = express();

// Configurar CORS para permitir credenciales y origen configurable por entorno
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para registrar cada petición entrante
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Para que Mailgun (form-urlencoded) sea aceptado
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas públicas (sin autenticación)
app.use('/api/mailgun/webhook', mailgunWebhookRouter); // Webhooks de Mailgun (verificación interna)
app.use('/api/inbound/mailgun', mailgunInboundRouter); // Correos entrantes
app.use('/api/mailgun/events', mailgunEventsRouter); // Eventos de Mailgun (consulta pública)

// Rutas que requieren autenticación específica para correo
app.use('/api/mail', requireMailAccess, mailRouter);
// IMPORTANTE: Las rutas más específicas deben ir DESPUÉS de las generales
app.use('/api/mailgun', optionalAuth, mailgunTestRouter); // Debe ir ANTES que /api/mailgun/events
app.use('/api/mailgun/events', requireMailAccess, mailgunEventsRouter);
app.use('/api/mailgun-debug', requireMailAccess, mailgunDebugRoutes);
app.use('/api/email-insights', requireMailAccess, emailInsightsRouter);

// Rutas que requieren autenticación general
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/guests', requireAuth, guestsRouter);
app.use('/api/events', requireAuth, eventsRouter);
app.use('/api/roles', requireAuth, rolesRouter);
app.use('/api/ai-image', requireAuth, aiImageRouter);
app.use('/api/ai-suppliers', requireAuth, aiSuppliersRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/ai-assign', requireAuth, aiAssignRouter);
app.use('/api/instagram-wall', optionalAuth, instagramWallRouter); // Puede ser público
app.use('/api/wedding-news', optionalAuth, weddingNewsRouter); // Puede ser público

// Ruta de diagnóstico (pública para debugging)
app.use('/api/diagnostic', diagnosticRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'lovenda-backend' });
});

// Health check explícito para plataformas de despliegue
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
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

// Middleware de manejo de errores
app.use((err, _req, res, _next) => {
  logger.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

// Captura de errores globales para que se muestren en CMD
process.on('unhandledRejection', (reason) => {
  logger.error('UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('UncaughtException:', err);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Lovenda backend up on http://localhost:${PORT}`);
  });
}

export default app;
