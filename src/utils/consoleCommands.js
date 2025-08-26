/*
  Registro de comandos de consola para diagnóstico y utilidades.
  Se carga automáticamente desde src/main.jsx.
*/

// Aseguramos que no se ejecute en entornos donde window no esté disponible (SSR tests)
if (typeof window !== 'undefined') {
  // Espacio global para evitar colisiones
  window.mywed = window.mywed || {};

  /**
   * Ejecuta todas las comprobaciones de diagnóstico disponibles.
   * Ejemplo de uso en consola: mywed.checkAll()
   */
  window.mywed.checkAll = async () => {
    try {
      const diagService = await import('../services/diagnosticService.js');
      const report = await diagService.default.runFullDiagnostics?.();
      console.info('✅ Diagnóstico completo ejecutado', report);
      return report;
    } catch (err) {
      console.error('❌ Error al ejecutar checkAll()', err);
      throw err;
    }
  };

  /**
   * Limpia todos los logs del panel de diagnóstico.
   */
  window.mywed.clearDiagnostics = () => {
    try {
      const errorLogger = window.errorLogger;
      if (errorLogger?.clearAll) {
        errorLogger.clearAll();
        console.log('🧹 Diagnósticos limpiados');
      }
    } catch (err) {
      console.error('Error limpiando diagnósticos', err);
    }
  };

  console.info('🛠️  Comandos de consola MyWed360 registrados: mywed.checkAll(), mywed.clearDiagnostics()');
}
