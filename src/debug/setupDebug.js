// Configura manejadores globales de errores para registrar fallos inesperados
import { performanceMonitor } from '../services/PerformanceMonitor';

// Maneja errores de ventana (JS runtime)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    try {
      performanceMonitor.logError('window_error', event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    } catch (e) {
      console.error('Error al registrar window_error', e);
    }
  });

  // Maneja rechazos de promesas no capturados
  window.addEventListener('unhandledrejection', (event) => {
    try {
      performanceMonitor.logError('unhandled_promise_rejection', event.reason);
    } catch (e) {
      console.error('Error al registrar unhandledrejection', e);
    }
  });
}
