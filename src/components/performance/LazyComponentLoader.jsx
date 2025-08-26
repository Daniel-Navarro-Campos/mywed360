import React, { lazy, Suspense } from 'react';
import Loader from '../ui/Loader';

/**
 * Wrapper para carga perezosa de componentes con fallback personalizable
 * Mejora el rendimiento dividiendo el bundle en chunks más pequeños
 */
const LazyComponentLoader = ({ 
  importFunction, 
  fallback = <Loader />, 
  errorFallback = <div className="p-4 text-center text-red-500">Error cargando componente</div>,
  ...props 
}) => {
  // Crear componente lazy con manejo de errores
  const LazyComponent = lazy(() => 
    importFunction().catch(error => {
      console.error('Error cargando componente lazy:', error);
      return { default: () => errorFallback };
    })
  );

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// HOC para crear componentes lazy fácilmente
export const createLazyComponent = (importFunction, options = {}) => {
  const { 
    fallback = <Loader />, 
    errorFallback = <div className="p-4 text-center text-red-500">Error cargando componente</div> 
  } = options;

  return (props) => (
    <LazyComponentLoader
      importFunction={importFunction}
      fallback={fallback}
      errorFallback={errorFallback}
      {...props}
    />
  );
};

// Componentes lazy pre-configurados para páginas pesadas
export const LazyTasks = createLazyComponent(() => import('../../pages/Tasks'));
export const LazyFinance = createLazyComponent(() => import('../../pages/Finance'));
export const LazyGestionProveedores = createLazyComponent(() => import('../../pages/GestionProveedores'));
export const LazySeatingPlan = createLazyComponent(() => import('../../pages/SeatingPlan'));
export const LazyInvitationDesigner = createLazyComponent(() => import('../../pages/InvitationDesigner'));
export const LazyChecklist = createLazyComponent(() => import('../../pages/Checklist'));

// Componentes lazy para módulos de email
export const LazyEmailInbox = createLazyComponent(() => import('../../pages/user/EmailInbox'));
export const LazyMailboxPage = createLazyComponent(() => import('../../pages/MailboxPage'));
export const LazyEmailStatistics = createLazyComponent(() => import('../../pages/user/EmailStatistics'));

// Componentes lazy para administración
export const LazyAdminDashboard = createLazyComponent(() => import('../../components/admin/AdminDashboard'));
export const LazyUserManagement = createLazyComponent(() => import('../../components/admin/UserManagement'));
export const LazyMetricsDashboard = createLazyComponent(() => import('../../components/admin/MetricsDashboard'));

export default LazyComponentLoader;
