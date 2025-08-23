import React, { useEffect, useState } from 'react';
import { useUserContext } from '../context/UserContext'; // Legacy - mantener durante migración
import { useAuth } from '../hooks/useAuthUnified'; // Nuevo sistema

export default function RoleBadge() {
  // Sistema legacy (mantener durante migración)
  const legacyContext = useUserContext();
  
  // Nuevo sistema unificado
  const { hasRole, userProfile } = useAuth();
  
  // Usar el nuevo sistema para verificaciones de rol
  const role = userProfile?.role || legacyContext.role;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000); // Ocultar tras 5 s
    return () => clearTimeout(timer);
  }, []);

  if (!role || !visible) return null;

  const roleLabelMap = {
    owner: 'Pareja',
    planner: 'Wedding Planner',
    assistant: 'Ayudante',
  };

  return (
    <div className="fixed bottom-24 right-4 z-60">
      <div className="bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
        Rol actual: {roleLabelMap[role] || role}
      </div>
    </div>
  );
}
