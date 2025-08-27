import React, { useEffect, useState } from 'react';
import { getMails, deleteMail } from '../../services/EmailService';
import EmailDetail from './EmailDetail';
import { safeRender, ensureNotPromise, safeMap } from '../../utils/promiseSafeRenderer';
import { useAuth } from '../../hooks/useAuth';

/**
 * Bandeja de entrada de correos - Diseño original mejorado
 * Mantiene la simplicidad pero con mejor estilo visual
 */
export default function EmailInbox() {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('inbox');
  const [sortState, setSortState] = useState('none'); // none | alpha | date
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailEmail, setDetailEmail] = useState(null);

  // Cargar correos
  const loadEmails = async (targetFolder = folder) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMails(targetFolder);
      setEmails(data || []);
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar los emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  // Utilidades
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    for (const id of selectedIds) {
      await deleteMail(id);
    }
    setSelectedIds(new Set());
    await loadEmails();
  };

  const displayed = [...emails]
    .filter((e) => e.subject.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortState === 'alpha') {
        return a.subject.localeCompare(b.subject, 'es');
      }
      if (sortState === 'date') {
        return new Date(a.date) - new Date(b.date);
      }
      return 0; // sin ordenar
    });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => loadEmails()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (detailEmail) {
    return (
      <EmailDetail email={detailEmail} onBack={() => setDetailEmail(null)} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con información del usuario */}
      {user?.email && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            📧 Usuario: <span className="font-medium">{user.email}</span> | 
            📊 {displayed.length} emails en {folder === 'inbox' ? 'Recibidos' : 'Enviados'}
          </p>
        </div>
      )}

      {/* Controles principales */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Selector de carpeta */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            onClick={() => setFolder('inbox')}
            className={`px-4 py-2 rounded-md transition-colors ${
              folder === 'inbox' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📥 Recibidos
          </button>
          <button 
            onClick={() => setFolder('sent')}
            className={`px-4 py-2 rounded-md transition-colors ${
              folder === 'sent' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📤 Enviados
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Botón eliminar */}
        <button 
          onClick={handleDelete}
          disabled={selectedIds.size === 0}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedIds.size > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          🗑️ Eliminar ({selectedIds.size})
        </button>
      </div>

      {/* Lista de emails */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando emails...</p>
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📭</div>
          <p className="text-gray-600">No hay emails {search ? 'que coincidan con tu búsqueda' : 'en esta carpeta'}</p>
        </div>
      ) : (
        <div data-testid="email-list" className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={selectedIds.size === emails.length && emails.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(emails.map((m) => m.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button 
                    onClick={() => setSortState((prev) => (prev === 'alpha' ? 'date' : 'alpha'))}
                    className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <span>Asunto</span>
                    <span className="text-xs">
                      {sortState === 'alpha' ? '🔤' : sortState === 'date' ? '📅' : '↕️'}
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">De</th>
                <th className="px-4 py-3 text-left text-gray-700 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {safeMap(displayed).map((email) => (
                <tr 
                  key={safeRender(email.id, '')} 
                  role="row" 
                  onClick={() => setDetailEmail(email)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      role="checkbox"
                      checked={selectedIds.has(safeRender(email.id, ''))}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(safeRender(email.id, ''));
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {safeRender(email.subject, '(Sin asunto)')}
                    </div>
                    {email.body && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {safeRender(email.body.substring(0, 100), '')}...
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {safeRender(email.from, 'Desconocido')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {email.date ? new Date(email.date).toLocaleDateString('es-ES') : 'Sin fecha'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
