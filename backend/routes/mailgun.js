import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Asegura variables de entorno disponibles en Render o local
dotenv.config();

const router = express.Router();

// Habilitar CORS basico para tests desde frontend
router.use(cors({ origin: true }));

/**
 * GET /api/mailgun/test
 * Responde 200 si la configuración básica de Mailgun en el backend es correcta.
 * Versión simplificada sin dependencia de mailgun-js para debugging.
 */
router.all('/test', async (req, res) => {
  try {
    const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_EU_REGION } = process.env;
    
    // Test básico: verificar que las variables de entorno existen
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return res.status(503).json({ 
        success: false, 
        message: 'Mailgun no está configurado en el servidor',
        debug: {
          hasApiKey: !!MAILGUN_API_KEY,
          hasDomain: !!MAILGUN_DOMAIN,
          euRegion: MAILGUN_EU_REGION
        }
      });
    }

    // Test exitoso: configuración presente
    return res.status(200).json({ 
      success: true, 
      message: 'Mailgun configuración OK (test simplificado)',
      debug: {
        domain: MAILGUN_DOMAIN,
        euRegion: MAILGUN_EU_REGION === 'true',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: err.message,
      stack: err.stack
    });
  }
});

export default router;
