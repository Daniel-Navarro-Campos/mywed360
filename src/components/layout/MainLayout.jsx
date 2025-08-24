import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Mail, Settings, LogOut, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthUnified';
import EmailNotificationBadge from '../email/EmailNotificationBadge';

/**
 * Layout principal para las páginas de usuario normal
 * Incluye cabecera, navegación y área de contenido
 */
const MainLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabecera */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo y navegación principal */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-blue-600 text-xl font-bold">
                  Lovenda
                </Link>
              </div>
              
              {/* Navegación principal (escritorio) */}
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  to="/proveedores" 
                  className={`${
                    location.pathname.startsWith('/proveedores') 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Proveedores
                </Link>
                <Link 
                  to="/reservas" 
                  className={`${
                    location.pathname.startsWith('/reservas') 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Mis Reservas
                </Link>
                <Link 
                  to="/favoritos" 
                  className={`${
                    location.pathname === '/favoritos' 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Favoritos
                </Link>
              </nav>
            </div>
            
            {/* Iconos y acciones del usuario */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {/* Búsqueda global */}
              <Link to="/search" className="p-1 rounded-full text-gray-500 hover:text-gray-700">
                <Search className="h-6 w-6" />
              </Link>
              
              {/* Notificación de emails */}
              <Link to="/user/email" className="p-1 rounded-full text-gray-500 hover:text-gray-700 relative">
                <Mail className="h-6 w-6" />
                <EmailNotificationBadge />
              </Link>
              
              {/* Menú de usuario */}
              <div className="relative">
                <div className="group relative">
                  <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </span>
                  </button>
                  
                  {/* Dropdown de perfil */}
                  <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500">
                      {user?.email || 'Usuario'}
                    </div>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Mi Perfil
                    </Link>
                    <Link 
                      to="/user/email" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Buzón de Emails
                    </Link>
                    <Link 
                      to="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configuración
                    </Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botón de menú móvil */}
            <div className="flex items-center sm:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/proveedores"
                className={`${
                  location.pathname.startsWith('/proveedores')
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Proveedores
              </Link>
              <Link
                to="/reservas"
                className={`${
                  location.pathname.startsWith('/reservas')
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mis Reservas
              </Link>
              <Link
                to="/favoritos"
                className={`${
                  location.pathname === '/favoritos'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Favoritos
              </Link>
              <Link
                to="/search"
                className={`${
                  location.pathname === '/search'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Búsqueda
              </Link>
              <Link
                to="/user/email"
                className={`${
                  location.pathname.startsWith('/user/email')
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Buzón de Emails
              </Link>
              <Link
                to="/profile"
                className={`${
                  location.pathname === '/profile'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Mi Perfil
              </Link>
              <Link
                to="/settings"
                className={`${
                  location.pathname === '/settings'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Configuración
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="border-transparent text-red-500 hover:bg-gray-50 hover:border-red-300 hover:text-red-700 block w-full text-left pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      
      {/* Pie de página */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Lovenda. Todos los derechos reservados.
            </div>
            <div className="text-sm">
              <Link to="/terms" className="text-gray-500 hover:text-gray-700 mr-4">
                Términos de Servicio
              </Link>
              <Link to="/privacy" className="text-gray-500 hover:text-gray-700">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
