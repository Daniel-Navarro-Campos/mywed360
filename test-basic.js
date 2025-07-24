// Script muy básico para verificar que Node.js está funcionando
console.log('====== PRUEBA BÁSICA DE NODE.JS ======');
console.log('Hora actual:', new Date().toISOString());
console.log('Variables de entorno detectadas:');

// Listar solo las variables de Mailgun
Object.keys(process.env)
  .filter(key => key.includes('MAIL') || key.includes('mail'))
  .forEach(key => {
    const value = process.env[key];
    // Ocultar información sensible
    const displayValue = key.includes('KEY') || key.includes('key') 
      ? `${value.substring(0, 5)}...${value.slice(-4)}`
      : value;
    console.log(`  ${key}: ${displayValue}`);
  });

console.log('\n====== FIN DE LA PRUEBA ======');
