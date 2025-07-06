// Email service – interacts with backend API (Express + Firestore)
// Email: { id, from, to, subject, body, date, folder, read }

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

export async function getMails(folder = 'inbox') {
  const res = await fetch(`${BASE}/api/mail?folder=${encodeURIComponent(folder)}`);
  if (!res.ok) throw new Error('Error fetching mails');
  return res.json();
}

export async function sendMail({ to, subject, body }) {
  const res = await fetch(`${BASE}/api/mail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body }),
  });
  if (!res.ok) throw new Error('Error sending mail');
  return res.json();
}

export async function markAsRead(id) {
  const res = await fetch(`${BASE}/api/mail/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Error marking mail as read');
  return res.json();
}

export async function deleteMail(id) {
  const res = await fetch(`${BASE}/api/mail/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting mail');
}
