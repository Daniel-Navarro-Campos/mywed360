import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gestionar roles de colaboradores de una boda.
 * Se ha implementado una versión simplificada que funciona tanto en producción
 * como en entornos de test/mock.  Si en producción se dispone de un backend
 * (Firebase, Supabase, etc.) será muy sencillo sustituir las funciones
 * `fetchRoles`, `addRole` y `deleteRole` por las definitivas.
 *
 * @param {string} weddingId - ID de la boda/carpeta sobre la que gestionar roles.
 * @returns {{ roles: string[], loading: boolean, assignRole: (userId: string, role: string) => Promise<boolean>, removeRole: (userId: string) => Promise<boolean> }}
 */
export default function useRoles(weddingId) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(!!weddingId);

  // --------- API simulada (reemplazar por backend real) ---------
  const fetchRoles = async () => {
    // Simulación: devolvemos lista vacía o almacenada en localStorage
    const key = `lovenda_roles_${weddingId}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  };

  const addRole = async (userId, role) => {
    const key = `lovenda_roles_${weddingId}`;
    const current = await fetchRoles();
    const updated = [...current.filter(r => r.userId !== userId), { userId, role }];
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  };

  const deleteRole = async (userId) => {
    const key = `lovenda_roles_${weddingId}`;
    const current = await fetchRoles();
    const updated = current.filter(r => r.userId !== userId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  };
  // -------------------------------------------------------------

  // Cargar roles cuando cambia weddingId
  useEffect(() => {
    if (!weddingId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const initial = await fetchRoles();
      setRoles(initial);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]);

  // Asignar rol
  const assignRole = useCallback(async (userId, role) => {
    if (!weddingId) return false;
    await addRole(userId, role);
    setRoles(prev => [...prev.filter(r => r.userId !== userId), { userId, role }]);
    return true;
  }, [weddingId]);

  // Eliminar rol
  const removeRole = useCallback(async (userId) => {
    if (!weddingId) return false;
    await deleteRole(userId);
    setRoles(prev => prev.filter(r => r.userId !== userId));
    return true;
  }, [weddingId]);

  return { roles, loading, assignRole, removeRole };
}
