/**
 * Servicio para gestionar recordatorios automáticos de seguimiento.
 * Cuando un correo enviado no recibe respuesta después de X días, se envía
 * automáticamente un recordatorio (Re:) al mismo destinatario.
 * 
 * Estrategia:
 *   1. Cada vez que se envía un correo con emailService.sendMail se almacena
 *      { reminderSent: false, reminderAt: ISODate } en el objeto del mail.
 *   2. Este servicio registra un job (setInterval) que se ejecuta cada hora
 *      (configurable). Recorre la carpeta "sent" buscando correos que:
 *         - reminderSent === false
 *         - new Date(reminderAt) < Date.now()
 *         - No existe respuesta del destinatario en la bandeja de entrada
 *           (se determina buscando en localStorage un correo con inReplyTo === id)
 *      Si cumple las condiciones, envía un nuevo correo con asunto `Re: ...`
 *      y marca reminderSent = true.
 * 
 * Nota: Para entornos con backend, se recomienda mover esta lógica al servidor.
 */

import { getMails, sendMail } from './emailService';

const DEFAULT_DAYS = 3; // días de espera por defecto
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

let intervalId = null;
let enabled = true;

/**
 * Activa el servicio de recordatorios.
 * @param {Object} options
 * @param {number} options.days Número de días antes de recordar.
 * @param {boolean} options.enabled Habilitar/deshabilitar.
 */
export function initReminderService({ days = DEFAULT_DAYS, enabled: en = true } = {}) {
  enabled = en;
  if (!enabled) {
    stopReminderService();
    return;
  }
  if (intervalId) return; // Ya iniciado
  intervalId = setInterval(() => runReminderJob(days), CHECK_INTERVAL_MS);
  // Ejecutar inmediatamente en el arranque
  runReminderJob(days);
}

export function stopReminderService() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function runReminderJob(days) {
  if (!enabled) return;
  try {
    const sentMails = await getMails('sent');
    const inboxMails = await getMails('inbox');
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    for (const mail of sentMails) {
      if (mail.reminderSent) continue;
      if (new Date(mail.reminderAt || mail.date).getTime() > cutoff) continue;

      // Comprobar respuesta: buscamos correo en inbox con inReplyTo = mail.id o mismo asunto + Re:
      const replied = inboxMails.some(
        m => m.inReplyTo === mail.id || (m.subject || '').startsWith('Re:') && (m.subject || '').includes(mail.subject)
      );
      if (replied) continue;

      // Enviar recordatorio
      await sendMail({
        to: mail.to,
        subject: `Re: ${mail.subject}`,
        body: `Hola,\n\nSólo para asegurarme de que recibiste mi mensaje anterior. Quedo atento(a) a tu respuesta.\n\n---\nMensaje original:\n${mail.body}`,
      });

      // Marcar como enviado el recordatorio
      mail.reminderSent = true;
      // Persistir
      const allSent = sentMails.map(m => (m.id === mail.id ? mail : m));
      // emailService expone saveLocal? no, usamos localStorage directo
      try {
        const stored = JSON.parse(localStorage.getItem('mywed360_mails') || '[]');
        const updated = stored.map(m => (m.id === mail.id ? mail : m));
        localStorage.setItem('mywed360_mails', JSON.stringify(updated));
      } catch (e) {
        console.error('Error actualizando estado de recordatorio:', e);
      }
    }
  } catch (err) {
    console.error('Error en job de recordatorios:', err);
  }
}
