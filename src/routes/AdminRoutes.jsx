import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from "../components/ui/Loader";
import AdminLayout from '../layouts/AdminLayout';

// Carga perezosa (lazy loading) de componentes para mejor rendimiento
const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const UserManagement = lazy(() => import('../components/admin/UserManagement'));
const SystemSettings = lazy(() => import('../components/admin/SystemSettings'));
const CachePerformancePanel = lazy(() => import('../components/admin/CachePerformancePanel'));

// Componente para mostrar durante la carga
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader className="w-10 h-10" />
    <span className="ml-3 text-lg">Cargando panel de administración...</span>
  </div>
);

/**
 * Rutas para la sección de administración
 * Requiere autenticación y rol de administrador
 */
const AdminRoutes = () => {
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<SystemSettings />} />
          <Route path="/cache" element={<CachePerformancePanel />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminRoutes;
