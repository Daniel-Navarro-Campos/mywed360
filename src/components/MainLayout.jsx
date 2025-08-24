import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from '../hooks/useAuthUnified'; // Nuevo sistema
import Nav from './Nav';
import ChatWidget from './ChatWidget';
import DefaultAvatar from './DefaultAvatar';
import GlobalSearch from './GlobalSearch';
import DarkModeToggle from './DarkModeToggle';
import OnboardingTutorial from './Onboarding/OnboardingTutorial';
import { useOnboarding } from '../hooks/useOnboarding';
import RoleBadge from './RoleBadge';
import WeddingProvider from '../context/WeddingContext';
import WeddingSelector from './WeddingSelector';
import { useLocation } from 'react-router-dom';


export default function MainLayout() {
  // Sistema legacy (mantener durante migración)
  const { logoUrl, logout } = useUserContext();
  
  // Nuevo sistema unificado
  const { hasRole, userProfile, isLoading } = useAuth();
  
  // Usar el nuevo sistema para verificaciones de rol
  const role = userProfile?.role || 'particular';
  const [openMenu, setOpenMenu] = useState(false);
  const location = useLocation();
  const hideSelectorRoutes = ['/home', '/tasks'];
  const hideSelector = hideSelectorRoutes.some(r => location.pathname.startsWith(r)) || location.pathname === '/bodas';
  const isPlanner = userProfile && hasRole ? hasRole('planner') : false;
  const showWeddingSelector = isPlanner && !hideSelector;
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Mostrar loading mientras se inicializa la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <WeddingProvider>
        <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
          <OnboardingTutorial onComplete={completeOnboarding} />
        </div>
      </WeddingProvider>
    );
  }
  return (
    <WeddingProvider>
      <div className="relative min-h-screen flex flex-col bg-[var(--color-bg)] text-[color:var(--color-text)] font-sans">
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-4">
          {(import.meta.env.PROD || import.meta.env.VITE_SHOW_ROLE_BADGE === 'true') && <RoleBadge /> }
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          {/* Avatar y menú de usuario */}
          <div className="relative">
            <DefaultAvatar onClick={() => setOpenMenu(!openMenu)} className="w-8 h-8 text-gray-800 cursor-pointer" />
            {openMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 space-y-1 min-w-[180px]">
                <Link to="/perfil" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Perfil</Link>
                <Link to="/notificaciones" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Notificaciones</Link>
                <Link to="/user/email" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Buzón de Emails</Link>
                <div className="px-2 py-1 hover:bg-gray-100 rounded">
                  <DarkModeToggle className="w-full text-left" />
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <button onClick={logout} className="w-full text-left px-2 py-1 hover:bg-gray-100 text-red-600">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      
      <main className="container flex-grow mx-auto px-4 pt-8 pb-36">
        {showWeddingSelector && <WeddingSelector />}
        <Outlet />
      </main>
      <Nav />
        <ChatWidget />
    </div>
  </WeddingProvider>
  );
}
