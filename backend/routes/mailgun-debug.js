import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';
import mailgunJs from 'mailgun-js';

// Cargar variables de entorno correctas
dotenv.config({ path: '.env' });

// Helper para leer envs y crear clientes "mailgun-js" por dominio de forma segura
function getMailgunEnv() {
    return {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
        euRegion: (process.env.MAILGUN_EU_REGION || '').toString() === 'true'
    };
}

function createMailgunClient(domainOverride) {
    const { apiKey, domain, euRegion } = getMailgunEnv();
    if (!apiKey || !(domainOverride || domain)) {
        return null;
    }
    const hostCfg = euRegion ? { host: 'api.eu.mailgun.net' } : {};
    try {
        return mailgunJs({ apiKey, domain: domainOverride || domain, ...hostCfg });
    } catch (e) {
        console.error('No se pudo crear cliente mailgun-js (debug):', e.message);
        return null;
    }
}

// Ruta para diagnóstico completo
router.get('/environment', (req, res) => {
    const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
    const MAILGUN_EU_REGION = (process.env.MAILGUN_EU_REGION || '').toString() === 'true';
    // Devolver variables de entorno (ocultando parte de la API key)
    const config = {
        MAILGUN_API_KEY: MAILGUN_API_KEY ? `${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.substring(MAILGUN_API_KEY.length - 4)}` : 'no definido',
        MAILGUN_DOMAIN: MAILGUN_DOMAIN || 'no definido',
        MAILGUN_EU_REGION: MAILGUN_EU_REGION,
        NODE_ENV: process.env.NODE_ENV || 'no definido'
    };
    
    res.json({
        success: true,
        environment: config
    });
});

// Ruta para probar diferentes dominios
router.post('/test-domains', async (req, res) => {
    try {
        const env = getMailgunEnv();
        if (!env.apiKey || !env.domain) {
            return res.status(503).json({ success: false, message: 'Mailgun no está configurado en el servidor' });
        }

        const { to, subject, message } = req.body;
        
        if (!to || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios (to, subject, message)' 
            });
        }
        
        // Lista de dominios y configuraciones a probar (usando mailgun-js)
        const baseDomain = env.domain;
        const mgClientBase = createMailgunClient(baseDomain);
        const mgClientMg = createMailgunClient(`mg.${baseDomain.replace(/^mg\./, '')}`);

        const testConfigs = [
            {
                description: "Dominio base con correo simple",
                client: mgClientBase,
                domain: baseDomain,
                from: `test@${baseDomain}`
            },
            {
                description: "Dominio base con formato nombre",
                client: mgClientBase,
                domain: baseDomain,
                from: `Test <test@${baseDomain}>`
            },
            {
                description: "Subdominio mg con correo simple",
                client: mgClientMg,
                domain: `mg.${baseDomain.replace('mg.', '')}`, // Asegura que sea mg.dominio.com
                from: `test@mg.${baseDomain.replace('mg.', '')}`
            },
            {
                description: "Subdominio mg con formato nombre",
                client: mgClientMg,
                domain: `mg.${baseDomain.replace('mg.', '')}`,
                from: `Test <test@mg.${baseDomain.replace('mg.', '')}>`
            }
        ];
        
        const results = [];
        
        // Probar cada configuración
        for (const config of testConfigs) {
            try {
                console.log(`Probando: ${config.description} (${config.from})`);
                
                const mailData = {
                    from: config.from,
                    to: to,
                    subject: `[Prueba] ${subject} - ${config.description}`,
                    text: message,
                    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                           <p><strong>Configuración de prueba:</strong> ${config.description}</p>
                           <p>${message.replace(/\n/g, '<br>')}</p>
                           </div>`
                };
                if (!config.client) {
                    throw new Error('Cliente Mailgun no disponible para esta configuración');
                }
                const result = await config.client.messages().send(mailData);
                
                results.push({
                    success: true,
                    config: config.description,
                    from: config.from,
                    domain: config.domain,
                    result: result
                });
                
                console.log(`✅ Éxito con ${config.description}`);
                
            } catch (error) {
                console.error(`❌ Error con ${config.description}:`, error.message);
                
                results.push({
                    success: false,
                    config: config.description,
                    from: config.from,
                    domain: config.domain,
                    error: error.message,
                    status: error.statusCode || 'desconocido'
                });
            }
        }
        
        // Determinar si al menos una configuración tuvo éxito
        const anySuccess = results.some(r => r.success);
        
        return res.status(anySuccess ? 200 : 500).json({
            success: anySuccess,
            message: anySuccess 
                ? '¡Al menos una configuración funcionó! Revisa los detalles.' 
                : 'Todas las configuraciones fallaron. Revisa los detalles de cada error.',
            results: results
        });
        
    } catch (error) {
        console.error('Error general:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la prueba',
            error: error.message
        });
    }
});

export default router;
