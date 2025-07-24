// Servidor Express simple para pruebas
const express = require('express');
const cors = require('cors');
const fs = require('fs');

// Crear servidor Express
const app = express();
const PORT = 4005; // Cambiado de 4004 para evitar conflicto de puerto

// Configurar CORS para permitir todas las solicitudes en pruebas
app.use(cors({
  origin: '*',  // Permitir cualquier origen en pruebas
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parseo de JSON
app.use(express.json());

// Ruta de prueba básica
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'Servidor de prueba funcionando correctamente',
    tiempo: new Date().toISOString()
  });
});

// Ruta específica para probar Mailgun
app.post('/api/mail/test-personal-email', (req, res) => {
  const { from, to, subject, message } = req.body;
  
  // Registrar la solicitud para depuración
  const logData = {
    timestamp: new Date().toISOString(),
    endpoint: '/api/mail/test-personal-email',
    request: req.body
  };
  fs.appendFileSync('mail-test-requests.log', JSON.stringify(logData) + '\n');
  
  // Simular respuesta exitosa
  setTimeout(() => {
    res.status(200).json({
      success: true,
      message: 'Correo de prueba simulado con éxito',
      data: {
        from,
        to,
        subject,
        timestamp: new Date().toISOString()
      }
    });
  }, 1000); // Simular 1 segundo de procesamiento
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor de prueba iniciado en http://localhost:${PORT}`);
  console.log(`⏱️  ${new Date().toISOString()}`);
  console.log(`📧 Ruta de prueba de correo: http://localhost:${PORT}/api/mail/test-personal-email`);
});
