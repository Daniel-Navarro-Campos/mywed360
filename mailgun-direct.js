// Script para probar Mailgun con configuración directa
const formData = require('form-data');
const Mailgun = require('mailgun.js');

console.log('====== PRUEBA DIRECTA DE MAILGUN ======');

// Configuración directa (sin depender de dotenv)
const MAILGUN_API_KEY = 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154'; // Usar la misma API key que está en .env
const MAILGUN_DOMAIN = 'mywed360.com';
const MAILGUN_EU_REGION = true;

console.log('Configuración de Mailgun:');
console.log(`API Key: ${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.slice(-4)}`);
console.log(`Dominio: ${MAILGUN_DOMAIN}`);
console.log(`Región EU: ${MAILGUN_EU_REGION ? 'Sí' : 'No'}`);

// Crear cliente de Mailgun
try {
  const mailgunClient = new Mailgun(formData);
  const mg = mailgunClient.client({
    username: 'api',
    key: MAILGUN_API_KEY,
    url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  });
  
  console.log('Cliente de Mailgun creado correctamente');
  
  // Configuración para el correo de prueba
  const testDomain = MAILGUN_DOMAIN;
  const from = `Prueba <test@${testDomain}>`;
  const to = 'danielnavarrocampos@icloud.com';
  const subject = 'Prueba directa desde script Node.js';
  const text = 'Este es un mensaje de prueba enviado directamente sin dotenv';
  const html = '<div style="font-family: Arial, sans-serif; color: #333;">Este es un mensaje de prueba <b>directo</b> desde Node.js</div>';
  
  console.log('\nEnviando correo de prueba:');
  console.log(`De: ${from}`);
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  
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
    console.log(`ID: ${result.id}`);
    console.log(`Mensaje: ${result.message}`);
    console.log(`Respuesta completa: ${JSON.stringify(result)}`);
  })
  .catch(error => {
    console.log('\n❌ ERROR:');
    console.log(`Mensaje de error: ${error.message}`);
    
    if (error.details) {
      console.log(`Detalles: ${JSON.stringify(error.details)}`);
    }
    
    if (error.statusCode) {
      console.log(`Código HTTP: ${error.statusCode}`);
    }
    
    if (error.response) {
      console.log(`Respuesta del servidor: ${JSON.stringify(error.response)}`);
    }
  });
} catch (error) {
  console.log(`❌ ERROR GENERAL: ${error.message}`);
  console.log(error);
}
