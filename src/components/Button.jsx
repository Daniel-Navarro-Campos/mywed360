// Proxy de compatibilidad: reexporta el componente Button desde la ubicación actual (ui/Button)
// Esto evita errores de importación en archivos que aún referencian "../components/Button".

export { default } from './ui/Button';
