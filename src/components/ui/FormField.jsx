import React from 'react';

/**
 * Componente FormField reutilizable para formularios
 * Proporciona una estructura consistente para campos de formulario
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo
 * @param {string} props.type - Tipo de input ('text', 'email', 'password', 'number', 'tel', 'url', 'date', 'textarea', 'select')
 * @param {string} props.value - Valor del campo
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {Function} props.onBlur - Función para manejar pérdida de foco
 * @param {string} props.error - Mensaje de error
 * @param {boolean} props.hasError - Si el campo tiene error
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.required - Si el campo es obligatorio
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {Array} props.options - Opciones para select (array de {value, label})
 * @param {number} props.rows - Número de filas para textarea
 * @param {string} props.className - Clases CSS adicionales
 * @param {React.ReactNode} props.icon - Icono a mostrar
 * @param {string} props.helpText - Texto de ayuda
 * @returns {React.ReactElement} Componente de campo de formulario
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hasError,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  className = '',
  icon,
  helpText,
  ...rest
}) => {
  // Clases base para inputs
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${hasError 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300'
    }
    ${icon ? 'pl-10' : ''}
    ${className}
  `;

  // Renderizar el input según el tipo
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={baseInputClasses}
            {...rest}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
            {...rest}
          >
            <option value="">{placeholder || 'Seleccionar...'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={baseInputClasses}
            {...rest}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      {/* Etiqueta */}
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Campo con icono opcional */}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        {renderInput()}
      </div>

      {/* Mensaje de error */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Texto de ayuda */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;
