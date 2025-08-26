import express from 'express';

const router = express.Router();

/**
 * Endpoint de test simple sin dependencias externas
 * Para verificar que las rutas se registran correctamente
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
});

/**
 * Test de Mailgun simplificado
 */
router.get('/mailgun', (req, res) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN } = process.env;
  
  res.status(200).json({
    success: true,
    message: 'Mailgun test endpoint working',
    config: {
      hasApiKey: !!MAILGUN_API_KEY,
      hasDomain: !!MAILGUN_DOMAIN,
      apiKeyPrefix: MAILGUN_API_KEY ? MAILGUN_API_KEY.substring(0, 8) + '...' : 'not_set',
      domain: MAILGUN_DOMAIN || 'not_set'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Test de variables de entorno
 */
router.get('/env', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Environment test endpoint working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
      hasMailgunKey: !!process.env.MAILGUN_API_KEY,
      hasMailgunDomain: !!process.env.MAILGUN_DOMAIN,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
