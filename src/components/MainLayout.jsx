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

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenu && !event.target.closest('[data-user-menu]')) {
        setOpenMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

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
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-4">
          {(import.meta.env.PROD || import.meta.env.VITE_SHOW_ROLE_BADGE === 'true') && <RoleBadge /> }
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          {/* Avatar y menú de usuario */}
          <div className="relative" data-user-menu>
            <div 
              onClick={() => setOpenMenu(!openMenu)} 
              className={`w-10 h-10 rounded-full cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-300 ${
                openMenu ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-100 hover:bg-gray-200'
              } flex items-center justify-center`}
              title="Menú de usuario"
            >
              <DefaultAvatar className="w-6 h-6 text-gray-600" />
            </div>
            {openMenu && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 space-y-1 min-w-[200px] z-50">
                <Link 
                  to="/perfil" 
                  onClick={() => setOpenMenu(false)} 
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  👤 Perfil
                </Link>
                <Link 
                  to="/notificaciones" 
                  onClick={() => setOpenMenu(false)} 
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  🔔 Notificaciones
                </Link>
                <Link 
                  to="/email" 
                  onClick={() => setOpenMenu(false)} 
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  📧 Buzón de Emails
                </Link>
                <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">🌙 Modo oscuro</span>
                    <DarkModeToggle className="ml-2" />
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <button 
                  onClick={() => { logout(); setOpenMenu(false); }} 
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md transition-colors flex items-center"
                >
                  🚪 Cerrar sesión
                </button>
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
