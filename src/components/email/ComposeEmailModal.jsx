import React, { useState, useEffect } from 'react';
import { X, Paperclip, Send } from 'lucide-react';
import Button from '../Button';
import * as EmailService from '../../services/emailService';
import { safeRender, ensureNotPromise, safeMap } from '../../utils/promiseSafeRenderer';

/**
 * Modal para componer y enviar un nuevo correo electrónico
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {string} props.userEmail - Email del usuario remitente
 * @param {Object} [props.replyTo] - Email al que se está respondiendo (opcional)
 */
const ComposeEmailModal = ({ isOpen, onClose, userEmail, replyTo }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Preparar datos si es una respuesta
  useEffect(() => {
    if (replyTo) {
      // Extraer dirección de correo del remitente original
      const originalSender = replyTo.from;
      const originalSubject = replyTo.subject || '';
      
      setTo(originalSender);
      setSubject(originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`);
      
      // Crear cita del mensaje original
      const quoteDate = new Date(replyTo.date).toLocaleString('es-ES');
      const quoteHeader = `El ${quoteDate}, ${originalSender} escribió:`;
      const quoteBody = replyTo.body
        ? replyTo.body.replace(/\n/g, '\n> ')
        : '';
      
      setBody(`\n\n\n${quoteHeader}\n> ${quoteBody}`);
    }
  }, [replyTo]);
  
  // Manejar envío del correo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!to) {
      setError('Debes especificar un destinatario');
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      await EmailService.sendMail({ 
        to, 
        subject, 
        body, 
        attachments 
      });
      
      setSuccess(true);
      
      // Cerrar el modal después de 1.5 segundos
      setTimeout(() => {
        onClose();
        // Reset form
        setTo('');
        setSubject('');
        setBody('');
        setAttachments([]);
        setSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error al enviar correo:', error);
      setError(`Error al enviar el correo: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
  
  // Manejar archivos adjuntos
  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Limitar tamaño total a 10MB
    const totalSize = [...attachments, ...files].reduce((acc, file) => acc + (file.size || 0), 0);
    if (totalSize > 10 * 1024 * 1024) {
      setError('El tamaño total de los adjuntos no debe superar los 10MB');
      return;
    }
    
    // Añadir nuevos archivos al estado
    const newAttachments = files.map(file => ({
      file,
      filename: file.name,
      size: file.size,
      type: file.type
    }));
    
    setAttachments([...attachments, ...newAttachments]);
    
    // Limpiar input de archivos
    e.target.value = '';
  };
  
  // Eliminar un archivo adjunto
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {replyTo ? 'Responder' : 'Nuevo mensaje'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-4 space-y-4 flex-grow overflow-y-auto">
            {/* Campos del formulario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De:</label>
              <input
                type="text"
                value={userEmail}
                disabled
                className="w-full p-2 border rounded-md bg-gray-50"
              />
            </div>
            
            <div>
              <label htmlFor="to-input" className="block text-sm font-medium text-gray-700 mb-1">Destinatario:</label>
              <input
                id="to-input"
                aria-label="Destinatario"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="destinatario@ejemplo.com"
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject-input" className="block text-sm font-medium text-gray-700 mb-1">Asunto:</label>
              <input
                id="subject-input"
                aria-label="Asunto"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del mensaje"
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div className="flex-grow">
              <label htmlFor="body-input" className="block text-sm font-medium text-gray-700 mb-1">Mensaje:</label>
              <textarea
                id="body-input"
                aria-label="Mensaje"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full p-2 border rounded-md min-h-[200px]"
                rows={10}
              />
            </div>
            
            {/* Archivos adjuntos */}
            {attachments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivos adjuntos:
                </label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Paperclip size={16} className="mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mensajes de error o éxito */}
            {safeRender(error, '') && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {safeRender(error, '')}
              </div>
            )}
            
            {safeRender(success, false) && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                ¡Mensaje enviado con éxito!
              </div>
            )}
          </div>
          
          {/* Barra inferior con acciones */}
          <div className="border-t p-4 bg-gray-50 flex justify-between">
            <div>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex items-center"
                >
                  <Paperclip size={16} className="mr-2" /> Adjuntar archivo
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleAttachment}
                  className="hidden"
                />
              </label>
            </div>
            
            <Button
              type="submit"
              variant="default"
              className="flex items-center"
              disabled={sending || !to}
            >
              {sending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" /> Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
