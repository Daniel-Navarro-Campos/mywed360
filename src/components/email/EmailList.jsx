import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Mail, Paperclip } from 'lucide-react';



/**
 * Componente que muestra la lista de correos electrónicos en la bandeja
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.emails - Lista de emails a mostrar
 * @param {boolean} props.loading - Indica si está cargando los datos
 * @param {string} props.selectedEmailId - ID del email seleccionado actualmente
 * @param {Function} props.onSelectEmail - Función para seleccionar un email
 * @param {string} props.folder - Carpeta actual (inbox, sent, trash)
 */
const EmailList = ({ emails, loading, selectedEmailId, onSelectEmail, folder, height = 600, itemHeight = 88 }) => {
  const listRef = useRef();
  
  // Desplazar a la posición del elemento seleccionado en la lista virtual
  useEffect(() => {
    if (!listRef.current) return;
    const index = emails.findIndex((e) => e.id === selectedEmailId);
    if (index >= 0) {
      listRef.current.scrollToItem(index, 'smart');
    }
  }, [selectedEmailId, emails]);
  // Formatear fecha para mostrar en la lista
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Si es hoy, mostrar solo la hora
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Si es ayer, mostrar "Ayer"
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
      }
      
      // Si es este año, mostrar día y mes
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      }
      
      // Si es otro año, mostrar día/mes/año
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateStr;
    }
  };
  
  // Truncar texto largo
  const truncate = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };
  
  // Eliminar tags HTML para previsualización
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };
  
  // Función para manejar eventos de teclado en la lista
  const handleKeyDown = (event, email, index) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        // Seleccionar el correo cuando se presiona Enter o espacio
        event.preventDefault();
        onSelectEmail(email);
        break;
      case 'ArrowDown':
        // Mover al siguiente correo si existe
        event.preventDefault();
        if (index < emails.length - 1) {
          onSelectEmail(emails[index + 1]);
        }
        break;
      case 'ArrowUp':
        // Mover al correo anterior si existe
        event.preventDefault();
        if (index > 0) {
          onSelectEmail(emails[index - 1]);
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center h-64"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" 
          aria-hidden="true"
        ></div>
        <span className="ml-2 text-gray-800">Cargando correos...</span>
      </div>
    );
  }
  
  if (!emails.length) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-64 text-gray-700"
        role="status"
        aria-live="polite"
      >
        <Mail size={48} className="mb-2 opacity-20" aria-hidden="true" />
        <p className="text-center">
          {folder === 'inbox' ? 'No hay correos en tu bandeja de entrada' : 
           folder === 'sent' ? 'No has enviado ningún correo' : 
           'No hay correos en esta carpeta'}
        </p>
      </div>
    );
  }
  
  const Row = ({ index, style }) => {
    const email = emails[index];
    return (
      <div
        style={style}
        key={email.id}
        className={`py-3 px-2 cursor-pointer transition-colors hover:bg-gray-50 divide-y divide-gray-200 ${
          selectedEmailId === email.id ? 'bg-blue-50 ring-2 ring-blue-400' : ''
        } ${!email.read ? 'font-semibold' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`}
        onClick={() => onSelectEmail(email)}
        onKeyDown={(e) => handleKeyDown(e, email, index)}
        tabIndex="0"
        role="listitem"
        aria-selected={selectedEmailId === email.id}
        aria-labelledby={`email-${email.id}-subject`}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            {!email.read && (
              <span 
                className="w-2 h-2 bg-blue-500 rounded-full mr-2"
                aria-label="No leído"
                role="status"
              ></span>
            )}
            <span className="text-sm text-gray-800">
              {folder === 'sent' ? `Para: ${email.to}` : `De: ${email.from}`}
            </span>
          </div>
          <span className="text-xs text-gray-600" aria-label={`Fecha: ${email.date}`}>{formatDate(email.date)}</span>
        </div>
        <div className="flex justify-between">
          <h4 
            id={`email-${email.id}-subject`}
            className="text-sm mb-1 flex-grow pr-2 truncate font-medium text-gray-800"
          >
            {email.subject || '(Sin asunto)'}
          </h4>
          {email.attachments && email.attachments.length > 0 && (
            <span aria-label="Contiene archivos adjuntos">
              <Paperclip size={14} className="text-gray-600 shrink-0" />
            </span>
          )}
        </div>
        <p 
          className="text-xs text-gray-600 line-clamp-1"
          aria-label="Vista previa del mensaje"
        >
          {truncate(stripHtml(email.body), 120)}
        </p>
      </div>
    );
  };

  return (
    <List
      height={height}
      width="100%"
      itemCount={emails.length}
      itemSize={itemHeight}
      outerElementType="div"
      className="divide-y divide-gray-200"
      role="list"
      aria-label={`Correos en ${folder === 'inbox' ? 'bandeja de entrada' : folder === 'sent' ? 'enviados' : folder === 'trash' ? 'papelera' : folder}`}
      ref={listRef}
      itemKey={(index) => emails[index].id}
    >
      {Row}
    </List>
  );
};



export default EmailList;
