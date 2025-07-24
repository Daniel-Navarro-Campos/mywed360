import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';

// Estilos por defecto y personalizados del calendario
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../styles/calendarOverrides.css';

// Importar locale de español
import es from 'date-fns/locale/es';

// Configuración del localizador para el calendario
const locales = {
  'es': es
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Semana comienza el lunes
  getDay,
  locales,
});

// Categorías de tareas con sus colores
export const categories = {
  LUGAR: { name: 'Lugar', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#fca5a5' },
  INVITADOS: { name: 'Invitados', color: '#f97316', bgColor: '#ffedd5', borderColor: '#fdba74' },
  COMIDA: { name: 'Catering', color: '#eab308', bgColor: '#fef9c3', borderColor: '#fde047' },
  DECORACION: { name: 'Decoración', color: '#22c55e', bgColor: '#dcfce7', borderColor: '#86efac' },
  PAPELERIA: { name: 'Papelería', color: '#06b6d4', bgColor: '#cffafe', borderColor: '#67e8f9' },
  MUSICA: { name: 'Música', color: '#6366f1', bgColor: '#e0e7ff', borderColor: '#a5b4fc' },
  FOTOGRAFO: { name: 'Fotografía', color: '#8b5cf6', bgColor: '#ede9fe', borderColor: '#c4b5fd' },
  VESTUARIO: { name: 'Vestuario', color: '#d946ef', bgColor: '#fae8ff', borderColor: '#e879f9' },
  OTROS: { name: 'Otros', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#d1d5db' },
};

// Estilos para eventos del calendario (estilo Google Calendar)
export function eventStyleGetter(event) {
  const cat = categories[event.category || 'OTROS'];
  return {
    style: {
      backgroundColor: cat.color,
      color: '#ffffff',
      border: 'none',
      borderRadius: '0',
      padding: '0px 5px',
      fontSize: '14px',
      opacity: 0.8
    }
  };
}

// Componente para renderizar cada evento en el calendario (estilo Google Calendar)
export const Event = ({ event }) => {
  return (
    <div className="rbc-event-content">
      <div style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: '#fff',
        fontSize: '0.85em',
        fontWeight: '500',
        padding: '2px 5px',
        width: '100%',
        lineHeight: '1.4',
        letterSpacing: '0.2px',
        textShadow: '0 1px 1px rgba(0,0,0,0.2)' // Mejora legibilidad del texto blanco
      }}>
        {event.title || event.name || "Sin título"}
      </div>
    </div>
  );
};
