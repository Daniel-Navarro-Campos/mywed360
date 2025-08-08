// Llama a backend Express local (mismo host) que integra Tink/Nordigen
const BASE = '/api';

export async function createBankLink() {
  const res = await fetch(`${BASE}/bank/create-link`);
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
  const res = await fetch(`${BASE}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error('Error fetching transactions');
  return res.json();
}
