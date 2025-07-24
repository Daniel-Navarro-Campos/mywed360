import React from 'react';
import EmailViewer from './EmailViewer';

/**
 * Adaptador simple que reexpone `EmailViewer` con la interfaz
 * esperada por las pruebas unitarias (EmailView).
 * Las pruebas aportan las siguientes props:
 *  - email: objeto con los datos del correo a mostrar
 *  - onReply: callback para responder
 *  - onForward: callback para reenviar
 *  - onDelete: callback para eliminar
 *  - onToggleStarred: callback para marcar / desmarcar con estrella
 *
 * `EmailViewer` internamente utiliza la prop `onToggleImportant`,
 * por lo que hacemos la traducción aquí. Igualmente necesita
 * `onBack`, así que proporcionamos un no-op por defecto.
 */
const EmailView = ({
  email,
  onReply = () => {},
  onForward = () => {},
  onDelete = () => {},
  onToggleStarred = () => {},
}) => {
  return (
    <EmailViewer
      email={email}
      onBack={() => {}}
      onReply={onReply}
      onForward={onForward}
      onDelete={onDelete}
      onToggleImportant={onToggleStarred}
    />
  );
};

export default EmailView;
