// Utilidad centralizada para obtener la URL base del backend
// Permite unificar la lógica entre distintos servicios y componentes.
// Prioridad de resolución:
// 1. Variables de entorno VITE_BACKEND_BASE o VITE_BACKEND_BASE_URL
// 2. Entorno local de desarrollo (Vite en :5173 → backend :4004)
// 3. Dominio de producción conocido (Netlify) → backend en Render
// 4. Origen actual como fallback

export function getBackendBase() {
  // 1. Variables de entorno definidas en tiempo de build
  const envBase = import.meta.env.VITE_BACKEND_BASE || import.meta.env.VITE_BACKEND_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/$/, ''); // quitar barra final
  }

  // 2. Desarrollo local con Vite (frontend :5173)
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location;

    if (origin.includes(':5173')) {
      return origin.replace(':5173', ':4004');
    }

    // 3. Producción Netlify → backend en Render (dominio conocido)
    if (hostname.endsWith('mywed360.netlify.app') || hostname.endsWith('mywed360.web.app')) {
      return 'https://mywed360-backend.onrender.com';
    }

    // 4. Fallback al mismo origen
    return origin;
  }

  // Si no estamos en contexto de ventana (SSR), devolver string vacío
  return '';
}
