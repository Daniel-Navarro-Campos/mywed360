import React from 'react';

import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

import { useUserContext } from '../context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from '../hooks/useAuthUnified'; // Nuevo sistema
import LanguageSelector from './ui/LanguageSelector';
import useTranslations from '../hooks/useTranslations';

// Devuelve los ítems de navegación según rol
function getNavItems(role, t) {
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
  };
  const rawRole = (role || '').toString().trim().toLowerCase();
  const normalizedRole = roleMap[rawRole] || 'owner';

  switch (normalizedRole) {
    case 'owner':
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/finance', label: t('navigation.finance') },
        { path: '/more', label: 'Más' },
      ];
    case 'planner':
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/bodas', label: 'Bodas' },
        { path: '/more', label: 'Más' },
      ];
    case 'assistant':
      return [
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/protocolo', label: 'Protocolo' },
        { path: '/more', label: 'Más' },
      ];
    default:
      return [
        { path: '/home', label: t('navigation.home') },
        { path: '/tasks', label: t('navigation.tasks') },
        { path: '/more', label: 'Más' },
      ];
  }
}
/*
  // Normalizar nombres de roles provenientes de Firestore
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
  };
  const normalizedRole = roleMap[role] || role;

  if (normalizedRole === 'owner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/finance', label: 'Finanzas' },
      { path: '/more', label: 'Más' },
    ];
  }

  if (normalizedRole === 'planner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: 'Protocolo' },
      { path: '/more', label: 'Más' },
    ];
  }

  if (normalizedRole === 'assistant') {
    return [
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: 'Protocolo' },
      { path: '/more', label: 'Más' },
    ];
  }

  // Fallback (rol no reconocido)
  return [
    { path: '/home', label: 'Inicio' },
    { path: '/tasks', label: 'Tareas' },
    { path: '/more', label: 'Más' },
  ];
  // Normalizar nombres de roles provenientes de Firestore
  const roleMap = {
    'pareja': 'owner',
    'wedding-planner': 'planner',
    'planner': 'planner',
    'ayudante': 'assistant'
  };
  const normalizedRole = roleMap[role] || role;
  const common = [
    { path: '/home', label: 'Inicio' },
    { path: '/tasks', label: 'Tareas' },
    { path: '/protocolo', label: 'Protocolo' },
    { path: '/more', label: 'Más' },
  ];

  if (normalizedRole === 'owner') {
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/finance', label: 'Finanzas' },
      { path: '/more', label: 'Más' },
    ];
  }
  if (normalizedRole === 'planner') {
    // Planner no ve finanzas, pero puede tener otras secciones específicas
    return [
      { path: '/home', label: 'Inicio' },
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: 'Protocolo' },
      { path: '/more', label: 'Más' },
    ];
  }
  if (normalizedRole === 'assistant') {
    // Asistente: solo tareas y protocolo (más se mantiene)
    return [
      { path: '/tasks', label: 'Tareas' },
      { path: '/protocolo', label: 'Protocolo' },
      { path: '/more', label: 'Más' },
    ];

  }
  // Fallback
  return common;
}

*/
function Nav() {
  // Sistema legacy (mantener durante migración)
  const { user } = useUserContext();
  
  // Nuevo sistema unificado
  const { userProfile, hasRole } = useAuth();
  
  // Hook de traducciones
  const { t } = useTranslations();
  
  // Usar el nuevo sistema para el rol, con fallback al legacy
  const role = userProfile?.role || user?.role || 'owner';
  const navItems = React.useMemo(() => getNavItems(role, t), [role, t]);
  

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className='fixed bottom-0 w-full bg-[var(--color-primary)] text-[color:var(--color-text)] shadow-md flex justify-between items-center p-3 z-50'>
      {/* Navegación principal */}
      <div className='flex justify-around flex-1'>
        {navItems.map(({ path, label }, idx) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={idx}
              onClick={() => navigate(path)}
              className='relative'
            >
              <motion.span
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={isActive ? 'text-[var(--color-accent)] font-semibold' : 'text-[color:var(--color-text)]'}
              >
                {label}
              </motion.span>
              {isActive && (
                <motion.span
                  className='absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-[var(--color-accent)] rounded'
                  layoutId='activeUnderline'
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Selector de idioma */}
      <div className='ml-2'>
        <LanguageSelector 
          variant="minimal" 
          className="text-[color:var(--color-text)]" 
        />
      </div>
    </nav>
  );
}

export default Nav;
