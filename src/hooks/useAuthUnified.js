// Wrapper de compatibilidad: reexporta las utilidades de autenticación unificadas.
// Permite mantener imports existentes de './hooks/useAuthUnified' tras la refactorización.

export { useAuth, AuthProvider } from './useAuth.jsx';

// Exportación por defecto opcional para evitar fallos en imports default
import { useAuth as defaultExport } from './useAuth.jsx';
export default defaultExport;
