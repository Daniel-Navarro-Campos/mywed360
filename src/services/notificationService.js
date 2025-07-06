// Notifications service – interacts with backend API (Express + Firestore)
// Notification: { id, type, message, date, read }

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3001';

export async function getNotifications() {
  const res = await fetch(`${BASE}/api/notifications`);
  if (!res.ok) throw new Error('Error fetching notifications');
  return res.json();
}

export async function addNotification({ type = 'info', message }) {
  const res = await fetch(`${BASE}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, message }),
  });
  if (!res.ok) throw new Error('Error adding notification');
  const notif = await res.json();
  window.dispatchEvent(new CustomEvent('lovenda-notif', { detail: { id: notif.id } }));
  return notif;
}

export async function markNotificationRead(id) {
  const res = await fetch(`${BASE}/api/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Error marking notification as read');
  return res.json();
}

export async function deleteNotification(id) {
  const res = await fetch(`${BASE}/api/notifications/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting notification');
}
