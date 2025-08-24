import React, { useState, useCallback } from 'react';
import { Button } from '../ui';
import { Input } from '../ui';
import useTranslations from '../../hooks/useTranslations';

/**
 * Formulario optimizado para añadir/editar invitados
 * Componente reutilizable con validación y UX mejorada
 */
const GuestForm = ({ 
  guest = null, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const { t, wedding } = useTranslations();
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    address: guest?.address || '',
    companion: guest?.companion || 0,
    table: guest?.table || '',
    response: guest?.response || 'Pendiente',
    status: guest?.status || 'pending',
    dietaryRestrictions: guest?.dietaryRestrictions || '',
    notes: guest?.notes || ''
  });

  // Estado de validación
  const [errors, setErrors] = useState({});

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('forms.fieldRequired');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('forms.fieldRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('forms.invalidEmail');
    }
    
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = t('forms.invalidPhone');
    }
    
    if (formData.companion < 0) {
      newErrors.companion = 'El número de acompañantes no puede ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  // Manejar envío del formulario
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Preparar datos para guardar
    const guestData = {
      ...formData,
      companion: parseInt(formData.companion, 10) || 0,
      id: guest?.id || `guest-${Date.now()}`,
      createdAt: guest?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(guestData);
  }, [formData, validateForm, onSave, guest]);

  // Opciones de estado RSVP
  const rsvpOptions = [
    { value: 'pending', label: wedding.guestStatus('pending') },
    { value: 'confirmed', label: wedding.guestStatus('confirmed') },
    { value: 'declined', label: wedding.guestStatus('declined') }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.guestName')} *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Nombre completo del invitado"
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.guestEmail')} *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            className={errors.email ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.guestPhone')}
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+34 123 456 789"
            className={errors.phone ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.guestStatus')}
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {rsvpOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('guests.guestAddress')}
        </label>
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Dirección completa (opcional)"
          disabled={isLoading}
        />
      </div>

      {/* Acompañantes y mesa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.plusOne')}
          </label>
          <Input
            type="number"
            min="0"
            max="10"
            value={formData.companion}
            onChange={(e) => handleChange('companion', e.target.value)}
            placeholder="0"
            className={errors.companion ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.companion && (
            <p className="text-red-500 text-xs mt-1">{errors.companion}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('guests.guestTable')}
          </label>
          <Input
            type="text"
            value={formData.table}
            onChange={(e) => handleChange('table', e.target.value)}
            placeholder="Número o nombre de mesa"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Restricciones dietéticas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('guests.dietaryRestrictions')}
        </label>
        <textarea
          value={formData.dietaryRestrictions}
          onChange={(e) => handleChange('dietaryRestrictions', e.target.value)}
          placeholder="Alergias, intolerancias o preferencias alimentarias..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="2"
          disabled={isLoading}
        />
      </div>

      {/* Notas adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas adicionales
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Información adicional sobre el invitado..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows="2"
          disabled={isLoading}
        />
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('app.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </div>
          ) : (
            t('app.save')
          )}
        </Button>
      </div>
    </form>
  );
};

export default GuestForm;
