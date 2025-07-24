import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Componente para configurar el nombre de correo electrónico de usuario
 * Permite seleccionar un nombre de usuario para el dominio @mywed360
 * Incluye validación en tiempo real de disponibilidad
 */
const EmailSetupForm = ({ onSave, defaultUsername = '', userId }) => {
  const [username, setUsername] = useState(defaultUsername);
  const [availabilityStatus, setAvailabilityStatus] = useState('idle'); // 'idle', 'checking', 'available', 'unavailable'
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Función para comprobar si un nombre de usuario está disponible
  const checkAvailability = async (value) => {
    if (!value) {
      setAvailabilityStatus('idle');
      return;
    }

    // Validar formato del nombre de usuario
    const usernameRegex = /^[a-z0-9][a-z0-9._-]{2,29}$/i;
    if (!usernameRegex.test(value)) {
      setError('El nombre solo puede contener letras, números, puntos, guiones y guiones bajos. Mínimo 3 caracteres.');
      setAvailabilityStatus('unavailable');
      return;
    }

    setAvailabilityStatus('checking');
    setError('');
    
    try {
      // En un entorno real, esto sería una llamada a la API
      // En este ejemplo simulamos la llamada con un timeout
      setTimeout(async () => {
        // Simulamos que algunos nombres están ocupados
        const takenUsernames = ['admin', 'info', 'soporte', 'ayuda', 'contacto'];
        const isAvailable = !takenUsernames.includes(value.toLowerCase());
        
        setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
        if (!isAvailable) {
          setError(`El nombre "${value}" ya está en uso. Por favor elige otro.`);
        }
      }, 800); // Simular delay de red
    } catch (error) {
      console.error("Error al comprobar disponibilidad:", error);
      setAvailabilityStatus('unavailable');
      setError('Error al comprobar disponibilidad. Inténtalo de nuevo más tarde.');
    }
  };

  // Efecto para comprobar disponibilidad cuando el usuario escribe
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAvailability(username);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [username]);

  // Función para guardar el nombre de correo
  const handleSave = async () => {
    if (availabilityStatus !== 'available') return;
    
    setIsSaving(true);
    try {
      // En un entorno real, esto sería una llamada a la API para guardar
      // el nombre de correo asociado al usuario
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      
      if (onSave) {
        onSave(username);
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      setError('Error al guardar. Inténtalo de nuevo más tarde.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Configura tu correo electrónico myWed360
      </h2>
      
      <p className="text-gray-600 mb-5">
        Elige un nombre de usuario único para tu correo electrónico myWed360. 
        Este será tu correo oficial dentro de la plataforma.
      </p>
      
      <div className="mb-4">
        <label htmlFor="email-username" className="block text-sm font-medium text-gray-700 mb-1">
          Tu dirección de correo:
        </label>
        
        <div className="flex items-center">
          <input
            id="email-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`border px-3 py-2 rounded-l-md flex-1 focus:ring-2 focus:outline-none ${
              availabilityStatus === 'available' 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200' 
                : availabilityStatus === 'unavailable'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder="tunombre"
            aria-label="Nombre de usuario para correo"
            disabled={isSaving}
          />
          <div className="bg-gray-100 px-3 py-2 border-y border-r rounded-r-md text-gray-700 whitespace-nowrap">
            @mywed360
          </div>
        </div>
        
        <div className="mt-2 min-h-[24px]">
          {availabilityStatus === 'checking' && (
            <div className="flex items-center text-gray-500">
              <Loader2 size={16} className="animate-spin mr-2" />
              <span className="text-sm">Comprobando disponibilidad...</span>
            </div>
          )}
          
          {availabilityStatus === 'available' && username && (
            <div className="flex items-center text-green-600">
              <Check size={16} className="mr-2" />
              <span className="text-sm">¡Nombre disponible!</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center text-red-600">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button
          onClick={handleSave}
          disabled={availabilityStatus !== 'available' || isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar dirección de correo'
          )}
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Notas:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>Tu dirección de correo será <strong>{username || 'tunombre'}@mywed360</strong></li>
          <li>Podrás enviar y recibir correos desde esta dirección</li>
          <li>Este correo se utilizará para todas las comunicaciones con proveedores</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailSetupForm;
