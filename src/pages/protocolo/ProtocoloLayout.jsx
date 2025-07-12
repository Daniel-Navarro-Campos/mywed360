import React, { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';

// Definición estática de las pestañas para evitar recreaciones
const tabs = [
  { path: 'momentos-especiales', label: 'Momentos Especiales' },
];

// Componente memoizado para evitar renders innecesarios
const ProtocoloLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Redirigir a la primera pestaña si estamos en la raíz de protocolo */
  useEffect(() => {
    if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
      navigate('/protocolo/momentos-especiales', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Memoizamos la lista de pestañas con sus rutas completas
  const navTabs = useMemo(() => tabs.map(t => ({ ...t, href: `/protocolo/${t.path}` })), []);

  // Placeholder de carga accesible
  if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
    return (
      <div className="p-4 md:p-6" role="status" aria-live="polite">
        Cargando...
      </div>
    );
  };

  return (
    <section className="p-4 md:p-6 flex flex-col gap-8" aria-labelledby="protocolo-heading">
      {/* Título y navegación solo si hay más de una sección */}
      {navTabs.length > 1 && (
        <>
          <h1 id="protocolo-heading" className="text-2xl font-bold text-gray-800">
            {navTabs.find(t => location.pathname.startsWith(t.href))?.label || 'Protocolo'}
          </h1>
          <nav role="tablist" aria-label="Secciones de Protocolo" className="flex overflow-x-auto space-x-2 pb-2">
            {navTabs.map(tab => (
              <NavLink
                key={tab.path}
                to={tab.href}
                role="tab"
                aria-current={location.pathname === tab.href ? 'page' : undefined}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-t-lg font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? 'bg-white border-t-2 border-l-2 border-r-2 border-blue-500 text-blue-600 font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </>

      )}

      {/* Contenido - Ya no envuelto en Card para permitir a cada componente tener sus propios Cards */}
      <div className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" role="region" aria-label="Contenido de Protocolo">
        <Outlet />
      </div>

      {/* Ruta actual solo visible para accesibilidad */}
      <p className="sr-only" data-testid="current-path">
        Ruta actual: {location.pathname}
      </p>
    </section>
  );
});

export default ProtocoloLayout;
