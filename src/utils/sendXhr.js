// Envia una petición GET vía XMLHttpRequest para que Cypress pueda interceptarla
export default function sendXhr(url) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
  } catch (_) {
    /* ignorar */
  }
}
