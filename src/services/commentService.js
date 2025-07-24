/**
 * Servicio de comentarios internos por correo.
 * Permite colaborar con otros usuarios del equipo sin enviar mensajes al proveedor.
 * Actualmente usa localStorage; en despliegues con backend, estas funciones
 * deberían delegarse a la API.
 */

const COMMENTS_KEY_PREFIX = 'lovenda_email_comments_';

function getStorageKey(userId) {
  return `${COMMENTS_KEY_PREFIX}${userId}`;
}

function loadAllComments(userId) {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error leyendo comentarios de localStorage', e);
    return {};
  }
}

function saveAllComments(userId, mapping) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(mapping));
  } catch (e) {
    console.error('Error guardando comentarios de localStorage', e);
  }
}

/**
 * Obtiene los comentarios asociados a un correo.
 * @param {string} userId
 * @param {string} emailId
 * @returns {Array} lista de comentarios
 */
export function getComments(userId, emailId) {
  const mapping = loadAllComments(userId);
  return mapping[emailId] || [];
}

/**
 * Añade un comentario a un correo.
 * @param {string} userId
 * @param {string} emailId
 * @param {Object} comment { authorId, authorName, body }
 * @returns {Array} lista actualizada de comentarios para el correo
 */
export function addComment(userId, emailId, comment) {
  const mapping = loadAllComments(userId);
  if (!mapping[emailId]) mapping[emailId] = [];
  const newComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...comment,
    date: new Date().toISOString()
  };
  mapping[emailId].push(newComment);
  saveAllComments(userId, mapping);
  return mapping[emailId];
}

/**
 * Elimina un comentario.
 * @param {string} userId
 * @param {string} emailId
 * @param {string} commentId
 * @returns {Array} comentarios restantes
 */
export function deleteComment(userId, emailId, commentId) {
  const mapping = loadAllComments(userId);
  if (!mapping[emailId]) return [];
  mapping[emailId] = mapping[emailId].filter(c => c.id !== commentId);
  saveAllComments(userId, mapping);
  return mapping[emailId];
}
