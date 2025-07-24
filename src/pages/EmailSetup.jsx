import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import EmailSetupForm from '../components/email/EmailSetupForm';
import useEmailUsername from '../hooks/useEmailUsername';
import { auth } from '../lib/firebase';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

/**
 * Página de configuración de correo electrónico myWed360
 * Permite a los usuarios crear su dirección personalizada
 */
const EmailSetup = () => {
  const navigate = useNavigate();
  const { getCurrentUsername, reserveUsername, loading, error } = useEmailUsername();
  const [currentUsername, setCurrentUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Cargar nombre de usuario actual si existe
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const username = await getCurrentUsername();
        setCurrentUsername(username);
      } catch (err) {
        console.error('Error al cargar el nombre de usuario:', err);
        setGeneralError('Error al cargar tus datos de correo electrónico');
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      loadUsername();
    } else {
      // Si no hay usuario logueado, redirigir al login
      navigate('/login', { 
        state: { 
          returnUrl: '/email-setup',
          message: 'Debes iniciar sesión para configurar tu correo myWed360' 
        } 
      });
    }
  }, [getCurrentUsername, navigate]);

  const handleSaveUsername = async (username) => {
    try {
      const success = await reserveUsername(username);
      if (success) {
        setCurrentUsername(username);
        setSaveSuccess(true);
        // Ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          setSaveSuccess(false);
        }, 5000);
      }
    } catch (err) {
      console.error('Error al guardar el nombre de usuario:', err);
      setGeneralError('Ha ocurrido un error al guardar tu dirección de correo.');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-bold">Configuración de tu correo myWed360</h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Configura tu dirección de correo personalizada para comunicarte con proveedores 
                y otros usuarios desde la plataforma myWed360.
              </p>
            </div>
          </div>
        </div>

        {generalError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-red-700">{generalError}</p>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-green-700">
                ¡Tu dirección de correo <strong>{currentUsername}@mywed360</strong> ha sido guardada con éxito!
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {currentUsername ? (
              <div className="mb-6">
                <p className="mb-4">
                  Ya tienes configurada tu dirección de correo myWed360: 
                  <strong className="ml-2 text-lg">{currentUsername}@mywed360</strong>
                </p>
                <p className="text-gray-600">
                  Puedes cambiarla a continuación si deseas una dirección diferente:
                </p>
              </div>
            ) : null}
            
            <EmailSetupForm 
              onSave={handleSaveUsername} 
              defaultUsername={currentUsername || ''}
            />
            
            {currentUsername && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-semibold mb-3">¿Qué puedo hacer con mi correo myWed360?</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Enviar y recibir emails desde la plataforma</li>
                  <li>Comunicarte directamente con proveedores sin exponer tu correo personal</li>
                  <li>Recibir notificaciones importantes sobre tu boda</li>
                  <li>Centralizar todas las comunicaciones relacionadas con tu evento</li>
                </ul>
                
                <div className="mt-6">
                  <Button
                    onClick={() => navigate('/email/inbox')}
                    className="mr-4"
                  >
                    Ir a mi bandeja de entrada
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/email/compose')}
                  >
                    Escribir nuevo correo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default EmailSetup;
