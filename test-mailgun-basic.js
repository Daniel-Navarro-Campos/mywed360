// Script ultra básico para diagnosticar problemas con Mailgun
console.log('===== TEST MAILGUN BÁSICO =====');

// 1. Verificar si podemos cargar los módulos
try {
  console.log('Intentando cargar módulos...');
  const formData = require('form-data');
  console.log('✓ form-data cargado correctamente');
  
  const Mailgun = require('mailgun.js');
  console.log('✓ mailgun.js cargado correctamente');
} catch (error) {
  console.error('❌ ERROR al cargar módulos:', error.message);
  process.exit(1);
}

// 2. Variables de entorno y configuración
console.log('\n----- VARIABLES DE ENTORNO Y CONFIGURACIÓN -----');
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'mywed360.com';

console.log(`API Key: ${MAILGUN_API_KEY.substring(0, 6)}...${MAILGUN_API_KEY.slice(-8)}`);
console.log(`Dominio: ${MAILGUN_DOMAIN}`);

// 3. Crear cliente y intentar operación básica
console.log('\n----- PRUEBA DE CONEXIÓN -----');
try {
  const formData = require('form-data');
  const Mailgun = require('mailgun.js');
  
  console.log('Creando cliente Mailgun...');
  const mailgun = new Mailgun(formData);
  const mg = mailgun.client({
    username: 'api',
    key: MAILGUN_API_KEY,
    url: 'https://api.eu.mailgun.net'
  });
  
  console.log('Cliente creado, intentando listar dominios...');
  
  // Función de prueba asíncrona
  async function testConnection() {
    try {
      console.log('Iniciando petición de dominios...');
      const data = await mg.domains.list();
      console.log('✅ Petición completada!');
      console.log(`Número de dominios: ${data?.total_count || 'desconocido'}`);
      console.log('Dominios:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('❌ Error en la petición:');
      console.log(`Status: ${error.status || 'desconocido'}`);
      console.log(`Mensaje: ${error.message || 'desconocido'}`);
      console.error('Error completo:', error);
    }
  }
  
  // Ejecutar el test y mostrar resultados
  console.log('Ejecutando prueba de conexión...');
  testConnection().then(() => {
    console.log('\n===== FIN DEL TEST =====');
  }).catch(err => {
    console.error('Error crítico en test:', err);
  });
  
} catch (error) {
  console.error('❌ ERROR GENERAL:', error);
}
