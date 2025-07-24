import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import { createEmailAlias, initEmailService } from '../../services/emailService';
import { useAuth } from '../../hooks/useAuth';
import TagsManager from './TagsManager';
import WeddingAccountLink from '../settings/WeddingAccountLink';

/**
 * Componente para gestionar la configuración de correo electrónico del usuario
 * Permite personalizar su dirección de correo y gestionar preferencias
 */
const EmailSettings = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailAlias, setEmailAlias] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  
  // Cargar datos del usuario
  useEffect(() => {
    if (userProfile) {
      // Inicializar el servicio de email y obtener la dirección actual
      const currentEmail = initEmailService(userProfile);
      setEmailAddress(currentEmail);
      setEmailAlias(userProfile.emailAlias || '');
    }
  }, [userProfile]);
  
  // Validar formato de alias
  const validateAlias = (alias) => {
    if (!alias) return false;
    if (alias.length < 3) return false;
    
    // Comprobar que solo contiene caracteres válidos (letras, números, puntos)
    const validAliasRegex = /^[a-z0-9.]+$/;
    return validAliasRegex.test(alias);
  };
  
  // Manejar cambio de alias
  const handleChangeAlias = async (e) => {
    e.preventDefault();
    
    if (!validateAlias(newAlias)) {
      setError('El alias debe tener al menos 3 caracteres y solo puede contener letras, números y puntos.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Crear el nuevo alias
      const result = await createEmailAlias(userProfile, newAlias);
      
      if (result.success) {
        // Actualizar perfil de usuario con el nuevo alias
        const updatedProfile = {
          ...userProfile,
          emailAlias: result.alias
        };
        
        // Actualizar en backend/estado
        await updateUserProfile(updatedProfile);
        
        setEmailAddress(result.email);
        setEmailAlias(result.alias);
        setNewAlias('');
        setSuccess(true);
        
        // Ocultar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error al cambiar alias de correo:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Configuración de Correo Electrónico</h2>
      
      <div className="space-y-6">
        {/* Dirección de correo actual */}
        <div>
          <h3 className="text-md font-medium mb-2">Tu dirección de correo</h3>
          <p className="text-gray-600 mb-1">Esta es tu dirección de correo electrónico actual en Lovenda:</p>
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="font-medium">{emailAddress}</p>
          </div>
        </div>
        
        {/* Cambiar alias */}
        <div>
          <h3 className="text-md font-medium mb-2">Personalizar dirección de correo</h3>
          <p className="text-gray-600 mb-3">
            Puedes personalizar la parte inicial de tu dirección de correo para hacerla más fácil de recordar.
          </p>
          
          <form onSubmit={handleChangeAlias} className="space-y-3">
            <div>
              <label htmlFor="email-alias" className="block text-sm font-medium text-gray-700 mb-1">
                Nuevo alias de correo
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="email-alias"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value.toLowerCase())}
                  className="flex-grow p-2 border rounded-l-md focus:ring-2 focus:ring-blue-500"
                  placeholder={emailAlias || "tunombre"}
                />
                <span className="bg-gray-100 p-2 border-r border-t border-b rounded-r-md flex items-center">
                  @lovenda.com
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minúsculas, números y puntos. Mínimo 3 caracteres.
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-start">
                <Check size={16} className="mr-2 mt-0.5" />
                <p className="text-sm">¡Tu dirección de correo ha sido actualizada con éxito!</p>
              </div>
            )}
            
            <Button
              type="submit"
              variant="default"
              disabled={loading || !newAlias}
            >
              {loading ? 'Actualizando...' : 'Actualizar dirección'}
            </Button>
          </form>
        </div>
        
        {/* Opciones adicionales */}
        <div>
          <h3 className="text-md font-medium mb-2">Preferencias de notificación</h3>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-new-email"
                defaultChecked={true}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-new-email" className="ml-2 block text-sm text-gray-700">
                Notificarme cuando reciba nuevos correos
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-read"
                defaultChecked={true}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="notify-read" className="ml-2 block text-sm text-gray-700">
                Notificarme cuando mis correos sean leídos
              </label>
            </div>
          </div>
        </div>
        
        {/* Gestor de etiquetas */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <TagsManager />
        </div>

        {/* Vincular cuentas de boda */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <WeddingAccountLink />
        </div>
      </div>
    </Card>
  );
};

export default EmailSettings;
