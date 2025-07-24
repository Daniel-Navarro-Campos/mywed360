import DOMPurify from 'dompurify';

/**
 * Sanitiza una cadena HTML para prevenir XSS.
 * @param {string} html - HTML a limpiar
 * @returns {string} HTML seguro
 */
export default function sanitizeHtml(html = '') {
  if (!html) return '';
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
