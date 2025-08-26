// Servicio de diagnóstico centralizado
// Implementación mínima para evitar errores en build.
// TODO: integrar diagnósticos reales de Firebase, backend y Mailgun.

export async function runFullDiagnostics() {
  return {
    timestamp: new Date().toISOString(),
    firebase: { status: 'unknown' },
    backend: { status: 'unknown' },
    mailgun: { status: 'unknown' },
  };
}

export default {
  runFullDiagnostics,
};
