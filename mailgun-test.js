// Script para probar Mailgun directamente - versión simplificada
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const dotenv = require('dotenv');
const path = require('path');

// Función para escribir logs
const logFile = './mailgun-test.log';
fs.writeFileSync(logFile, `=== Prueba Mailgun ${new Date().toISOString()} ===\n`, { flag: 'w' });

function log(message) {
  const logMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n', { flag: 'a' });
}

// Verificar si archivo .env existe
const envPath = path.resolve(process.cwd(), '.env');
log(`Intentando cargar .env desde: ${envPath}`);
log(`El archivo existe: ${fs.existsSync(envPath) ? 'Sí' : 'No'}`);

if (fs.existsSync(envPath)) {
  log('Contenido del archivo .env:');
  const envContent = fs.readFileSync(envPath, 'utf8');
  log('--- INICIO CONTENIDO .ENV ---');
  // Ocultamos información sensible antes de mostrarla
  const redactedContent = envContent
    .replace(/(API_KEY=)([^
]+)/gi, '$1[REDACTADO]')
    .replace(/(SECRET[^=]+=)([^
]+)/gi, '$1[REDACTADO]')
    .replace(/(PASSWORD=)([^
]+)/gi, '$1[REDACTADO]')
    .replace(/(TOKEN=)([^
]+)/gi, '$1[REDACTADO]');
  log(redactedContent);
  log('--- FIN CONTENIDO .ENV ---');
}

// Cargar variables de entorno
let result = dotenv.config({ path: envPath });

if (result.error) {
  const parentEnvPath = path.resolve(process.cwd(), '../.env');
  log(`Error al cargar .env: ${result.error}`);
  log(`Intentando cargar .env desde: ${parentEnvPath}`);
  result = dotenv.config({ path: parentEnvPath });
  
  if (result.error) {
    log(`Error al cargar .env desde directorio padre: ${result.error}`);
  }
}

// Mostrar configuración actual (variables de entorno)
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_EU_REGION = process.env.MAILGUN_EU_REGION === 'true';
const VITE_MAILGUN_API_KEY = process.env.VITE_MAILGUN_API_KEY;
const VITE_MAILGUN_DOMAIN = process.env.VITE_MAILGUN_DOMAIN;

log('\n=== Configuración de Mailgun ===');
log(`API Key (Backend): ${MAILGUN_API_KEY ? `${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.slice(-4)}` : 'no definida'}`);
log(`API Key (Frontend): ${VITE_MAILGUN_API_KEY ? `${VITE_MAILGUN_API_KEY.substring(0, 5)}...${VITE_MAILGUN_API_KEY.slice(-4)}` : 'no definida'}`);
log(`Dominio (Backend): ${MAILGUN_DOMAIN || 'no definido'}`);
log(`Dominio (Frontend): ${VITE_MAILGUN_DOMAIN || 'no definido'}`);
log(`Región EU: ${MAILGUN_EU_REGION ? 'Sí' : 'No'}`);
log(`Variables tienen el mismo valor: ${MAILGUN_API_KEY === VITE_MAILGUN_API_KEY ? 'Sí' : 'No'}`);

// Crear cliente de Mailgun
const mailgunClient = new Mailgun(formData);
const mg = mailgunClient.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
});

// Función para enviar correo
async function enviarCorreo(config) {
  const { domain, from, to, subject, message } = config;
  
  log(`\n=== Probando configuración: ${subject} ===`);
  log(`Dominio: ${domain}`);
  log(`Desde: ${from}`);
  log(`Para: ${to}`);
  
  try {
    const data = {
      from: from,
      to: to,
      subject: subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">${message}</div>`
    };
    
    log('Datos de envío:');
    log(data);
    
    log('Configuración del cliente Mailgun:');
    log({
      username: 'api',
      key: `${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.slice(-4)}`,
      url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });
    
    log('Enviando correo...');
    const result = await mg.messages.create(domain, data);
    log('✅ ÉXITO:');
    log(`ID: ${result.id}`);
    log(`Mensaje: ${result.message}`);
    log('Respuesta completa:');
    log(result);
    return { success: true, result };
  } catch (error) {
    log('❌ ERROR:');
    log(`Mensaje: ${error.message}`);
    
    if (error.details) {
      log(`Detalles: ${JSON.stringify(error.details)}`);
    }
    if (error.statusCode) {
      log(`Código de estado: ${error.statusCode}`);
    }
    
    log('Error completo:');
    log(error);
    
    // Intentar obtener más información sobre el error
    if (error.response) {
      log('Respuesta del servidor:');
      log(error.response.body || error.response);
    }
    
    return { success: false, error };
  }
}

// Configuraciones para probar
const configuraciones = [
  {
    domain: MAILGUN_DOMAIN,
    from: `test@${MAILGUN_DOMAIN}`,
    to: 'danielnavarrocampos@icloud.com',
    subject: '[Prueba 1] Correo simple con dominio base',
    message: 'Este es un mensaje de prueba usando la dirección simple con dominio base.'
  },
  {
    domain: MAILGUN_DOMAIN,
    from: `Test <test@${MAILGUN_DOMAIN}>`,
    to: 'danielnavarrocampos@icloud.com',
    subject: '[Prueba 2] Formato nombre con dominio base',
    message: 'Este es un mensaje de prueba usando el formato nombre con dominio base.'
  },
  {
    domain: `mg.${MAILGUN_DOMAIN.replace('mg.', '')}`,
    from: `test@mg.${MAILGUN_DOMAIN.replace('mg.', '')}`,
    to: 'danielnavarrocampos@icloud.com',
    subject: '[Prueba 3] Correo simple con mg subdomain',
    message: 'Este es un mensaje de prueba usando la dirección simple con mg subdomain.'
  },
  {
    domain: `mg.${MAILGUN_DOMAIN.replace('mg.', '')}`,
    from: `Test <test@mg.${MAILGUN_DOMAIN.replace('mg.', '')}>`,
    to: 'danielnavarrocampos@icloud.com',
    subject: '[Prueba 4] Formato nombre con mg subdomain',
    message: 'Este es un mensaje de prueba usando el formato nombre con mg subdomain.'
  }
];

// Función principal para ejecutar pruebas
async function ejecutarPruebas() {
  console.log('\n=== INICIANDO PRUEBAS DE MAILGUN ===');
  
  const resultados = [];
  
  for (let i = 0; i < configuraciones.length; i++) {
    console.log(`\n--- Prueba ${i+1} de ${configuraciones.length} ---`);
    const resultado = await enviarCorreo(configuraciones[i]);
    resultados.push({
      config: configuraciones[i],
      resultado: resultado
    });
  }
  
  console.log('\n=== RESUMEN DE RESULTADOS ===');
  const exitosos = resultados.filter(r => r.resultado.success);
  console.log(`Configuraciones exitosas: ${exitosos.length} de ${resultados.length}`);
  
  if (exitosos.length > 0) {
    console.log('\n✅ Configuraciones que funcionaron:');
    exitosos.forEach((r, i) => {
      console.log(`  ${i+1}. Dominio: ${r.config.domain}, From: ${r.config.from}`);
    });
  } else {
    console.log('\n❌ Ninguna configuración funcionó. Revisa los errores anteriores.');
  }
}

// Ejecutar las pruebas
ejecutarPruebas().catch(error => {
  console.error('Error general:', error);
});
