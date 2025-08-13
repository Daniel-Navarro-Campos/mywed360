// Envia una petición GET vía XMLHttpRequest para que Cypress pueda interceptarla
export default function sendXhr(url) {
  try {
    // Usar XMLHttpRequest para garantizar intercept en Cypress
    const xhr = new XMLHttpRequest();
    // Evitar enviar cookies y credenciales para que Cypress lo trate como petición limpia
    xhr.withCredentials = false;
    xhr.open('GET', url, true);
    // Cabeceras personalizadas para bust-cache y diferenciar la petición
    const stamp = Date.now().toString();
    xhr.setRequestHeader('X-Force-Refresh', stamp);
    xhr.setRequestHeader('x-cypress-cache-bust', stamp);
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('Pragma', 'no-cache');
    // Pequeño delay para que los intercepts "updated" de Cypress se registren antes
    setTimeout(() => {
      try { xhr.send(); } catch (_) {/* ignorar */}
    }, 50);
      
      




    
    
    
  } catch (_) {
    /* ignorar */
  }
}
