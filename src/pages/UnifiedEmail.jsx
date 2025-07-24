import React from 'react';
import InboxContainer from '../components/email/UnifiedInbox/InboxContainer';

/**
 * Página principal para la bandeja de entrada unificada
 * Sirve como punto de entrada a toda la funcionalidad de email
 * 
 * @returns {JSX.Element} Página de la bandeja de entrada unificada
 */
const UnifiedEmail = () => {
  // Mensaje de diagnóstico para verificar si el componente se renderiza
  console.log('UnifiedEmail component rendering...');
  return (
    <div className="h-full flex flex-col">
      <InboxContainer />
    </div>
  );
};

export default UnifiedEmail;
