import React, { useState } from 'react';
import sanitizeHtml from '../../utils/sanitizeHtml';
import { ArrowLeft, Trash, Star, StarOff, Reply, Forward, Paperclip, Calendar, Download } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import * as emailService from '../../services/emailService';

/**
 * Componente para visualizar el contenido completo de un email
 * con opciones para responder, reenviar, marcar como importante, etc.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.email - Datos completos del email a visualizar
 * @param {Function} props.onBack - Función para volver a la lista de emails
 * @param {Function} props.onDelete - Función para eliminar el email
 * @param {Function} props.onReply - Función para responder al email
 * @param {Function} props.onForward - Función para reenviar el email
 * @param {Function} props.onToggleImportant - Función para marcar/desmarcar como importante
 * @returns {React.ReactElement} Visor detallado del email
 */
const EmailViewer = ({ email, onBack, onDelete, onReply, onForward, onToggleImportant }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const isImportant = email?.folder === 'important';

  // Marcar como leído al visualizar
  React.useEffect(() => {
    if (email && !email.read) {
      EmailService.markAsRead(email.id);
    }
  }, [email]);

  // Formatear fecha completa
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar envío de respuesta
  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    await onReply({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: replyText,
      replyToId: email.id
    });
    
    setShowReplyForm(false);
    setReplyText('');
  };

  // Si no hay email seleccionado
  if (!email) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-gray-500">Selecciona un email para visualizarlo</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      {/* Cabecera */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center"
          >
            <ArrowLeft size={18} className="mr-1" />
            Volver
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleImportant(email.id, !isImportant)}
              className="flex items-center"
              title={isImportant ? 'Quitar estrella' : 'Marcar con estrella'}
            >
              {isImportant ? (
                <StarOff size={18} className="text-gray-600" />
              ) : (
                <Star size={18} className="text-gray-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(email)}
              className="flex items-center"
              title="Responder"
            >
              <Reply size={18} className="text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onForward(email)}
              className="flex items-center"
              title="Reenviar"
            >
              <Forward size={18} className="text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(email.id)}
              className="flex items-center"
              title="Eliminar"
            >
              <Trash size={18} className="text-gray-600" />
            </Button>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-2">{email.subject || '(Sin asunto)'}</h1>
        
        <div className="flex flex-col sm:flex-row justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">De:</span> {email.from}
          </div>
          <div>
            <span className="font-medium">Fecha:</span> {formatDate(email.date)}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-medium">Para:</span> {email.to}
        </div>
        
        {email.cc && (
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-medium">CC:</span> {email.cc}
          </div>
        )}
      </div>

      {/* Cuerpo del email */}
      <div className="p-4 flex-grow overflow-auto">
        {/* Renderizar el HTML del cuerpo del email */}
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: safeExecute(
            () => {
              const result = sanitizeHtml(email.body || '');
              return typeof result === 'string' ? result : String(result || '');
            },
            email.body || '' // fallback si sanitizeHtml retorna una Promesa
          ) }}
        />
      </div>

      {/* Adjuntos si existen */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="flex items-center text-sm font-medium mb-2">
            <Paperclip size={16} className="mr-1" />
            Adjuntos ({email.attachments.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {email.attachments.map((attachment, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded p-2 flex items-center"
              >
                <div className="flex-grow truncate">
                  {attachment.name || `Archivo ${index + 1}`}
                  <span className="text-xs text-gray-500 block">
                    {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {/* Lógica de descarga */}}
                >
                  <Download size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulario de respuesta rápida */}
      {showReplyForm && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="font-medium mb-2 flex items-center">
            <Reply size={16} className="mr-1" />
            Responder
          </h3>
          
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-2"
            rows="4"
            placeholder="Escribe tu respuesta aquí..."
          ></textarea>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyForm(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={!replyText.trim()}
            >
              Enviar respuesta
            </Button>
          </div>
        </div>
      )}

      {/* Pie de página con acciones rápidas */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            <Reply size={16} className="mr-1" />
            Respuesta rápida
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Calendar size={16} className="mr-1" />
            Añadir al calendario
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmailViewer;
