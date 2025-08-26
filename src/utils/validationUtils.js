/**
 * Utilidades de validación reutilizables para formularios
 * Centraliza las validaciones más comunes del proyecto
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida formato de teléfono español
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Acepta formatos: +34 XXX XXX XXX, 6XXXXXXXX, 9XXXXXXXX
  const phoneRegex = /^(\+34|0034|34)?[6789]\d{8}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleanPhone);
};

/**
 * Valida formato de URL
 * @param {string} url - URL a validar
 * @returns {boolean} True si es válido
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

/**
 * Valida que un string no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} True si no está vacío
 */
export const isNotEmpty = (value) => {
  return value && typeof value === 'string' && value.trim().length > 0;
};

/**
 * Valida longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @returns {boolean} True si cumple la longitud
 */
export const hasMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/**
 * Valida longitud máxima
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima
 * @returns {boolean} True si cumple la longitud
 */
export const hasMaxLength = (value, maxLength) => {
  return !value || value.length <= maxLength;
};

/**
 * Valida que sea un número válido
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es número válido
 */
export const isValidNumber = (value) => {
  return !isNaN(Number(value)) && isFinite(Number(value));
};

/**
 * Valida que sea un número entero positivo
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es entero positivo
 */
export const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Valida formato de fecha (YYYY-MM-DD)
 * @param {string} date - Fecha a validar
 * @returns {boolean} True si es válida
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Valida que una fecha sea futura
 * @param {string} date - Fecha a validar (YYYY-MM-DD)
 * @returns {boolean} True si es fecha futura
 */
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

/**
 * Valida formato de código postal español
 * @param {string} postalCode - Código postal a validar
 * @returns {boolean} True si es válido
 */
export const isValidSpanishPostalCode = (postalCode) => {
  if (!postalCode) return false;
  const postalRegex = /^[0-5]\d{4}$/;
  return postalRegex.test(postalCode);
};

/**
 * Valida formato de DNI/NIE español
 * @param {string} dni - DNI/NIE a validar
 * @returns {boolean} True si es válido
 */
export const isValidSpanishDNI = (dni) => {
  if (!dni) return false;
  
  // Limpiar espacios y convertir a mayúsculas
  const cleanDNI = dni.replace(/\s/g, '').toUpperCase();
  
  // Validar formato DNI (8 dígitos + letra)
  const dniRegex = /^\d{8}[A-Z]$/;
  if (dniRegex.test(cleanDNI)) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(cleanDNI.substr(0, 8), 10);
    const letter = cleanDNI.charAt(8);
    return letters.charAt(number % 23) === letter;
  }
  
  // Validar formato NIE (X/Y/Z + 7 dígitos + letra)
  const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
  if (nieRegex.test(cleanDNI)) {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let number = cleanDNI.substr(1, 7);
    const firstChar = cleanDNI.charAt(0);
    
    // Convertir primera letra a número
    if (firstChar === 'X') number = '0' + number;
    else if (firstChar === 'Y') number = '1' + number;
    else if (firstChar === 'Z') number = '2' + number;
    
    const letter = cleanDNI.charAt(8);
    return letters.charAt(parseInt(number, 10) % 23) === letter;
  }
  
  return false;
};

/**
 * Sanitiza un string eliminando caracteres peligrosos
 * @param {string} input - String a sanitizar
 * @returns {string} String sanitizado
 */
export const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar eventos onclick, onload, etc.
    .trim();
};

/**
 * Normaliza un string para comparaciones (sin acentos, minúsculas)
 * @param {string} str - String a normalizar
 * @returns {string} String normalizado
 */
export const normalizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
    .trim();
};

/**
 * Reglas de validación predefinidas para useForm
 */
export const commonValidationRules = {
  required: {
    required: true,
    requiredMessage: 'Este campo es obligatorio'
  },
  
  email: {
    required: true,
    email: true,
    requiredMessage: 'El email es obligatorio',
    emailMessage: 'El formato del email no es válido'
  },
  
  phone: {
    custom: (value) => {
      if (!value) return null;
      return isValidPhone(value) ? null : 'El formato del teléfono no es válido';
    }
  },
  
  url: {
    custom: (value) => {
      if (!value) return null;
      return isValidUrl(value) ? null : 'La URL debe empezar con http:// o https://';
    }
  },
  
  password: {
    required: true,
    minLength: 6,
    requiredMessage: 'La contraseña es obligatoria',
    minLengthMessage: 'La contraseña debe tener al menos 6 caracteres'
  },
  
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    requiredMessage: 'El nombre es obligatorio',
    minLengthMessage: 'El nombre debe tener al menos 2 caracteres',
    maxLengthMessage: 'El nombre no puede tener más de 50 caracteres'
  },
  
  postalCode: {
    custom: (value) => {
      if (!value) return null;
      return isValidSpanishPostalCode(value) ? null : 'El código postal no es válido';
    }
  },
  
  dni: {
    custom: (value) => {
      if (!value) return null;
      return isValidSpanishDNI(value) ? null : 'El DNI/NIE no es válido';
    }
  }
};
