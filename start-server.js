// Script para iniciar el servidor backend con registro detallado
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Crear un archivo de registro
const logPath = path.join(__dirname, 'server-log.txt');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

// Función para registrar mensajes
function log(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;
    logStream.write(formattedMessage);
    console.log(formattedMessage);
}

// Registrar inicio
log('===== INICIANDO SERVIDOR BACKEND =====');
log(`Directorio actual: ${process.cwd()}`);

// Iniciar el proceso del servidor
const serverProcess = spawn('node', ['backend/index.js'], {
    stdio: 'pipe',
    shell: true
});

// Manejar salida estándar
serverProcess.stdout.on('data', (data) => {
    log(`[STDOUT] ${data.toString().trim()}`);
});

// Manejar errores
serverProcess.stderr.on('data', (data) => {
    log(`[ERROR] ${data.toString().trim()}`);
});

// Manejar cierre del proceso
serverProcess.on('close', (code) => {
    log(`El proceso del servidor terminó con código: ${code}`);
});

// Registrar PID del proceso
log(`Proceso del servidor iniciado con PID: ${serverProcess.pid}`);
log('El servidor debería estar escuchando en el puerto 4004');
log('Presiona Ctrl+C para detener el servidor');

// Mantener el script en ejecución
process.on('SIGINT', () => {
    log('Señal SIGINT recibida. Deteniendo el servidor...');
    serverProcess.kill();
    logStream.end();
    process.exit();
});
