// Llama a backend Express local (mismo host) que integra Tink/Nordigen
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4004';
const BASE = `${BACKEND}/api`;

export async function createBankLink() {
  const res = await fetch(`${BASE}/bank/create-link`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error generando enlace bancario');
  const { link } = await res.json();
  return link;
}

// Obtener transacciones consolidadas desde backend
export async function getTransactions({ bankId, from, to } = {}) {
  const params = new URLSearchParams();
  if (bankId) params.append('bankId', bankId);
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  const res = await fetch(`${BASE}/bank/transactions?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Error fetching transactions');
  return res.json();
}
