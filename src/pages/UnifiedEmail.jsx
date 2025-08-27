import React from 'react';
import EmailInbox from '../components/email/EmailInbox';

/**
 * Página principal para la bandeja de entrada de email
 * Usa el diseño original preferido por el usuario
 * 
 * @returns {JSX.Element} Página de la bandeja de entrada
 */
const UnifiedEmail = () => {
  console.log('UnifiedEmail component rendering with original design...');
  return (
    <div className="h-full flex flex-col p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📧 Bandeja de Entrada</h1>
        <p className="text-gray-600">Gestiona tus correos electrónicos de boda</p>
      </div>
      <div className="flex-1 bg-gray-50 rounded-lg p-4">
        <EmailInbox />
      </div>
    </div>
  );
};

export default UnifiedEmail;
