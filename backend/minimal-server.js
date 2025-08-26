// Servidor mínimo para verificar que Render funciona
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4004;

// CORS básico
app.use(cors());
app.use(express.json());

// Rutas ultra simples
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Minimal server working',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test de Mailgun ultra simple
app.get('/api/mailgun/test', (req, res) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;
  
  res.json({
    success: true,
    message: 'Mailgun endpoint working',
    config: {
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN,
      apiKeyPrefix: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 8) + '...' : 'not_set',
      domain: MAILGUN_DOMAIN || 'not_set'
    },
    timestamp: new Date().toISOString()
  });
});

// Endpoint /api/mail para evitar errores 404
app.get('/api/mail', (req, res) => {
  const { folder, user } = req.query;
  
  // Respuesta mock para evitar errores 404
  res.json({
    success: true,
    message: 'Mail endpoint working (mock data)',
    data: {
      folder: folder || 'inbox',
      user: user || 'unknown',
      emails: [], // Array vacío por ahora
      count: 0,
      timestamp: new Date().toISOString()
    }
  });
});

// Endpoint /api/mailgun/events para evitar errores 404
app.get('/api/mailgun/events', (req, res) => {
  const { recipient, event, limit } = req.query;
  
  // Respuesta mock para evitar errores 404
  res.json({
    success: true,
    message: 'Mailgun events endpoint working (mock data)',
    data: {
      recipient: recipient || 'unknown',
      event: event || 'delivered',
      limit: parseInt(limit) || 50,
      events: [], // Array vacío por ahora
      count: 0,
      timestamp: new Date().toISOString()
    }
  });
});

// Captura de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Mailgun API Key: ${process.env.MAILGUN_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`Mailgun Domain: ${process.env.MAILGUN_DOMAIN || 'NOT SET'}`);
});

export default app;
