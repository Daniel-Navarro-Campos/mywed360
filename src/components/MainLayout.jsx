import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import Nav from './Nav';
import ChatWidget from './ChatWidget';
import DefaultAvatar from './DefaultAvatar';
import GlobalSearch from './GlobalSearch';
import NotificationCenter from './NotificationCenter';
import DarkModeToggle from './DarkModeToggle';
import EmailNotificationBadge from './email/EmailNotificationBadge';
import OnboardingTutorial from './Onboarding/OnboardingTutorial';
import { useOnboarding } from '../hooks/useOnboarding';


export default function MainLayout() {
  const { logoUrl, logout } = useUserContext();
  const [openMenu, setOpenMenu] = useState(false);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--color-bg)] text-[color:var(--color-text)] font-sans">
      {/* Tutorial de Onboarding para primeros usuarios */}
      {showOnboarding && <OnboardingTutorial onComplete={completeOnboarding} />}
      
        
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-4">
          {/* Componente de Búsqueda Global */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          
          {/* Centro de Notificaciones */}
          <NotificationCenter />
          
          {/* Toggle modo oscuro */}
          <DarkModeToggle />
          
          {/* Notificaciones de correo */}
          <EmailNotificationBadge />
          
          {/* Avatar y menú de usuario */}
          <div className="relative">
            <DefaultAvatar onClick={() => setOpenMenu(!openMenu)} className="w-8 h-8 text-gray-800 cursor-pointer" />
            {openMenu && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 space-y-1 min-w-[180px]">
                <Link to="/perfil" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Perfil</Link>
                <Link to="/notificaciones" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Notificaciones</Link>
                <Link to="/user/email" onClick={() => setOpenMenu(false)} className="block px-2 py-1 hover:bg-gray-100">Buzón de Emails</Link>
                <div className="border-t border-gray-200 my-1"></div>
                <button onClick={logout} className="w-full text-left px-2 py-1 hover:bg-gray-100 text-red-600">Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
        
        {/* Versión móvil de búsqueda global */}
        <div className="block md:hidden fixed bottom-20 left-0 right-0 px-4 z-20">
          <div className="bg-white rounded-full shadow-lg p-2">
            <GlobalSearch />
          </div>
        </div>
      
      <main className="container flex-grow mx-auto px-4 pt-8 pb-36">
        <Outlet />
      </main>
      <Nav />
        <ChatWidget />
    </div>
  );
}
