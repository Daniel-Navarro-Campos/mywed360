#!/usr/bin/env node
/**
 * run-with-watch.js
 *
 * Ejecuta un comando hijo y lo monitoriza.
 * - `--timeout`   Segundos máximos de ejecución (hard timeout).
 * - `--idle`      Segundos máximos sin salida en STDOUT/STDERR (idle timeout).
 * - El comando real se pasa tras `--`.
 *
 * Ejemplo:
 *   node scripts/run-with-watch.js --timeout=600 --idle=30 -- npm run lint
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------- Utilidades ---------- //
const ISO = () => new Date().toISOString();
const logDir = path.resolve(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'tasks.log');

function appendLog(entry) {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n', 'utf8');
  } catch (e) {
    // No interrumpimos si falla el logging
    console.error('No se pudo escribir en tasks.log:', e.message);
  }
}

// ---------- Parseo de argumentos ---------- //
const argv = process.argv.slice(2);
let timeoutSec = 0; // 0 => deshabilitado
let idleSec = 0; // 0 => deshabilitado

// Buscamos separador '--' que indica inicio del comando real
const sepIndex = argv.indexOf('--');
if (sepIndex === -1 || sepIndex === argv.length - 1) {
  console.error('Uso: node scripts/run-with-watch.js [--timeout=seg] [--idle=seg] -- comando [args]');
  process.exit(1);
}

const flagArgs = argv.slice(0, sepIndex);
const cmdArgs = argv.slice(sepIndex + 1);

flagArgs.forEach(arg => {
  if (arg.startsWith('--timeout=')) {
    timeoutSec = Number(arg.split('=')[1]);
  } else if (arg.startsWith('--idle=')) {
    idleSec = Number(arg.split('=')[1]);
  }
});

if (Number.isNaN(timeoutSec) || Number.isNaN(idleSec)) {
  console.error('Parámetros numéricos inválidos');
  process.exit(1);
}

const command = cmdArgs[0];
const commandArgs = cmdArgs.slice(1);

// ---------- Lanzar proceso ---------- //
appendLog({ timestamp: ISO(), pid: process.pid, childCmd: [command, ...commandArgs].join(' '), action: 'start' });

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: process.platform === 'win32', // Facilita ejecutar scripts npm en Windows
});

let hardTimeout;
let idleTimeout;

function clearTimers() {
  if (hardTimeout) clearTimeout(hardTimeout);
  if (idleTimeout) clearTimeout(idleTimeout);
}

function scheduleHardTimeout() {
  if (timeoutSec > 0) {
    hardTimeout = setTimeout(() => {
      appendLog({ timestamp: ISO(), pid: child.pid, action: 'timeout', seconds: timeoutSec });
      console.error(`Proceso excedió timeout de ${timeoutSec}s. Matando proceso...`);
      child.kill();
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, timeoutSec * 1000);
  }
}

function resetIdleTimer() {
  if (idleSec > 0) {
    if (idleTimeout) clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      appendLog({ timestamp: ISO(), pid: child.pid, action: 'idle-timeout', seconds: idleSec });
      console.error(`Sin actividad durante ${idleSec}s. Matando proceso...`);
      child.kill();
      setTimeout(() => child.kill('SIGKILL'), 5000);
    }, idleSec * 1000);
  }
}

scheduleHardTimeout();
resetIdleTimer(); // programa el primer idle timer

// Reiniciamos el idle timer con cada salida
child.stdout && child.stdout.on('data', resetIdleTimer);
child.stderr && child.stderr.on('data', resetIdleTimer);

child.on('exit', (code, signal) => {
  clearTimers();
  appendLog({ timestamp: ISO(), pid: child.pid, action: 'end', status: code, signal });
  process.exit(code ?? 1);
});

child.on('error', err => {
  clearTimers();
  appendLog({ timestamp: ISO(), pid: child.pid, action: 'error', message: err.message });
  console.error('Error al lanzar proceso hijo:', err);
  process.exit(1);
});
