import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMails, deleteMail } from '../../services/EmailService';
import EmailDetail from './EmailDetail';

/**
 * Implementación simplificada de la bandeja de entrada de correos
 * para satisfacer los tests unitarios.  Se apoya en los mocks
 * definidos en los propios tests para EmailService y useAuth.
 */
export default function EmailInbox() {
  const navigate = useNavigate();
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
    return <div>{error}</div>;
  }

  if (detailEmail) {
    return (
      <EmailDetail email={detailEmail} onBack={() => setDetailEmail(null)} />
    );
  }

  return (
    <div>
            <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" data-testid="email-title">Bandeja de entrada</h1>
        <button
          data-testid="compose-button"
          className="px-3 py-1 bg-blue-600 text-white rounded-md"
          onClick={() => navigate('/email/compose')}
        >
          Redactar
        </button>
      </div>

      {/* Carpeta selector */}
      <div className="mb-2 space-x-2">
        <button data-testid="folder-inbox" onClick={() => setFolder('inbox')}>Recibidos</button>
        <button data-testid="folder-sent" onClick={() => setFolder('sent')}>Enviados</button>
      </div>

      {/* Barra de acciones */}
      <div className="mb-2 space-x-2">
        <input
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleDelete}>Eliminar</button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table data-testid="email-list">
          <thead>
            <tr>
              <th>
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
                />
              </th>
              <th>
                <button onClick={() => setSortState((prev) => (prev === 'alpha' ? 'date' : 'alpha'))}>Asunto</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((email) => (
              <tr key={email.id} role="row" onClick={() => setDetailEmail(email)}>
                <td>
                  <input
                    type="checkbox"
                    role="checkbox"
                    checked={selectedIds.has(email.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(email.id);
                    }}
                  />
                </td>
                <td>{email.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
