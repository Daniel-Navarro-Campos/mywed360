// Archivo de compatibilidad para permitir importar useAuth y AuthProvider
// desde "context/AuthContext" tal como lo requieren algunos tests y
// componentes heredados. Reexporta las implementaciones reales definidas en
// hooks/useAuth.jsx sin duplicar lógica.

export { AuthProvider, useAuth } from '../hooks/useAuth';
// Exportación por defecto para facilitar mocks: { default: { useAuth } }
export { useAuth as default } from '../hooks/useAuth';
