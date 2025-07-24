import React, { useState } from 'react';
import { X, Calendar, Mail, CheckCircle } from 'lucide-react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useProviderEmail } from '../../hooks/useProviderEmail';

/**
 * @typedef {import('../../hooks/useProveedores').Provider} Provider
 */

/**
 * Componente modal para agendar reuniones o citas con un proveedor.
 * Permite seleccionar fecha, hora, método de contacto y añadir notas.
 * Incluye validación de campos y manejo de errores.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Provider} props.provider - Proveedor con el que se desea agendar la cita
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSubmit - Función para enviar los datos de la reserva
 * @returns {React.ReactElement} Modal para agendar citas
 */
const ReservationModal = ({ provider, onClose, onSubmit }) => {
  // Integración con el hook de email para proveedores
  const { 
    loading: emailLoading,
    error: emailError,
    userEmail,
    sendEmailToProvider,
    generateDefaultSubject,
    generateDefaultEmailBody
  } = useProviderEmail();
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
    status: 'Pendiente',
    contactMethod: 'email'
  });
  
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    body: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario comienza a corregir
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };
  
  // Inicializar datos del email cuando se muestra el formulario
  const initializeEmailData = () => {
    setEmailData({
      subject: generateDefaultSubject(provider),
      body: generateDefaultEmailBody(provider)
    });
    setShowEmailForm(true);
  };

  // Manejar cambios en el formulario de email
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar email al proveedor
  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.body) {
      setErrors(prev => ({
        ...prev,
        email: 'El asunto y el cuerpo del email son obligatorios'
      }));
      return;
    }
    
    const result = await sendEmailToProvider(
      provider,
      emailData.subject,
      emailData.body
    );
    
    if (result) {
      setEmailSent(true);
      setShowEmailForm(false);
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }
    
    if (!formData.time) {
      newErrors.time = 'La hora es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        providerId: provider.id,
        providerName: provider.name,
        ...formData
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            Reservar cita con {provider.name}
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
        <div className="overflow-y-auto p-4 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <div className="mb-4">
                <label htmlFor="date" className="block mb-1 text-sm font-medium">
                  Fecha *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="time" className="block mb-1 text-sm font-medium">
                  Hora *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full p-2 border ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                />
                {errors.time && (
                  <p className="text-red-500 text-sm mt-1">{errors.time}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="contactMethod" className="block mb-1 text-sm font-medium">
                  Método de contacto preferido
                </label>
                <select
                  id="contactMethod"
                  name="contactMethod"
                  value={formData.contactMethod}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="phone">Teléfono</option>
                  <option value="presencial">Presencial</option>
                  <option value="videollamada">Videollamada</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block mb-1 text-sm font-medium">
                  Notas o preguntas para el proveedor
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Cualquier información adicional relevante para la cita..."
                ></textarea>
              </div>
              
              {/* Información de contacto del proveedor */}
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-2 flex items-center">
                  <Calendar size={16} className="mr-1 text-blue-600" />
                  Información de contacto
                </h3>
                {provider.contact && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Contacto:</span> {provider.contact}
                  </p>
                )}
                {provider.phone && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Teléfono:</span> {provider.phone}
                  </p>
                )}
                {provider.email && (
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Email:</span> {provider.email}
                  </p>
                )}
                {provider.location && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Ubicación:</span> {provider.location}
                  </p>
                )}
              </div>
            </Card>
          </form>
        </div>
        
        {/* Sección de email */}
        {!showEmailForm && !emailSent && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center mb-2">
              <Mail size={18} className="mr-2 text-blue-600" />
              <h3 className="font-medium">Contacto por email</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Puedes enviar un email directamente al proveedor para consultar disponibilidad
              o solicitar más información antes de confirmar la reserva.
            </p>
            <Button 
              type="button" 
              variant="outline" 
              onClick={initializeEmailData}
              className="w-full flex items-center justify-center"
            >
              <Mail size={16} className="mr-2" />
              Redactar email al proveedor
            </Button>
          </div>
        )}
        
        {/* Formulario de email */}
        {showEmailForm && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium flex items-center">
                <Mail size={18} className="mr-2 text-blue-600" />
                Enviar email al proveedor
              </h3>
              <button 
                onClick={() => setShowEmailForm(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="subject" className="block mb-1 text-sm font-medium">
                  Asunto
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={emailData.subject}
                  onChange={handleEmailChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="body" className="block mb-1 text-sm font-medium">
                  Mensaje
                </label>
                <textarea
                  id="body"
                  name="body"
                  value={emailData.body}
                  onChange={handleEmailChange}
                  rows="6"
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              {emailError && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                  {emailError}
                </div>
              )}
            </div>
            
            <Button 
              type="button" 
              onClick={handleSendEmail} 
              disabled={emailLoading}
              className="w-full flex items-center justify-center"
            >
              {emailLoading ? 'Enviando...' : 'Enviar email'}
            </Button>
          </div>
        )}
        
        {/* Confirmación de email enviado */}
        {emailSent && (
          <div className="p-4 border-t bg-green-50">
            <div className="flex items-center text-green-700 mb-2">
              <CheckCircle size={18} className="mr-2" />
              <span className="font-medium">Email enviado correctamente</span>
            </div>
            <p className="text-sm text-gray-700">
              Tu mensaje ha sido enviado a {provider.name} desde tu dirección personalizada {userEmail}.
              Recibirás una notificación cuando responda.
            </p>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="p-4 border-t flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={emailLoading}>
            Confirmar reserva
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReservationModal;
