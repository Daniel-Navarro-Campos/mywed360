import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserProvider from './context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from './hooks/useAuthUnified';
import { AuthProvider } from './hooks/useAuth'; // Importamos el AuthProvider legacy
import AuthMigrationWrapper from './components/auth/AuthMigrationWrapper'; // Nuevo sistema de autenticación
import MainLayout from './components/MainLayout';
import EmailNotification from './components/EmailNotification';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Bodas from './pages/Bodas';
import BodaDetalle from './pages/BodaDetalle';
import Finance from './pages/Finance';
import More from './pages/More';
import Invitados from './pages/Invitados';
import Proveedores from './pages/Proveedores';
import UnifiedEmail from './pages/UnifiedEmail';
import MailboxPage from './pages/MailboxPage';
import EmailAdminDashboard from './components/admin/EmailAdminDashboard';
import MetricsDashboard from './components/metrics/MetricsDashboard';
import AdminRoutes from './routes/AdminRoutes';
import UserRoutes from './routes/UserRoutes';

import Perfil from './pages/Perfil';
import SeatingPlanRefactored from './components/seating/SeatingPlanRefactored';
import Invitaciones from './pages/Invitaciones';
import Contratos from './pages/Contratos';

import ProtocoloLayout from './pages/protocolo/ProtocoloLayout';
import MomentosEspeciales from './pages/protocolo/MomentosEspeciales';
import Timing from './pages/protocolo/Timing';
import Checklist from './pages/protocolo/Checklist';
import AyudaCeremonia from './pages/protocolo/AyudaCeremonia';
import DisenoWeb from './pages/DisenoWeb';
import WebEditor from './pages/WebEditor';
import DisenosLayout from './pages/disenos/DisenosLayout';
import DisenosInvitaciones from './pages/disenos/Invitaciones';
import DisenosLogo from './pages/disenos/Logo';
import MenuDiseno from './pages/disenos/Menu';
import SeatingPlanPost from './pages/disenos/SeatingPlanPost';
import MenuCatering from './pages/disenos/MenuCatering';
import PapelesNombres from './pages/disenos/PapelesNombres';
import Ideas from './pages/Ideas';
import Inspiration from './pages/Inspiration';
import Blog from './pages/Blog';
import DevSeedGuests from './pages/DevSeedGuests';
import DevEnsureFinance from './pages/DevEnsureFinance';

import Notificaciones from './pages/Notificaciones';
import WeddingSite from './pages/WeddingSite';
import RSVPConfirm from './pages/RSVPConfirm';
import AcceptInvitation from './pages/AcceptInvitation';

// Importar configuración de i18n
import './i18n';

// Importar sistema de diagnóstico
import DiagnosticPanel from './components/DiagnosticPanel';
import errorLogger from './utils/errorLogger';
import './utils/consoleCommands';

function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirige de forma imperativa una vez que el auth state está determinado
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (location.pathname !== '/login' && location.pathname !== '/') {
        navigate('/login', { replace: true, state: { from: location } });
      }
    }
  }, [isLoading, isAuthenticated, location, navigate]);

  if (isLoading) {
    return null; // spinner opcional
  }
  if (!isAuthenticated) {
    return null; // Evita renderizar contenido protegido hasta que se redirija
  }

  return (
    <>
      <Outlet />
      <EmailNotification />
    </>
  );
}


