// Script para probar Mailgun y generar un reporte HTML
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const fs = require('fs');
const path = require('path');

// Función para escribir el resultado en HTML
function generateHtmlReport(title, content) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const htmlPath = path.join(process.cwd(), 'public', `mailgun-report-${timestamp}.html`);
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Mailgun - ${timestamp}</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
      h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
      .success { color: green; }
      .error { color: red; }
      pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
      .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
      .header { font-weight: bold; margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="timestamp">Generado el: ${new Date().toLocaleString()}</div>
    <div class="content">
      ${content}
    </div>
  </body>
  </html>
  `;
  
  // Asegurarnos que el directorio public existe
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Escribir el archivo HTML
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`Reporte HTML generado en: ${htmlPath}`);
  return htmlPath;
}

// Comenzar la prueba
console.log('Iniciando prueba de Mailgun...');

// Configuración directa
const MAILGUN_API_KEY = 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154';
const MAILGUN_DOMAIN = 'mywed360.com';
const MAILGUN_EU_REGION = true;

// Contenido del informe
let reportContent = '';

// Función para agregar contenido al informe
function addToReport(title, content, isError = false) {
  reportContent += `
  <div class="card ${isError ? 'error' : ''}">
    <div class="header">${title}</div>
    <div>${typeof content === 'object' ? `<pre>${JSON.stringify(content, null, 2)}</pre>` : content}</div>
  </div>`;
  console.log(title);
}

// Agregar información de configuración
addToReport('Configuración de Mailgun', `
  <ul>
    <li><strong>API Key:</strong> ${MAILGUN_API_KEY.substring(0, 5)}...${MAILGUN_API_KEY.slice(-4)}</li>
    <li><strong>Dominio:</strong> ${MAILGUN_DOMAIN}</li>
    <li><strong>Región EU:</strong> ${MAILGUN_EU_REGION ? 'Sí' : 'No'}</li>
  </ul>
`);

// Crear cliente de Mailgun
try {
  const mailgunClient = new Mailgun(formData);
  const mg = mailgunClient.client({
    username: 'api',
    key: MAILGUN_API_KEY,
    url: MAILGUN_EU_REGION ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  });
  
  addToReport('Cliente Mailgun', 'Cliente creado correctamente');
  
  // Configuración del correo
  const testDomain = MAILGUN_DOMAIN;
  const from = `Prueba HTML <test@${testDomain}>`;
  const to = 'danielnavarrocampos@icloud.com';
  const subject = 'Prueba con informe HTML - ' + new Date().toLocaleString();
  const text = 'Este es un mensaje de prueba con informe HTML';
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
      <h2>Prueba de correo con Mailgun</h2>
      <p>Este correo fue enviado como parte de una prueba de configuración de Mailgun.</p>
      <p>Fecha y hora: ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  addToReport('Datos del correo', `
    <ul>
      <li><strong>De:</strong> ${from}</li>
      <li><strong>Para:</strong> ${to}</li>
      <li><strong>Asunto:</strong> ${subject}</li>
      <li><strong>Contenido HTML:</strong> <pre>${html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></li>
    </ul>
  `);
  
  // Enviar correo
  mg.messages.create(testDomain, {
    from: from,
    to: to,
    subject: subject,
    text: text,
    html: html
  })
  .then(result => {
    addToReport('Resultado del envío', 'Correo enviado exitosamente', false);
    addToReport('Detalles de la respuesta', result);
    
    // Generar el informe HTML
    const reportPath = generateHtmlReport('Prueba exitosa de Mailgun', reportContent);
    
    // Crear un archivo de texto con la ruta para facilitar el acceso
    fs.writeFileSync('mailgun-report-path.txt', reportPath);
    console.log(`La ruta al reporte se ha guardado en: mailgun-report-path.txt`);
  })
  .catch(error => {
    addToReport('Error en el envío', 'Ocurrió un error al enviar el correo', true);
    addToReport('Mensaje de error', error.message, true);
    
    if (error.details) {
      addToReport('Detalles del error', error.details, true);
    }
    
    if (error.statusCode) {
      addToReport('Código de estado HTTP', error.statusCode, true);
    }
    
    if (error.response) {
      addToReport('Respuesta del servidor', error.response, true);
    }
    
    // Generar el informe HTML
    const reportPath = generateHtmlReport('Error en prueba de Mailgun', reportContent);
    
    // Crear un archivo de texto con la ruta para facilitar el acceso
    fs.writeFileSync('mailgun-report-path.txt', reportPath);
    console.log(`La ruta al reporte se ha guardado en: mailgun-report-path.txt`);
  });
} catch (error) {
  addToReport('Error general', 'Error al crear el cliente de Mailgun', true);
  addToReport('Mensaje de error', error.message, true);
  
  // Generar el informe HTML
  const reportPath = generateHtmlReport('Error crítico en prueba de Mailgun', reportContent);
  
  // Crear un archivo de texto con la ruta para facilitar el acceso
  fs.writeFileSync('mailgun-report-path.txt', reportPath);
  console.log(`La ruta al reporte se ha guardado en: mailgun-report-path.txt`);
}
