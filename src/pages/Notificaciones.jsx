import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import { getNotifications, markNotificationRead, deleteNotification } from '../services/notificationService';

const typeColors = {
  success: 'bg-green-100 border-green-400 text-green-800',
  error: 'bg-red-100 border-red-400 text-red-800',
  warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  info: 'bg-blue-100 border-blue-400 text-blue-800',
};

export default function Notificaciones() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);

  const refresh = async () => setItems(await getNotifications());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('lovenda-notif', handler);
    return () => window.removeEventListener('lovenda-notif', handler);
  }, []);

  const filtered = items.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Notificaciones</h1>

      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Sin leer
        </button>
      </div>

      <div className="bg-white border rounded divide-y">
        {filtered.length === 0 && <p className="p-4 text-gray-500">No hay notificaciones.</p>}
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`flex justify-between p-4 text-sm ${typeColors[n.type] || typeColors.info}`}
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <span className="text-xs text-gray-600">
                {new Date(n.date).toLocaleString('es-ES')}
              </span>
            </div>
            <div className="flex gap-2 items-start ml-4">
              {!n.read && (
                <Button variant="outline" onClick={async () => { await markNotificationRead(n.id); await refresh(); }}>
                  Marcar leída
                </Button>
              )}
              <Button variant="outline" className="text-red-600" onClick={async () => { await deleteNotification(n.id); await refresh(); }}>
                Borrar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
