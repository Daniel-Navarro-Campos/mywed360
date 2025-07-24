// Script para verificar el estado de la aplicación
const fs = require('fs');
const path = require('path');
const os = require('os');

// Información sobre el sistema
const systemInfo = {
  platform: os.platform(),
  release: os.release(),
  type: os.type(),
  arch: os.arch(),
  memory: {
    total: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    free: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB'
  }
};

// Verificar puertos
const { exec } = require('child_process');
exec('netstat -ano | findstr "5173 5174"', (error, stdout, stderr) => {
  const portInfo = {
    error: error ? error.toString() : null,
    stderr: stderr ? stderr.toString() : null,
    stdout: stdout ? stdout.toString() : null
  };

  // Verificar procesos Node
  exec('tasklist | findstr "node"', (err, out, stderror) => {
    const nodeProcesses = {
      error: err ? err.toString() : null,
      stderr: stderror ? stderror.toString() : null,
      stdout: out ? out.toString() : null
    };

    // Juntar toda la información
    const debugInfo = {
      system: systemInfo,
      ports: portInfo,
      nodeProcesses: nodeProcesses,
      date: new Date().toISOString()
    };

    // Guardar la información en un archivo
    fs.writeFileSync(
      path.join(__dirname, 'debug_info.json'),
      JSON.stringify(debugInfo, null, 2),
      'utf8'
    );
    
    console.log('Información de depuración guardada en src/debug_info.json');
  });
});
