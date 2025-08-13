import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Paperclip } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import * as EmailService from '../../services/emailService';
import useAuth from '../../hooks/useAuth';

/**
 * Página de composición de correo electrónico pensada para las rutas
 * /compose y /compose/:action/:id usadas en los tests E2E.
 * Incluye los placeholders exactos ('Para:' y 'Asunto:') y el elemento
 * con data-testid="body-editor" que esperan los tests.
 */
const ComposeEmail = () => {
  const navigate = useNavigate();
  const { action, id } = useParams();
  const { profile } = useAuth();

  // Estado del formulario
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cargar borrador u otra acción si fuese necesario (placeholder para el futuro)
  React.useEffect(() => {
    /* Aquí podríamos cargar un borrador si action === 'edit' y id existe. */
  }, [action, id]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validar tamaño máximo 10MB cada archivo
    const invalid = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalid.length > 0) {
      setError('Algunos archivos exceden el tamaño máximo de 10MB');
      return;
    }

    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const validate = () => {
    if (!to) {
      setError('El destinatario es obligatorio');
      return false;
    }
    if (!subject) {
      setError('El asunto es obligatorio');
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    setError('');
    if (!validate()) return;

    setSending(true);
    try {
      await EmailService.sendMail({ to, subject, body, attachments });
      // Mostrar mensaje de éxito y redirigir
      setSuccessMsg('Correo enviado correctamente');
      setTimeout(() => {
        navigate('/email/inbox', { state: { successMessage: 'Correo enviado correctamente' } });
      }, 300);
    } catch (err) {
      console.error(err);
      setError(`Error al enviar correo: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto" data-testid="email-composer">
      <Card className="flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nuevo correo</h2>
        </div>
        <div className="p-4 space-y-4">
          {error && (
          <div className="flex items-center text-red-700 bg-red-50 border border-red-200 p-3 rounded-md" data-testid="error-message">
            <AlertCircle size={18} className="mr-2" />
            <span>{error}</span>
          </div>
          )}
          {successMsg && (
            <div className="flex items-center text-green-700 bg-green-50 border border-green-200 p-3 rounded-md" data-testid="success-message">
              <AlertCircle size={18} className="mr-2" />
              <span>{successMsg}</span>
            </div>
          )
          }

          

          {/* Campo Para */}
          <div>
            <input
              type="text"
              placeholder="Para:" data-testid="recipient-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={sending}
            />
          </div>

          {/* Campo Asunto */}
          <div>
            <input
              type="text"
              placeholder="Asunto:" data-testid="subject-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={sending}
            />
          </div>

          {/* Editor de cuerpo */}
          <div>
            <div
              data-testid="body-editor"
              contentEditable
              className="w-full min-h-[120px] border border-gray-300 rounded-md p-2 focus:outline-none"
              onInput={(e) => setBody(e.currentTarget.innerHTML)}
              suppressContentEditableWarning
            />
          </div>

          {/* Adjuntos */}
          <div>
            <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50" aria-label="Adjuntar archivo">
              <Paperclip size={16} className="mr-1" /> Adjuntar archivo
              <input type="file" data-testid="attachment-input" className="hidden" multiple onChange={handleFileUpload} />
            </label>
            {attachments.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                {attachments.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <Button data-testid="send-button" onClick={handleSend} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ComposeEmail;
