import React, { useState, useEffect } from 'react';
import { X, Paperclip, ChevronDown, AlertCircle } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import * as EmailService from '../../services/EmailService';
import * as AuthModule from '../../hooks/useAuth';
const useAuth = AuthModule.useAuth || AuthModule.default || AuthModule;

/**
 * Componente para redactar y enviar nuevos emails desde la dirección personalizada del usuario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Controla si el compositor está abierto
 * @param {Function} props.onClose - Función para cerrar el compositor
 * @param {Object} props.initialValues - Valores iniciales (para respuestas o reenvíos)
 * @param {Function} props.onSend - Callback ejecutado después de enviar el email
 * @returns {React.ReactElement} Componente para redactar emails
 */
const EmailComposer = ({ isOpen, onClose, initialValues = {}, onSend }) => {
  const { profile } = useAuth();
  const [to, setTo] = useState(initialValues.to || '');
  const [cc, setCc] = useState(initialValues.cc || '');
  const [subject, setSubject] = useState(initialValues.subject || '');
  const [body, setBody] = useState(initialValues.body || '');
  const [attachments, setAttachments] = useState([]);
  const [showCc, setShowCc] = useState(!!initialValues.cc);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Inicializar el email del usuario
  useEffect(() => {
    const initializeEmail = async () => {
      if (profile) {
        const email = await EmailService.initEmailService(profile);
        setUserEmail(email);
      }
    };

    initializeEmail();
    
    // Cargar plantillas disponibles
    const loadTemplates = async () => {
      try {
        const availableTemplates = await EmailService.getEmailTemplates();
        setTemplates(availableTemplates || []);
      } catch (err) {
        console.error('Error al cargar plantillas:', err);
      }
    };
    
    loadTemplates();
  }, [profile]);
  
  // Aplicar plantilla seleccionada
  const applyTemplate = (template) => {
    if (!template) return;
    
    setSubject(template.subject || subject);
    setBody(template.body || body);
    setSelectedTemplate(template);
  };
  
  // Manejar subida de archivos adjuntos
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Validar tamaño (máximo 10MB por archivo)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`Algunos archivos exceden el tamaño máximo de 10MB: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // Añadir archivos a la lista de adjuntos
    setAttachments(prev => [...prev, ...files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))]);
    
    // Limpiar input para permitir seleccionar el mismo archivo de nuevo
    if (event.target) {
      // Reiniciar el valor para permitir volver a seleccionar el mismo archivo
      event.target.value = '';
    }
  };
  
  // Eliminar un adjunto
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Validar email antes de enviar
  const validateEmail = () => {
    if (!to) {
      setError('Debes especificar al menos un destinatario');
      return false;
    }
    
    if (!subject) {
      setError('Por favor, añade un asunto al email');
      return false;
    }
    
    if (!body || body.trim().length < 5) {
      setError('El mensaje es demasiado corto');
      return false;
    }
    
    // Validar formato de email (expresión regular básica)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = to.split(',').map(email => email.trim());
    const invalidEmails = toEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setError(`Algunas direcciones de email no son válidas: ${invalidEmails.join(', ')}`);
      return false;
    }
    
    if (cc) {
      const ccEmails = cc.split(',').map(email => email.trim());
      const invalidCcEmails = ccEmails.filter(email => !emailRegex.test(email));
      
      if (invalidCcEmails.length > 0) {
        setError(`Algunas direcciones CC no son válidas: ${invalidCcEmails.join(', ')}`);
        return false;
      }
    }
    
    return true;
  };
  
  // Enviar el email
  const handleSend = async () => {
    setError('');
    
    if (!validateEmail()) {
      return;
    }
    
    // Verificar si el usuario tiene configurada dirección personalizada
    if (profile && !profile.emailUsername && !profile.myWed360Email && !profile.emailAlias) {
      if (window.confirm('No tienes configurada una dirección de correo personalizada. ¿Deseas configurarla ahora?')) {
        window.location.href = '/email/setup';
        return;
      }
    }
    
    setSending(true);
    
    try {
      const result = await EmailService.sendEmail({
        to,
        cc,
        subject,
        body,
        attachments
      });
      
      if (result && (result.success || result.id)) {
        if (onSend) {
          onSend(result);
        }
        
        // Cerrar compositor y limpiar campos
        onClose();
        resetForm();
      } else {
        throw new Error('Error al enviar el email');
      }
    } catch (err) {
      console.error('Error al enviar email:', err);
      setError(`Error al enviar: ${err.message}`);
    } finally {
      setSending(false);
    }
  };
  
  // Resetear formulario
  const resetForm = () => {
    setTo('');
    setCc('');
    setSubject('');
    setBody('');
    setAttachments([]);
    setShowCc(false);
    setError('');
    setSelectedTemplate(null);
  };
  
  // Cerrar y resetear
  const handleClose = () => {
    onClose();
    resetForm();
  };
  
  // Si isOpen no se pasa, asumimos que debe mostrarse
  if (isOpen === false) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold">Nuevo mensaje</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">De:</label>
              {templates.length > 0 && (
                <div className="relative">
                  <select 
                    value={selectedTemplate ? templates.indexOf(selectedTemplate) : ""}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      applyTemplate(templates[index]);
                    }}
                    className="text-sm border border-gray-300 rounded-md py-1 pl-2 pr-8"
                  >
                    <option value="">Plantillas</option>
                    {templates.map((template, index) => (
                      <option key={index} value={index}>{template.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-2 pointer-events-none text-gray-500" />
                </div>
              )}
            </div>
            <div className="border border-gray-300 rounded-md p-2 bg-gray-50 flex justify-between">
              <span className="text-gray-800">
                {userEmail || 'cargando...'}
              </span>
              {userEmail && userEmail.includes('@mywed360') ? (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  myWed360
                </span>
              ) : profile && !profile.emailUsername ? (
                <a 
                  href="/email/setup" 
                  className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                >
                  Configurar correo
                </a>
              ) : null}
            </div>
          </div>

        <div className="mb-2">
          <label htmlFor="to-input" className="block text-sm font-medium text-gray-700 mb-1">Para:</label>
          <input
            id="to-input"
            aria-label="Para Destinatario"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Destinatarios (email@ejemplo.com, email2@ejemplo.com)"
            disabled={sending}
          />
        </div>

        {showCc && (
          <div className="mb-2">
            <label htmlFor="cc-input" className="block text-sm font-medium text-gray-700 mb-1">CC:</label>
            <input
              id="cc-input"
              aria-label="CC"
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="CC (email@ejemplo.com, email2@ejemplo.com)"
              disabled={sending}
            />
          </div>
        )}

        <div className="mb-2 flex justify-end">
          {!showCc && (
            <button
              type="button"
              onClick={() => setShowCc(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Añadir CC
            </button>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="subject-input" className="block text-sm font-medium text-gray-700 mb-1">Asunto:</label>
          <input
            id="subject-input"
            aria-label="Asunto"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Asunto del email"
            disabled={sending}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="body-input" className="block text-sm font-medium text-gray-700 mb-1">Mensaje:</label>
          <textarea
            id="body-input"
            aria-label="Mensaje"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            rows="12"
            placeholder="Escribe tu mensaje aquí..."
            disabled={sending}
          />
        </div>

        {/* Sección de adjuntos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntos:</label>

          <div className="mb-2">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Paperclip size={18} className="mr-2" />
              Adjuntar archivo
              <input
                type="file"
                aria-label="Adjuntar archivo"
                className="hidden"
                multiple
                onChange={handleFileUpload}
                disabled={sending}
              />
            </label>
            <span className="ml-2 text-xs text-gray-500">Máximo 10MB por archivo</span>
          </div>
          
          {attachments.length > 0 && (
              <div className="border border-gray-200 rounded-md p-2">
                <p className="text-xs text-gray-500 mb-2">
                  {attachments.length} {attachments.length === 1 ? 'archivo adjunto' : 'archivos adjuntos'}
                </p>
                
                <ul className="space-y-1">
                  {attachments.map((file, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-grow truncate mr-2">
                        {file.name}
                        <span className="text-xs text-gray-500 ml-1">
                          ({Math.round(file.size / 1024)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        aria-label="Eliminar adjunto"
                        className="text-gray-500"
                        onClick={() => removeAttachment(index)}
                        disabled={sending}
                      >
                        <X size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailComposer;
