// Script para verificar la configuración de Mailgun
import mailgunJs from 'mailgun-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.join(__dirname, '.env');
console.log('Cargando variables de entorno desde:', envPath);
dotenv.config({ path: envPath });

// Obtener configuración de Mailgun
const API_KEY = process.env.VITE_MAILGUN_API_KEY || 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154';
const DOMAIN = process.env.VITE_MAILGUN_SENDING_DOMAIN || 'mg.mywed360.com';
const EU_REGION = process.env.VITE_MAILGUN_EU_REGION === 'true';

console.log('Configuración actual:');
console.log('- API Key (primeros 5 caracteres):', API_KEY.substring(0, 5) + '...');
console.log('- Dominio de envío:', DOMAIN);
console.log('- Región EU:', EU_REGION);

// Inicializar cliente de Mailgun
const mailgun = mailgunJs({
  apiKey: API_KEY,
  domain: DOMAIN,
  ...(EU_REGION && { host: 'api.eu.mailgun.net' })
});

// Verificar conexión a Mailgun
async function checkMailgunConnection() {
  console.log('\nVerificando conexión a Mailgun...');
  
  try {
    // Obtener información del dominio
    console.log('\nConsultando información del dominio...');
    const domainInfo = await mailgun.get(`/domains/${DOMAIN}`);
    console.log('✅ Dominio encontrado:', DOMAIN);
    console.log('- Estado de dominio:', domainInfo.domain.state);
    console.log('- Región:', domainInfo.domain.region);
    console.log('- Registros DNS creados:', domainInfo.domain.created_at);
    
    // Verificar si el correo personalizado existe/está autorizado
    const testEmail = 'danielnavarrocampos@mywed360.com';
    console.log('\nVerificando autorización para correo personalizado:', testEmail);
    
    // Intentar enviar un correo de prueba interno
    try {
      const result = await mailgun.messages().send({
        from: testEmail,
        to: 'test-interno@mailgun.org', // Este correo no recibirá realmente el mensaje
        subject: 'Prueba de verificación - NO SE ENVIARÁ',
        text: 'Esta es una prueba de verificación. Este mensaje no será realmente enviado.',
        'o:testmode': true // Activar modo de prueba para no enviar realmente
      });
      console.log('✅ El correo personalizado está autorizado para envío:', result);
    } catch (sendError) {
      console.error('❌ Error al verificar correo personalizado:', sendError.message);
      
      if (sendError.message.includes('Forbidden')) {
        console.log('\nPosibles razones del error Forbidden:');
        console.log('1. El dominio no está completamente verificado en Mailgun');
        console.log('2. La API key no tiene permisos suficientes');
        console.log('3. El remitente no está autorizado para enviar desde este dominio');
        console.log('4. El dominio está en periodo de calentamiento o tiene restricciones');
      }
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con Mailgun:', error.message);
    if (error.statusCode === 401) {
      console.error('- Error de autenticación: API key inválida o revocada');
    } else if (error.statusCode === 404) {
      console.error('- Dominio no encontrado:', DOMAIN);
      console.error('- Verifica que el dominio esté registrado correctamente en Mailgun');
    } else {
      console.error('- Detalles del error:', error);
    }
  }
}

// Ejecutar verificación
checkMailgunConnection().catch(console.error);
