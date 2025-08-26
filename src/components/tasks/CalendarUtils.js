// Utilidades para generar archivos ICS de calendario

// Formatea una fecha para formato ICS
export function formatICalDate(date) {
  const pad = n => String(n).padStart(2,'0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

// Genera un archivo ICS completo a partir de eventos
export function generateFullICS(events) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MyWed360//WeddingApp//ES'];
  events.forEach(evt => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}`);
    lines.push(`DTSTAMP:${formatICalDate(new Date())}`);
    lines.push(`DTSTART:${formatICalDate(evt.start)}`);
    lines.push(`DTEND:${formatICalDate(evt.end)}`);
    lines.push(`SUMMARY:${evt.title}`);
    if (evt.desc) lines.push(`DESCRIPTION:${evt.desc}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Función para descargar todos los eventos como archivo ICS
export function downloadAllICS(events) {
  const icsData = generateFullICS(events);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lovenda-eventos.ics';
  a.click();
  URL.revokeObjectURL(url);
}
