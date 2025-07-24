// Script para probar el envío de correo usando un dominio sandbox de Mailgun
const formData = require('form-data');
const Mailgun = require('mailgun.js');

// Configuración para sandbox
// IMPORTANTE: Usar solo para pruebas, tiene límite de destinatarios permitidos
const MAILGUN_API_KEY = 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154';
const MAILGUN_DOMAIN = 'sandbox68219bb264b3429fa0d50e9b20f55af8.mailgun.org'; // Este es un ejemplo de dominio sandbox
const SENDER_EMAIL = 'mailgun@sandbox68219bb264b3429fa0d50e9b20f55af8.mailgun.org'; // Debe ser este formato para sandbox

// NOTA: En modo sandbox, solo puedes enviar a destinatarios autorizados previamente
const RECIPIENT_EMAIL = 'danielnavarrocampos@icloud.com'; // Asegúrate que este email esté autorizado en tu sandbox

console.log('===== PRUEBA CON DOMINIO SANDBOX DE MAILGUN =====');
console.log(`Fecha: ${new Date().toISOString()}`);
console.log(`Dominio sandbox: ${MAILGUN_DOMAIN}`);
console.log(`Remitente: ${SENDER_EMAIL}`);
console.log(`Destinatario: ${RECIPIENT_EMAIL}`);
console.log('-------------------------------------------');

async function sendTestEmail() {
  try {
    console.log('1. Iniciando cliente Mailgun...');
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: MAILGUN_API_KEY,
      url: 'https://api.eu.mailgun.net' // Usar región EU
    });
    
    console.log('2. Cliente creado, preparando datos para envío...');
    const msgData = {
      from: `Prueba Lovenda <${SENDER_EMAIL}>`,
      to: RECIPIENT_EMAIL,
      subject: 'Prueba desde sandbox Mailgun - Lovenda',
      text: `Este es un mensaje de prueba enviado desde el dominio sandbox de Mailgun.
      
Fecha y hora: ${new Date().toISOString()}
      
Este tipo de dominio no requiere verificación DNS y es ideal para pruebas de desarrollo.
      
Saludos,
Equipo Lovenda`,
      html: `<h2>Prueba desde sandbox Mailgun - Lovenda</h2>
      <p>Este es un mensaje de prueba enviado desde el dominio sandbox de Mailgun.</p>
      <p><strong>Fecha y hora:</strong> ${new Date().toISOString()}</p>
      <p>Este tipo de dominio no requiere verificación DNS y es ideal para pruebas de desarrollo.</p>
      <p>Saludos,<br>Equipo Lovenda</p>`
    };
    
    console.log('3. Enviando correo de prueba...');
    const result = await mg.messages.create(MAILGUN_DOMAIN, msgData);
    
    console.log('✅ ¡Correo enviado con éxito!');
    console.log('Respuesta de Mailgun:', result);
    console.log('\nINFORMACIÓN IMPORTANTE:');
    console.log('- Los dominios sandbox solo permiten enviar a destinatarios autorizados previamente');
    console.log('- Para producción, se debe completar la verificación DNS del dominio principal');
    console.log('- La apariencia del remitente será siempre el email del sandbox, no personalizable');
    
  } catch (error) {
    console.error('❌ Error al enviar el correo:');
    console.error(`Status: ${error.status || 'desconocido'}`);
    console.error(`Mensaje: ${error.message || 'desconocido'}`);
    console.error('Detalles completos del error:', error);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que el destinatario esté autorizado en la configuración del sandbox');
    console.error('2. Confirma que la API key sea correcta y tenga permisos para el sandbox');
    console.error('3. Asegúrate de usar el formato correcto de email para el remitente del sandbox');
  }
}

// Ejecutar la prueba
sendTestEmail()
  .then(() => {
    console.log('\n===== PRUEBA COMPLETADA =====');
  })
  .catch(err => {
    console.error('\n===== ERROR GLOBAL EN LA PRUEBA =====');
    console.error(err);
  })
  .finally(() => {
    console.log('\n===== FIN DEL SCRIPT =====');
    // Asegurarse de que el script termine
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });
