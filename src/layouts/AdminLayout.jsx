import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Zap,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

/**
 * Layout principal para la sección de administración
 * Incluye menú lateral, cabecera y área de contenido
 */
const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Enlaces del menú de administración
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutGrid className="w-5 h-5" />,
      path: '/admin/dashboard'
    },
    {
      title: 'Usuarios',
      icon: <Users className="w-5 h-5" />,
      path: '/admin/users'
    },
    {
      title: 'Sistema de emails',
      icon: <Mail className="w-5 h-5" />,
      path: '/admin/emails'
    },
    {
      title: 'Rendimiento de caché',
      icon: <Zap className="w-5 h-5" />,
      path: '/admin/cache'
    },
    {
      title: 'Configuración',
      icon: <Settings className="w-5 h-5" />,
      path: '/admin/settings'
    }
  ];
  
  // Verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Alternar estado de colapso del menú lateral
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Menú lateral */}
      <aside 
        className={`bg-white shadow-md transition-all duration-300 flex flex-col ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo y nombre */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b`}>
          <Link to="/admin" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Lovenda" 
              className="h-10 w-10"
            />
            {!collapsed && <span className="ml-3 text-xl font-medium">Admin</span>}
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar}
            className={collapsed ? 'hidden' : ''}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Botón para expandir en modo colapsado */}
        {collapsed && (
          <Button 
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="mx-auto my-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        
        {/* Enlaces de navegación */}
        <nav className="flex-grow py-6">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Perfil y cerrar sesión */}
        <div className={`mt-auto p-4 border-t ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && (
            <div className="mb-4">
              <p className="text-sm font-medium">{user?.name || 'Administrador'}</p>
              <p className="text-xs text-gray-500">{user?.email || ''}</p>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className={`${collapsed ? 'w-10 h-10 p-0 flex items-center justify-center' : 'w-full'}`}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        </div>
      </aside>
      
      {/* Área de contenido principal */}
      <main className="flex-grow overflow-auto">
        {/* Cabecera */}
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-800">
              Panel de administración
            </h1>
          </div>
        </header>
        
        {/* Contenido */}
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
