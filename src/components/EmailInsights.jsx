import { useEffect, useState, useRef } from 'react';

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:4004';

export default function EmailInsights({ mailId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  // Para evitar despachar varias veces la misma reunión
  const dispatchedRef = useRef(false);

  useEffect(() => {
    if (!mailId) return;
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE}/api/email-insights/${mailId}`);
        const json = await res.json();
        if (!ignore) setInsights(json);
      } catch (err) {
        console.error('Error obteniendo insights:', err);
        if (!ignore) setInsights(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [mailId]);

  // Despachar reuniones solo una vez cuando se reciban
  useEffect(() => {
  if (!insights || dispatchedRef.current) return;
  if (insights.meetings && insights.meetings.length > 0) {
    insights.meetings.forEach(m => {
      try {
        const start = m.start || m.date || m.when;
        if (!start) return;
        const startDate = new Date(start);
        if (isNaN(startDate.getTime())) return;
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        const meeting = {
          title: m.title || 'Reunión',
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        window.dispatchEvent(new CustomEvent('lovenda-tasks', { detail: { meeting } }));
      } catch (err) {
        console.warn('No se pudo despachar reunión:', err);
      }
    });
  }
  dispatchedRef.current = true;
}, [insights]);

  if (!mailId) return null;
  if (loading) return <p className="text-sm text-gray-500">Cargando IA…</p>;
  if (!insights || Object.keys(insights).length === 0)
    return <p className="text-sm text-gray-500">Sin acciones detectadas.</p>;

  const { tasks = [], meetings = [], budgets = [], contracts = [] } = insights;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-sm font-semibold mb-2">Acciones sugeridas por IA</h3>

      {tasks.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Tareas</h4>
          <ul className="list-disc list-inside text-sm">
            {tasks.map((t, i) => (
              <li key={i}>{t.title} {t.due && `(para ${t.due})`}</li>
            ))}
          </ul>
        </section>
      )}

      {meetings.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Reuniones</h4>
          <ul className="list-disc list-inside text-sm">
            {meetings.map((m, i) => (
              <li key={i}>{m.title} — {m.date}</li>
            ))}
          </ul>
        </section>
      )}

      {budgets.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Presupuestos</h4>
          <ul className="list-disc list-inside text-sm">
            {budgets.map((b, i) => (
              <li key={i}>{b.client}: {b.amount} {b.currency || 'EUR'}</li>
            ))}
          </ul>
        </section>
      )}

      {contracts.length > 0 && (
        <section className="mb-3">
          <h4 className="font-medium">Contratos</h4>
          <ul className="list-disc list-inside text-sm">
            {contracts.map((c, i) => (
              <li key={i}>{c.party} — {c.type} ({c.action})</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
