import React, { useContext } from 'react';
import { UserPreferencesContext } from '../../contexts/UserContext';
import EmailStats from '../../components/email/EmailStats';
import { Button } from '../../components/ui';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Página de estadísticas de correo electrónico
 * Muestra un panel de control con métricas y gráficos sobre el uso del correo
 */
const EmailStatistics = () => {
  const { currentUser } = useContext(UserPreferencesContext);
  const navigate = useNavigate();
  
  // Navegar a la bandeja de entrada
  const goToInbox = () => {
    navigate('/user/email');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Botón para volver */}
      <Button 
        variant="ghost" 
        onClick={goToInbox}
        className="mb-4"
      >
        <ArrowLeft size={18} className="mr-2" /> Volver a la bandeja
      </Button>
      
      {/* Contenido principal */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        {currentUser ? (
          <EmailStats userId={currentUser.uid} />
        ) : (
          <div className="text-center py-8">
            <p>Debes iniciar sesión para ver tus estadísticas de correo.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailStatistics;
