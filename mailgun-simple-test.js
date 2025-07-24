// Script básico para probar la autenticación con Mailgun
console.log('===== INICIO DE PRUEBA MAILGUN SIMPLE =====');

try {
  console.log('Cargando módulos...');
  const formData = require('form-data');
  const Mailgun = require('mailgun.js');
  
  console.log('Módulos cargados correctamente.');
  console.log('Fecha y hora: ' + new Date().toISOString());
  
  // Configuración básica
  const apiKey = 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154';
  const domain = 'mywed360.com';
  
  console.log('Configuración:');
  console.log(`- API Key: ${apiKey.substring(0, 6)}...${apiKey.slice(-8)}`);
  console.log(`- Dominio: ${domain}`);
  
  // Crear cliente Mailgun
  console.log('Creando cliente Mailgun...');
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: 'https://api.eu.mailgun.net' // Región EU
  });
  
  console.log('Cliente creado, intentando listar dominios...');
  
  // Intento simple de listar dominios
  mg.domains.list()
    .then(data => {
      console.log('✅ Autenticación exitosa!');
      console.log('Dominios:', JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.log('❌ Error en autenticación:');
      console.log('Código:', error.status);
      console.log('Mensaje:', error.message);
      console.log('Error completo:', JSON.stringify(error, null, 2));
    });
  
} catch (error) {
  console.log('❌❌ ERROR CRÍTICO:');
  console.log(error);
}
