import React from 'react';

import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/home', label: 'Inicio' },
  { path: '/tasks', label: 'Tareas' },
  { path: '/finance', label: 'Finanzas' },
  { path: '/more', label: 'Más' },
];

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav className='fixed bottom-0 w-full bg-[var(--color-primary)] text-[color:var(--color-text)] shadow-md flex justify-around p-3 z-50'>
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

    </nav>
  );
}
