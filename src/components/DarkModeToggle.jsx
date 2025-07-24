import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useDarkMode from '../hooks/useDarkMode';

/**
 * Pequeño botón para alternar modo claro / oscuro.
 * Muestra ícono de sol o luna según el estado actual.
 */
export default function DarkModeToggle({ className = '' }) {
  const [enabled, toggle] = useDarkMode();

  return (
    <button
      aria-label={enabled ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
      title={enabled ? 'Modo claro' : 'Modo oscuro'}
      onClick={toggle}
      className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      {enabled ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-800" />}
    </button>
  );
}
