// Script para verificar la carga de dotenv
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('====== VERIFICACIÓN DE DOTENV ======');

// Comprobar si el archivo .env existe
const envPath = path.resolve(process.cwd(), '.env');
console.log(`Ruta del archivo .env: ${envPath}`);
console.log(`¿El archivo .env existe? ${fs.existsSync(envPath) ? 'SÍ' : 'NO'}`);

// Si existe, mostrar su contenido
if (fs.existsSync(envPath)) {
  console.log('\nContenido del archivo .env (valores sensibles ocultos):');
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Mostrar el contenido ocultando valores sensibles
  const redactedContent = envContent
    .replace(/(API_KEY=)([^\n]+)/gi, '$1[REDACTADO]')
    .replace(/(SECRET[^=]+=)([^\n]+)/gi, '$1[REDACTADO]')
    .replace(/(PASSWORD=)([^\n]+)/gi, '$1[REDACTADO]')
    .replace(/(TOKEN=)([^\n]+)/gi, '$1[REDACTADO]');
  console.log(redactedContent);
}

// Intentar cargar el archivo .env
console.log('\nIntentando cargar dotenv...');
try {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.log(`❌ ERROR al cargar .env: ${result.error.message}`);
  } else {
    console.log('✅ dotenv cargado correctamente');
  }
} catch (error) {
  console.log(`❌ ERROR en dotenv: ${error.message}`);
}

// Verificar que las variables existen
console.log('\nVariables de entorno de Mailgun:');
const mailgunVars = [
  'MAILGUN_API_KEY', 
  'MAILGUN_DOMAIN', 
  'MAILGUN_EU_REGION',
  'VITE_MAILGUN_API_KEY',
  'VITE_MAILGUN_DOMAIN'
];

mailgunVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('API_KEY') 
      ? `${value.substring(0, 5)}...${value.slice(-4)}`
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: no definida`);
  }
});

console.log('\n====== FIN DE LA VERIFICACIÓN ======');
