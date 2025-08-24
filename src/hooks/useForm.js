import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizado para gestión avanzada de formularios
 * Proporciona funcionalidades comunes como validación, estado de envío, errores, etc.
 * 
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Object} validationRules - Reglas de validación para cada campo
 * @param {Function} onSubmit - Función a ejecutar al enviar el formulario
 * @returns {Object} Objeto con estado y funciones del formulario
 */
const useForm = (initialValues = {}, validationRules = {}, onSubmit) => {
  // Estados del formulario
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Resetear formulario a valores iniciales
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
  }, [initialValues]);

  // Actualizar un campo específico
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Manejar cambios en los campos
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  // Manejar cuando un campo pierde el foco
  const handleBlur = useCallback((event) => {
    const { name } = event.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validar campo individual
    if (validationRules[name]) {
      const fieldError = validateField(name, values[name]);
      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [name]: fieldError
        }));
      }
    }
  }, [values, validationRules]);

  // Validar un campo individual
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Validación requerido
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return rules.requiredMessage || `${name} es obligatorio`;
    }

    // Validación de longitud mínima
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `${name} debe tener al menos ${rules.minLength} caracteres`;
    }

    // Validación de longitud máxima
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `${name} no puede tener más de ${rules.maxLength} caracteres`;
    }

    // Validación de email
    if (rules.email && value && !/\S+@\S+\.\S+/.test(value)) {
      return rules.emailMessage || 'El formato del email no es válido';
    }

    // Validación de URL
    if (rules.url && value && !value.match(/^https?:\/\/.+/)) {
      return rules.urlMessage || 'La URL debe empezar con http:// o https://';
    }

    // Validación de número
    if (rules.number && value && isNaN(Number(value))) {
      return rules.numberMessage || 'Debe ser un número válido';
    }

    // Validación personalizada
    if (rules.custom && typeof rules.custom === 'function') {
      return rules.custom(value, values);
    }

    return null;
  }, [validationRules, values]);

  // Validar todo el formulario
  const validateForm = useCallback(() => {
    const newErrors = {};
    let formIsValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  }, [values, validationRules, validateField]);

  // Manejar envío del formulario
  const handleSubmit = useCallback(async (event) => {
    if (event) {
      event.preventDefault();
    }

    // Marcar todos los campos como tocados
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validar formulario
    const formIsValid = validateForm();
    if (!formIsValid) {
      return false;
    }

    // Si hay función onSubmit, ejecutarla
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
        return true;
      } catch (error) {
        console.error('Error al enviar formulario:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }

    return true;
  }, [values, validateForm, onSubmit]);

  // Obtener props para un campo específico
  const getFieldProps = useCallback((name) => ({
    name,
    value: values[name] || '',
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] && errors[name],
    hasError: Boolean(touched[name] && errors[name])
  }), [values, handleChange, handleBlur, touched, errors]);

  // Verificar si el formulario tiene cambios
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Verificar si hay errores
  const hasErrors = useMemo(() => {
    return Object.keys(errors).some(key => errors[key]);
  }, [errors]);

  return {
    // Estados
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    hasErrors,

    // Funciones
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    reset,
    validateForm,
    validateField,
    getFieldProps
  };
};

export default useForm;
