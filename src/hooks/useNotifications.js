import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Hook personalizado para gestionar el sistema de notificaciones
 * Implementa optimizaciones de rendimiento y soporte para grandes volúmenes de datos
 * 
 * @param {Object} options Opciones de configuración
 * @param {Function} options.fetchNotifications Función para obtener notificaciones
 * @param {Function} options.markAsRead Función para marcar notificación como leída
 * @param {Function} options.deleteNotification Función para eliminar notificación
 * @param {number} options.pollingInterval Intervalo en ms para actualización (0 para deshabilitar)
 * @param {number} options.batchSize Tamaño del lote para cargar notificaciones paginadas
 * @returns {Object} Estado y funciones para gestionar notificaciones
 */
export default function useNotifications({
  fetchNotifications,
  markAsRead,
  deleteNotification,
  pollingInterval = 60000, // 1 minuto por defecto
  batchSize = 25
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Cargar notificaciones iniciales
  const loadNotifications = useCallback(async (reset = false) => {
    // Si reset es true, volvemos a la página 1
    const currentPage = reset ? 1 : page;
    
    if (reset) {
      setPage(1);
      setHasMore(true);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedNotifications = await fetchNotifications({
        page: currentPage,
        limit: batchSize,
        filter: activeFilter !== 'all' ? activeFilter : undefined
      });
      
      if (fetchedNotifications.length < batchSize) {
        setHasMore(false);
      }
      
      // Si estamos en la página 1, reemplazamos todo, sino añadimos
      if (currentPage === 1) {
        setNotifications(fetchedNotifications);
      } else {
        setNotifications(prev => [...prev, ...fetchedNotifications]);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications, activeFilter, page, batchSize]);

  // Cargar más notificaciones (paginación)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setPage(prevPage => prevPage + 1);
  }, [loading, hasMore]);

  // Actualizar cuando cambie la página
  useEffect(() => {
    loadNotifications(false);
  }, [page, loadNotifications]);

  // Actualizar cuando cambie el filtro
  useEffect(() => {
    loadNotifications(true);
  }, [activeFilter, loadNotifications]);

  // Polling para notificaciones en tiempo real (si está habilitado)
  useEffect(() => {
    if (!pollingInterval) return;
    
    const intervalId = setInterval(() => {
      // Solo refrescamos la primera página para nuevas notificaciones
      const refreshLatest = async () => {
        try {
          const latestNotifications = await fetchNotifications({
            page: 1,
            limit: batchSize,
            filter: activeFilter !== 'all' ? activeFilter : undefined
          });
          
          // Comparamos IDs para ver si hay nuevas
          const currentIds = new Set(notifications.slice(0, batchSize).map(n => n.id));
          const newNotifications = latestNotifications.filter(n => !currentIds.has(n.id));
          
          if (newNotifications.length > 0) {
            // Añadir nuevas notificaciones al principio
            setNotifications(prev => [...newNotifications, ...prev]);
          }
        } catch (err) {
          console.error('Error en polling de notificaciones:', err);
        }
      };
      
      refreshLatest();
    }, pollingInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchNotifications, activeFilter, batchSize, notifications, pollingInterval]);

  // Marcar una notificación como leída
  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
      return true;
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
      setError('No se pudo actualizar la notificación');
      return false;
    }
  }, [markAsRead]);

  // Marcar todas como leídas
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return true;
      
      // Marcamos todas como leídas en paralelo
      await Promise.all(unreadIds.map(id => markAsRead(id)));
      
      // Actualizamos estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      return true;
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
      setError('No se pudieron actualizar las notificaciones');
      return false;
    }
  }, [notifications, markAsRead]);

  // Eliminar una notificación
  const handleDeleteNotification = useCallback(async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      return true;
    } catch (err) {
      console.error('Error al eliminar notificación:', err);
      setError('No se pudo eliminar la notificación');
      return false;
    }
  }, [deleteNotification]);

  // Estadísticas de notificaciones calculadas con memoización
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {
        email: notifications.filter(n => n.type === 'email').length,
        event: notifications.filter(n => n.type === 'event').length,
        provider: notifications.filter(n => n.type === 'provider').length,
        system: notifications.filter(n => n.type === 'system').length,
      }
    };
  }, [notifications]);

  // Notificaciones filtradas según el tipo activo
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    loading,
    error,
    stats,
    activeFilter,
    hasMore,
    setActiveFilter,
    loadMore,
    refresh: () => loadNotifications(true),
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification
  };
}
