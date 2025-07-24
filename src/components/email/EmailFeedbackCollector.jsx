import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { performanceMonitor } from '../../services/PerformanceMonitor';

/**
 * Componente para recopilar feedback de usuarios sobre el sistema de emails
 * 
 * @component
 * @example
 * ```jsx
 * <EmailFeedbackCollector 
 *   onSubmit={(feedback) => saveFeedback(feedback)} 
 *   isMinimized={false}
 * />
 * ```
 */
function EmailFeedbackCollector({ onSubmit, isMinimized = false, emailId = null }) {
  const [formData, setFormData] = useState({
    rating: 0,
    usability: null,
    performance: null,
    features: [],
    improvement: '',
    featureRequest: '',
  });
  const [step, setStep] = useState(1);
  const [isExpanded, setIsExpanded] = useState(!isMinimized);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones para las preguntas
  const featureOptions = [
    { id: 'alias', label: 'Alias de correo' },
    { id: 'templates', label: 'Plantillas de email' },
    { id: 'tracking', label: 'Seguimiento de emails' },
    { id: 'events', label: 'Detección de eventos' },
    { id: 'search', label: 'Búsqueda en emails' },
    { id: 'notifications', label: 'Notificaciones' },
  ];
  
  const performanceOptions = [
    { value: 'very_slow', label: 'Muy lento' },
    { value: 'slow', label: 'Algo lento' },
    { value: 'acceptable', label: 'Aceptable' },
    { value: 'fast', label: 'Rápido' },
    { value: 'very_fast', label: 'Muy rápido' },
  ];
  
  const usabilityOptions = [
    { value: 'very_difficult', label: 'Muy difícil de usar' },
    { value: 'difficult', label: 'Algo difícil' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'easy', label: 'Fácil de usar' },
    { value: 'very_easy', label: 'Muy fácil de usar' },
  ];

  // Manejador de cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const updatedFeatures = checked
        ? [...formData.features, value]
        : formData.features.filter(feature => feature !== value);
      
      setFormData(prev => ({
        ...prev,
        features: updatedFeatures
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Manejador para establecer la calificación
  const handleSetRating = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };
  
  // Avanzar al siguiente paso
  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };
  
  // Retroceder al paso anterior
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Registrar evento en el monitor de rendimiento
      performanceMonitor.logEvent('email_feedback_submitted', {
        rating: formData.rating,
        usability: formData.usability,
        performance: formData.performance,
        emailId
      });
      
      // Llamar a la función de envío proporcionada por el padre
      if (onSubmit) {
        await onSubmit({
          ...formData,
          timestamp: new Date().toISOString(),
          emailId,
        });
      }
      
      // Marcar como enviado y mostrar agradecimiento
      setIsSubmitted(true);
      
      // Después de 3 segundos, minimizar el componente
      setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      performanceMonitor.logError('feedback_submission', error, { emailId });
      alert('No se pudo enviar tu feedback. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Alternar la visibilidad del formulario
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  // Si está minimizado, mostrar solo botón para expandir
  if (!isExpanded) {
    return (
      <button 
        onClick={toggleExpanded}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 z-50"
        aria-label="Dar feedback sobre el sistema de email"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
      <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-medium text-lg">Tu opinión importa</h3>
        <button 
          onClick={toggleExpanded}
          className="text-white hover:text-indigo-200 focus:outline-none"
          aria-label="Cerrar formulario de feedback"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {isSubmitted ? (
          <div className="text-center py-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="mt-3 text-xl font-medium text-gray-800">¡Gracias por tu feedback!</h4>
            <p className="mt-1 text-gray-600">Tu opinión nos ayuda a mejorar el sistema de emails de Lovenda.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div>
                <h4 className="font-medium mb-3">¿Cómo valorarías tu experiencia con el email de Lovenda?</h4>
                <div className="flex justify-center space-x-4 mb-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleSetRating(rating)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        formData.rating === rating 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500 px-2 mb-4">
                  <span>Muy malo</span>
                  <span>Excelente</span>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={formData.rating === 0}
                    className={`px-4 py-2 rounded-md ${
                      formData.rating === 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h4 className="font-medium mb-3">Sobre la usabilidad y rendimiento</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Qué tan fácil es usar el sistema de email?
                  </label>
                  <select
                    name="usability"
                    value={formData.usability || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Selecciona una opción</option>
                    {usabilityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Cómo valoras la velocidad del sistema de email?
                  </label>
                  <select
                    name="performance"
                    value={formData.performance || ''}
                    onChange={handleChange}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Selecciona una opción</option>
                    {performanceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!formData.usability || !formData.performance}
                    className={`px-4 py-2 rounded-md ${
                      !formData.usability || !formData.performance 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <h4 className="font-medium mb-3">Funcionalidades y sugerencias</h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Qué funcionalidades has utilizado? (selecciona todas las que apliquen)
                  </label>
                  <div className="space-y-2">
                    {featureOptions.map(option => (
                      <div key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={option.id}
                          name="features"
                          value={option.id}
                          checked={formData.features.includes(option.id)}
                          onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="improvement" className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Qué podemos mejorar en nuestro sistema de email?
                  </label>
                  <textarea
                    id="improvement"
                    name="improvement"
                    value={formData.improvement}
                    onChange={handleChange}
                    rows="2"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Comparte tus sugerencias..."
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="featureRequest" className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Hay alguna funcionalidad que te gustaría ver en el futuro?
                  </label>
                  <textarea
                    id="featureRequest"
                    name="featureRequest"
                    value={formData.featureRequest}
                    onChange={handleChange}
                    rows="2"
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Tus ideas son importantes para nosotros..."
                  />
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md ${
                      isSubmitting 
                        ? 'bg-indigo-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Enviando...
                      </>
                    ) : 'Enviar feedback'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

EmailFeedbackCollector.propTypes = {
  /** Función a llamar cuando se envía el formulario de feedback */
  onSubmit: PropTypes.func.isRequired,
  /** Si el componente debe mostrarse minimizado inicialmente */
  isMinimized: PropTypes.bool,
  /** ID del email relacionado con el feedback (opcional) */
  emailId: PropTypes.string
};

export default EmailFeedbackCollector;
