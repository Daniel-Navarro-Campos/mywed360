import express from 'express';
const router = express.Router();
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from 'dotenv';

// Cargar variables de entorno correctas
dotenv.config({ path: '.env' });

// Variables de entorno de Mailgun
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_EU_REGION = process.env.MAILGUN_EU_REGION === 'true';

// Clientes alternativos de Mailgun para pruebas
const mailgunBase = new Mailgun(formData);
const mailgunClient1 = mailgunBase.client({ 
    username: 'api', 
    key: MAILGUN_API_KEY, 
    url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
});

const mailgunClient2 = mailgunBase.client({ 
    username: 'api', 
    key: MAILGUN_API_KEY, 
    url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net' 
});

// Ruta para diagnóstico completo
router.get('/environment', (req, res) => {
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
        const { to, subject, message } = req.body;
        
        if (!to || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos los campos son obligatorios (to, subject, message)' 
            });
        }
        
        // Lista de dominios y configuraciones a probar
        const testConfigs = [
            {
                description: "Dominio base con correo simple",
                client: mailgunClient1,
                domain: MAILGUN_DOMAIN,
                from: `test@${MAILGUN_DOMAIN}`
            },
            {
                description: "Dominio base con formato nombre",
                client: mailgunClient1,
                domain: MAILGUN_DOMAIN,
                from: `Test <test@${MAILGUN_DOMAIN}>`
            },
            {
                description: "Subdominio mg con correo simple",
                client: mailgunClient2,
                domain: `mg.${MAILGUN_DOMAIN.replace('mg.', '')}`, // Asegura que sea mg.dominio.com
                from: `test@mg.${MAILGUN_DOMAIN.replace('mg.', '')}`
            },
            {
                description: "Subdominio mg con formato nombre",
                client: mailgunClient2,
                domain: `mg.${MAILGUN_DOMAIN.replace('mg.', '')}`,
                from: `Test <test@mg.${MAILGUN_DOMAIN.replace('mg.', '')}>`
            }
        ];
        
        const results = [];
        
        // Probar cada configuración
        for (const config of testConfigs) {
            try {
                console.log(`Probando: ${config.description} (${config.from})`);
                
                const data = {
                    from: config.from,
                    to: to,
                    subject: `[Prueba] ${subject} - ${config.description}`,
                    text: message,
                    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
                           <p><strong>Configuración de prueba:</strong> ${config.description}</p>
                           <p>${message.replace(/\n/g, '<br>')}</p>
                           </div>`
                };
                
                const result = await config.client.messages.create(config.domain, data);
                
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
