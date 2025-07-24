// Script para probar las variables de entorno
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar .env desde la carpeta actual
const localEnvPath = path.join(__dirname, '.env');
console.log('Intentando cargar desde:', localEnvPath);
let result = dotenv.config({ path: localEnvPath });

// Si falla, intentar cargar desde el directorio padre
if (result.error) {
  const parentEnvPath = path.join(__dirname, '..', '.env');
  console.log('Intentando cargar desde:', parentEnvPath);
  result = dotenv.config({ path: parentEnvPath });
}

// Mostrar resultado de la carga
if (result.error) {
  console.error('❌ Error cargando .env:', result.error.message);
} else {
  console.log('✅ .env cargado correctamente');
}

// Mostrar las variables de entorno de Mailgun
console.log('\nVariables de Mailgun:');
console.log('VITE_MAILGUN_API_KEY:', process.env.VITE_MAILGUN_API_KEY || 'no definida');
console.log('VITE_MAILGUN_DOMAIN:', process.env.VITE_MAILGUN_DOMAIN || 'no definida');
console.log('VITE_MAILGUN_SENDING_DOMAIN:', process.env.VITE_MAILGUN_SENDING_DOMAIN || 'no definida');
console.log('VITE_MAILGUN_EU_REGION:', process.env.VITE_MAILGUN_EU_REGION || 'no definida');

// Mostrar puerto configurado
console.log('\nPuerto configurado:', process.env.PORT || '3000 (valor por defecto)');
