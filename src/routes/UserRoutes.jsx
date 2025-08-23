import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from '../components/ui/Loader';

// Páginas de usuario
import EmailInbox from '../pages/user/EmailInbox';
import EmailStatistics from '../pages/user/EmailStatistics';
import Proveedores from '../pages/Proveedores';
import EmailSetup from '../pages/EmailSetup';
import MailgunTester from '../components/email/MailgunTester';

// Carga perezosa (lazy loading) de componentes para mejor rendimiento
const EmailInboxLazy = lazy(() => import('../pages/user/EmailInbox'));
const EmailSetupLazy = lazy(() => import('../pages/EmailSetup'));

// Componente para mostrar durante la carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader className="w-10 h-10" />
    <span className="ml-3 text-lg">Cargando...</span>
  </div>
);

/**
 * Rutas para la sección de usuario
 * Requiere autenticación
 */
const UserRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
        <Route path="/email" element={<EmailInbox />} />
        {/** Alias para compatibilidad con enlaces antiguos */}
        <Route path="/email/inbox" element={<EmailInbox />} />
        <Route path="/email/stats" element={<EmailStatistics />} />
        <Route path="/email/setup" element={<EmailSetup />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/email/test" element={<MailgunTester />} />
        <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default UserRoutes;
