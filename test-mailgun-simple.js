// Script simple para probar Mailgun directamente
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const dotenv = require('dotenv');
const path = require('path');

console.log('====== DIAGNÓSTICO DE MAILGUN ======');

// Cargar variables de entorno
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Cargando .env desde: ${envPath}`);

try {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.log(`Error al cargar .env: ${result.error.message}`);
  } else {
    console.log('Variables de entorno cargadas correctamente.');
  }
} catch (error) {
  console.log(`Error al cargar dotenv: ${error.message}`);
}

// Mostrar configuración actual
console.log('\n===== VARIABLES DE ENTORNO =====');
console.log('MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? `${process.env.MAILGUN_API_KEY.substring(0, 5)}...${process.env.MAILGUN_API_KEY.slice(-4)}` : 'no definida');
console.log('MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || 'no definido');
console.log('MAILGUN_EU_REGION:', process.env.MAILGUN_EU_REGION === 'true' ? 'true' : 'false');
console.log('VITE_MAILGUN_API_KEY:', process.env.VITE_MAILGUN_API_KEY ? `${process.env.VITE_MAILGUN_API_KEY.substring(0, 5)}...${process.env.VITE_MAILGUN_API_KEY.slice(-4)}` : 'no definida');
console.log('VITE_MAILGUN_DOMAIN:', process.env.VITE_MAILGUN_DOMAIN || 'no definido');

// Verificar que las variables necesarias estén definidas
const requiredVars = ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`\n❌ ERROR: Faltan variables de entorno: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Crear cliente de Mailgun
try {
  console.log('\n===== CONFIGURACIÓN DEL CLIENTE =====');
  
  const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
  const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
  const MAILGUN_EU_REGION = process.env.MAILGUN_EU_REGION === 'true';
  
  console.log('API Key:', `${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.slice(-4)}`);
  console.log('Dominio:', MAILGUN_DOMAIN);
  console.log('Región EU:', MAILGUN_EU_REGION ? 'Sí' : 'No');
  
  const mailgunClient = new Mailgun(formData);
  const mg = mailgunClient.client({
    username: 'api',
    key: MAILGUN_API_KEY,
    url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  });
  
  console.log('Cliente de Mailgun creado correctamente.');
  
  // Configuración para el correo de prueba
  const testDomain = MAILGUN_DOMAIN;
  const from = `Prueba <test@${testDomain}>`;
  const to = 'danielnavarrocampos@icloud.com';
  const subject = 'Prueba de correo desde Mailgun';
  const text = 'Este es un mensaje de prueba enviado a través de Mailgun';
  const html = '<div style="font-family: Arial, sans-serif; color: #333;">Este es un mensaje de prueba enviado a través de <b>Mailgun</b></div>';
  
  console.log('\n===== ENVIANDO CORREO DE PRUEBA =====');
  console.log('Desde:', from);
  console.log('Para:', to);
  console.log('Asunto:', subject);
  
  // Enviar correo
  mg.messages.create(testDomain, {
    from: from,
    to: to,
    subject: subject,
    text: text,
    html: html
  })
  .then(result => {
    console.log('\n✅ ÉXITO:');
    console.log('ID:', result.id);
    console.log('Mensaje:', result.message);
    console.log('\nDetalles completos de la respuesta:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.log('\n❌ ERROR:');
    console.log('Mensaje:', error.message);
    
    if (error.details) {
      console.log('Detalles:', JSON.stringify(error.details, null, 2));
    }
    
    if (error.statusCode) {
      console.log('Código de estado HTTP:', error.statusCode);
    }
    
    if (error.response && error.response.body) {
      console.log('Respuesta del servidor:', JSON.stringify(error.response.body, null, 2));
    } else if (error.response) {
      console.log('Respuesta del servidor:', JSON.stringify(error.response, null, 2));
    }
    
    console.log('\nError completo:');
    console.log(error);
  });
} catch (error) {
  console.error(`\n❌ ERROR GENERAL: ${error.message}`);
  console.error(error);
}
