import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Asegurar que la carpeta logs exista
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración de Winston para mostrar los logs en consola y guardarlos en archivo
const { combine, timestamp, colorize, printf, errors, json } = winston.format;

const humanFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }) // Incluye stack trace en errores
  ),
  transports: [
    // Consola con colores, para ver en tiempo real en CMD/PowerShell
    new winston.transports.Console({
      format: combine(colorize(), humanFormat),
    }),
    // Archivo para errores
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
    }),
  ],
});

export default logger;
