// Script para probar específicamente la autenticación y autorización con Mailgun
const formData = require('form-data');
const Mailgun = require('mailgun.js');

console.log('===== PRUEBA DE AUTENTICACIÓN MAILGUN =====');
console.log('Fecha y hora: ' + new Date().toISOString());

// Configuración de Mailgun - probaremos múltiples configuraciones
const configs = [
  {
    name: 'Configuración 1 - API key privada + mywed360.com',
    apiKey: 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154',
    domain: 'mywed360.com',
    euRegion: true
  },
  {
    name: 'Configuración 2 - API key privada + mg.mywed360.com',
    apiKey: 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154',
    domain: 'mg.mywed360.com',
    euRegion: true
  },
  {
    name: 'Configuración 3 - API key privada + EU false',
    apiKey: 'a42e6604fb3e4b737f281cd3dbc6309a-0ce15100-24828154',
    domain: 'mywed360.com',
    euRegion: false
  }
];

// Función para probar una configuración
async function testConfig(config) {
  console.log(`\n----- Probando: ${config.name} -----`);
  console.log(`API Key: ${config.apiKey.substring(0, 6)}...${config.apiKey.slice(-8)}`);
  console.log(`Dominio: ${config.domain}`);
  console.log(`Región EU: ${config.euRegion ? 'Sí' : 'No'}`);
  
  try {
    // Crear cliente Mailgun
    const mailgunClient = new Mailgun(formData);
    const mg = mailgunClient.client({
      username: 'api',
      key: config.apiKey,
      url: config.euRegion ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });
    
    // 1. Primero, probar autenticación básica obteniendo dominios
    console.log('\nPaso 1: Verificando autenticación básica (listado de dominios)...');
    try {
      const domains = await mg.domains.list();
      console.log('✅ Autenticación exitosa');
      console.log(`Dominios encontrados: ${domains.total_count}`);
      
      if (domains.items && domains.items.length > 0) {
        console.log('Dominios disponibles:');
        domains.items.forEach(domain => {
          console.log(` - ${domain.name} (${domain.state})`);
        });
      }
    } catch (error) {
      console.log('❌ Error en autenticación básica:');
      console.log(`  Código: ${error.status || 'desconocido'}`);
      console.log(`  Mensaje: ${error.message || 'desconocido'}`);
      if (error.details) {
        console.log(`  Detalles: ${JSON.stringify(error.details)}`);
      }
    }
    
    // 2. Probar validación del dominio
    console.log('\nPaso 2: Verificando dominio específico...');
    try {
      const domainInfo = await mg.domains.get(config.domain);
      console.log('✅ Dominio verificado correctamente');
      console.log(`Nombre: ${domainInfo.domain.name}`);
      console.log(`Estado: ${domainInfo.domain.state}`);
      console.log(`Creado en: ${domainInfo.domain.created_at}`);
    } catch (error) {
      console.log('❌ Error al verificar dominio:');
      console.log(`  Código: ${error.status || 'desconocido'}`);
      console.log(`  Mensaje: ${error.message || 'desconocido'}`);
    }
    
    // 3. Intentar enviar un email de prueba
    console.log('\nPaso 3: Enviando email de prueba...');
    const from = `Prueba <test@${config.domain}>`;
    const to = 'danielnavarrocampos@icloud.com';
    const subject = `Prueba de Mailgun - Config ${configs.indexOf(config) + 1}`;
    const text = `Esta es una prueba de envío desde la configuración ${config.name}`;
    
    try {
      const result = await mg.messages.create(config.domain, {
        from,
        to,
        subject,
        text
      });
      
      console.log('✅ Correo enviado correctamente');
      console.log(`ID: ${result.id || 'desconocido'}`);
      console.log(`Mensaje: ${result.message || 'desconocido'}`);
    } catch (error) {
      console.log('❌ Error al enviar correo:');
      console.log(`  Código: ${error.status || 'desconocido'}`);
      console.log(`  Mensaje: ${error.message || 'desconocido'}`);
      
      if (error.details) {
        console.log(`  Detalles: ${JSON.stringify(error.details)}`);
      }
    }
    
  } catch (error) {
    console.log('❌❌ ERROR CRÍTICO:');
    console.log(error);
  }
}

// Ejecutar pruebas para cada configuración
async function runTests() {
  for (const config of configs) {
    await testConfig(config);
    console.log('\n' + '='.repeat(50));
  }
  
  console.log('\n===== FIN DE PRUEBAS =====');
}

// Ejecutar todas las pruebas
runTests().catch(error => {
  console.error('Error global en pruebas:', error);
});
