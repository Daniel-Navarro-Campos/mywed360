import { useEffect, useState } from 'react';

/**
 * Hook para gestionar modo oscuro.
 * Usa localStorage para recordar la preferencia y aplica
 * la clase `dark` en <html>.
 */
export default function useDarkMode() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('lovenda-dark');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (enabled) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lovenda-dark', JSON.stringify(enabled));
  }, [enabled]);

  const toggle = () => setEnabled(prev => !prev);

  return [enabled, toggle];
}
