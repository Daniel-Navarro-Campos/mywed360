import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * GET /api/diagnostic/status
 * Endpoint de diagnóstico completo del backend
 * Verifica configuración, variables de entorno y conectividad
 */
router.get('/status', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      backend: {
        status: 'running',
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(process.uptime())
      },
      environment_variables: {
        mailgun: {
          api_key: !!process.env.MAILGUN_API_KEY,
          domain: !!process.env.MAILGUN_DOMAIN,
          eu_region: process.env.MAILGUN_EU_REGION === 'true'
        },
        openai: {
          api_key: !!process.env.OPENAI_API_KEY
        },
        cors: {
          allowed_origin: process.env.ALLOWED_ORIGIN || 'not_set'
        }
      },
      routes: {
        mailgun_test: '/api/mailgun/test',
        diagnostic: '/api/diagnostic/status',
        health: '/health'
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Backend diagnostic complete',
      data: diagnostics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Diagnostic failed',
      error: error.message
    });
  }
});

/**
 * GET /api/diagnostic/routes
 * Lista todas las rutas registradas en el backend
 */
router.get('/routes', (req, res) => {
  try {
    const routes = [];
    
    // Obtener todas las rutas registradas
    req.app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            const basePath = middleware.regexp.source
              .replace('\\', '')
              .replace('(?=\\/|$)', '')
              .replace('^', '')
              .replace('$', '');
            
            routes.push({
              path: basePath + handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Routes listed successfully',
      data: {
        total_routes: routes.length,
        routes: routes.sort((a, b) => a.path.localeCompare(b.path))
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to list routes',
      error: error.message
    });
  }
});

export default router;