function App() {
  const enableDev = (import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true') || (import.meta.env.MODE !== 'production');
  
  // Inicializar sistema de diagnóstico
  React.useEffect(() => {
    console.log('🚀 MyWed360 iniciando...');
    console.log('🔍 Sistema de diagnóstico activado');
    console.log('💡 Usa window.errorLogger para acceder al sistema de errores');
    
    // Log de información del entorno
    console.group('🌍 Información del Entorno');
    console.log('Modo:', import.meta.env.MODE);
    console.log('Desarrollo:', import.meta.env.DEV);
    console.log('Backend URL:', import.meta.env.VITE_BACKEND_BASE_URL);
    console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
    console.groupEnd();
  }, []);
  return (
    <AuthMigrationWrapper>
      <UserProvider>
        <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Componente de notificaciones de correo - solo visible en rutas protegidas */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          {/* Herramientas de desarrollo accesibles sin protección (sólo si está activado por env) */}
          {enableDev && <Route path="dev/seed-guests" element={<DevSeedGuests />} />}
          {enableDev && <Route path="dev/ensure-finance" element={<DevEnsureFinance />} />}
          {/* Web pública de cada boda */}
          <Route path="w/:uid" element={<WeddingSite />} />
          <Route path="invitation/:code" element={<AcceptInvitation />} />
          <Route path="rsvp/:token" element={<RSVPConfirm />} />
            <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="home" element={<Home />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="bodas" element={<Bodas />} />
              <Route path="bodas/:id" element={<BodaDetalle />} />
              <Route path="finance" element={<Finance />} />
              <Route path="invitados" element={<Invitados />} />
              <Route path="invitados/seating" element={<SeatingPlanRefactored />} />
              <Route path="invitados/invitaciones" element={<Invitaciones />} />
              <Route path="proveedores" element={<Proveedores />} />
              <Route path="proveedores/contratos" element={<Contratos />} />

              {/* Rutas de Protocolo */}
              <Route path="protocolo" element={<ProtocoloLayout />}>
                <Route index element={<Navigate to="momentos-especiales" replace />} />
                <Route path="momentos-especiales" element={<MomentosEspeciales />} />
                <Route path="timing" element={<Timing />} />
                <Route path="checklist" element={<Checklist />} />
                <Route path="ayuda-ceremonia" element={<AyudaCeremonia />} />
              </Route>
              <Route path="perfil" element={<Perfil />} />
               <Route path="notificaciones" element={<Notificaciones />} />
                
               <Route path="diseno-web" element={<DisenoWeb />} />
              <Route path="web" element={<WebEditor />} />
               <Route path="ideas" element={<Ideas />} />
              <Route path="inspiracion" element={<Inspiration />} />
              <Route path="blog" element={<Blog />} />

               {/* Panel de administración con monitoreo de caché */}
               <Route path="admin/*" element={<AdminRoutes />} />
               <Route path="email-admin" element={<EmailAdminDashboard />} />

               {/* Herramientas de desarrollo (duplicado dentro del layout, sólo si está activado por env) */}
               {enableDev && <Route path="dev/seed-guests" element={<DevSeedGuests />} />}
               {enableDev && <Route path="dev/ensure-finance" element={<DevEnsureFinance />} />}

               {/* Rutas Diseños */}
               <Route path="disenos" element={<DisenosLayout />}>
                 <Route index element={<Navigate to="invitaciones" replace />} />
                 <Route path="invitaciones" element={<DisenosInvitaciones />} />
                 <Route path="logo" element={<DisenosLogo />} />
                 <Route path="menu" element={<MenuDiseno />} />
                 <Route path="seating-plan" element={<SeatingPlanPost />} />
                 <Route path="menu-catering" element={<MenuCatering />} />
                 <Route path="papeles-nombres" element={<PapelesNombres />} />
               </Route>
              <Route path="more" element={<More />} />
              
              {/* Bandeja unificada de emails */}
              <Route path="email" element={<UnifiedEmail />} />
              <Route path="email/inbox" element={<UnifiedEmail />} />
              <Route path="buzon" element={<MailboxPage />} />
              
              {/* Rutas de usuario */}
              <Route path="user/*" element={<UserRoutes />} />
              
              {/* Rutas de administración de email */}
              <Route path="admin">
                <Route path="email" element={<EmailAdminDashboard />} />
                <Route path="metrics" element={<MetricsDashboard />} />
              </Route>
  
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Route>
        </Routes>
        {/* Sistema de diagnóstico global */}
        <DiagnosticPanel />
      </BrowserRouter>
        </AuthProvider>
      </UserProvider>
    </AuthMigrationWrapper>
  );
}

export default App;
