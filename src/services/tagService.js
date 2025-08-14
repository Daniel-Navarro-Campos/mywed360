/**
 * Servicio para gestionar etiquetas (tags) de correo
 * Permite crear, eliminar, asignar y filtrar etiquetas para correos
 */

import { v4 as uuidv4 } from 'uuid';
import { loadJson, saveJson } from '../utils/storage.js';

// Caché en memoria para tests y runtime rápido
const runtimeCustomTags = {};

// Función para limpiar caché (útil en tests)
export const clearCache = () => {
  Object.keys(runtimeCustomTags).forEach(key => {
    delete runtimeCustomTags[key];
  });
};

// Claves para almacenamiento local
const TAGS_STORAGE_KEY = 'lovenda_email_tags';
const EMAIL_TAGS_MAPPING_KEY = 'lovenda_email_tags_mapping';

// Etiquetas predefinidas por el sistema
export const SYSTEM_TAGS = [
  { id: 'important', name: 'Importante', color: '#e53e3e' }, // Rojo
  { id: 'work', name: 'Trabajo', color: '#3182ce' },         // Azul
  { id: 'personal', name: 'Personal', color: '#38a169' },    // Verde
  { id: 'invitation', name: 'Invitación', color: '#805ad5' }, // Morado
  { id: 'provider', name: 'Proveedor', color: '#dd6b20' },   // Naranja
];

/**
 * Obtener todas las etiquetas disponibles para un usuario
 * Incluye tanto etiquetas del sistema como personalizadas
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de etiqueta
 */
export const getUserTags = (userId) => {
  const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
  try {
    // Siempre leer de storage para evitar inconsistencias en tests que modifican directamente localStorage
    const customTags = loadJson(storageKey, []);
    // Mantener caché actualizada para posibles accesos dentro del mismo tick
    runtimeCustomTags[userId] = customTags;
    return [...SYSTEM_TAGS, ...customTags];
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    // Fallback: usar caché si existe
    return [...SYSTEM_TAGS, ...(runtimeCustomTags[userId] || [])];
  }
};

/**
 * Obtener solo las etiquetas personalizadas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de etiqueta personalizados
 */
export const getCustomTags = (userId) => {
  const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
  try {
    const fromStorage = loadJson(storageKey, []);
    // Siempre actualizar caché con lo que leemos del storage
    runtimeCustomTags[userId] = fromStorage;
    return fromStorage;
  } catch (error) {
    console.error('Error al obtener etiquetas personalizadas:', error);
    // En caso de error, devolver caché si existe, sino array vacío
    return runtimeCustomTags[userId] || [];
  }
};

/**
 * Crear una nueva etiqueta personalizada
 * @param {string} userId - ID del usuario
 * @param {string} tagName - Nombre de la etiqueta
 * @param {string} color - Color de la etiqueta en formato hex
 * @returns {Object} - Objeto con la etiqueta creada
 */
export const createTag = (userId, tagName, color = '#64748b') => {
  try {
    const tags = getCustomTags(userId);

    // Generar nombre único gestionando duplicados (case-insensitive)
    const allTags = [...SYSTEM_TAGS, ...tags];
    const baseName = tagName.trim();

    let suffix = 0;
    let uniqueName = baseName;
    while (allTags.some(t => t.name.toLowerCase() === uniqueName.toLowerCase())) {
      suffix += 1;
      uniqueName = `${baseName} (${suffix})`;
    }

    // Crear nueva etiqueta
    const newTag = {
      id: uuidv4(),
      name: uniqueName,
      color: color,
      createdAt: new Date().toISOString()
    };

    // Guardar etiquetas actualizadas
    const updatedTags = [...tags, newTag];
    saveUserTags(userId, updatedTags);

    return newTag;
  } catch (error) {
    console.error('Error al crear etiqueta:', error);
    throw error;
  }
};

/**
 * Eliminar una etiqueta personalizada
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {Object} - { success: boolean }
 */
export const deleteTag = (userId, tagId) => {
  // No permitir eliminar etiquetas del sistema
  if (SYSTEM_TAGS.some(tag => tag.id === tagId)) {
    throw new Error('No se pueden eliminar etiquetas del sistema');
  }

  try {
    const tags = getCustomTags(userId);

    // Comprobar si la etiqueta existe realmente
    const exists = tags.some(tag => tag.id === tagId);
    if (!exists) {
      return false; // Nada que eliminar
    }

    // Filtrar la etiqueta a eliminar
    const updatedTags = tags.filter(tag => tag.id !== tagId);

    // Guardar etiquetas actualizadas
    saveUserTags(userId, updatedTags);

    // También eliminar asignaciones de esta etiqueta a correos
    removeTagFromAllEmails(userId, tagId);

    return true;
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    return false;
  }
};

/**
 * Guardar etiquetas personalizadas del usuario
 * @param {string} userId - ID del usuario
 * @param {Array} tags - Array de objetos de etiqueta
 * @private
 */
const saveUserTags = (userId, tags) => {
  // Actualizar caché primero para acceso inmediato
  runtimeCustomTags[userId] = tags;
  const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
  saveJson(storageKey, tags);
};

/**
 * Obtener mapeo de correos a etiquetas para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con mapeos de correos a etiquetas
 * @private
 */
const getEmailTagsMapping = (userId) => {
  try {
    const storageKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
    return loadJson(storageKey, {});
  } catch (error) {
    console.error('Error al obtener mapeo de correos a etiquetas:', error);
    return {};
  }
};

/**
 * Guardar mapeo de correos a etiquetas
 * @param {string} userId - ID del usuario
 * @param {Object} mapping - Objeto con mapeos de correos a etiquetas
 * @private
 */
const saveEmailTagsMapping = (userId, mapping) => {
  const storageKey = `${EMAIL_TAGS_MAPPING_KEY}_${userId}`;
  saveJson(storageKey, mapping);
};

/**
 * Asignar una etiqueta a un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se asignó con éxito
 */
export const addTagToEmail = (userId, emailId, tagId) => {
  try {
    // Verificar que la etiqueta existe
    let allTags = getUserTags(userId);
    let tagExists = allTags.some(tag => tag.id === tagId);

    // Si no se encuentra, forzar recarga desde storage para evitar desincronización de caché
    if (!tagExists) {
      delete runtimeCustomTags[userId]; // invalidar caché
      allTags = getUserTags(userId);
      tagExists = allTags.some(tag => tag.id === tagId);
    }

    if (!tagExists) {
      throw new Error('La etiqueta especificada no existe');
    }
    
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);
    
    // Inicializar array de etiquetas para este correo si no existe
    if (!mapping[emailId]) {
      mapping[emailId] = [];
    }
    
    // Verificar si la etiqueta ya está asignada (idempotente)
    if (!mapping[emailId].includes(tagId)) {
      mapping[emailId].push(tagId);
      // Guardar mapeo actualizado únicamente si hay cambio
      saveEmailTagsMapping(userId, mapping);
    }
    return true;
  } catch (error) {
    console.error('Error al asignar etiqueta a correo:', error);
    throw error;
  }
};

/**
 * Quitar una etiqueta de un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se quitó con éxito
 */
export const removeTagFromEmail = (userId, emailId, tagId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);
    
    // Si el correo no tiene etiquetas, simplemente retornar éxito
    if (!mapping[emailId]) {
      return true;
    }
    
    const newList = mapping[emailId].filter(id => id !== tagId);
    if (newList.length !== mapping[emailId].length) {
      // Hubo un cambio, guardar
      mapping[emailId] = newList;
      saveEmailTagsMapping(userId, mapping);
    }
    return true;
  } catch (error) {
    console.error('Error al quitar etiqueta de correo:', error);
    throw error;
  }
};

/**
 * Quitar una etiqueta de todos los correos
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {boolean} - true si se quitó con éxito
 * @private
 */
export const removeTagFromAllEmails = (userId, tagId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);
    
    // Filtrar la etiqueta de todos los correos
    Object.keys(mapping).forEach(emailId => {
      mapping[emailId] = mapping[emailId].filter(id => id !== tagId);
    });
    
    // Guardar mapeo actualizado
    saveEmailTagsMapping(userId, mapping);
    
    return true;
  } catch (error) {
    console.error('Error al quitar etiqueta de todos los correos:', error);
    throw error;
  }
};

/**
 * Obtener todas las etiquetas asignadas a un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {Array} - Array de IDs de etiquetas
 */
export const getEmailTags = (userId, emailId) => {
  try {
    const mapping = getEmailTagsMapping(userId);
    return mapping[emailId] || [];
  } catch (error) {
    console.error('Error al obtener etiquetas de correo:', error);
    return [];
  }
};

/**
 * Obtener etiquetas completas (con nombre, color, etc) de un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {Array} - Array de objetos de etiqueta completos
 */
export const getEmailTagsDetails = (userId, emailId) => {
  try {
    const tagIds = getEmailTags(userId, emailId);
    if (!tagIds.length) return [];
    
    const allTags = getUserTags(userId);
    return tagIds
      .map(tagId => allTags.find(tag => tag.id === tagId))
      .filter(tag => tag !== undefined); // Filtrar etiquetas que ya no existen
  } catch (error) {
    console.error('Error al obtener detalles de etiquetas:', error);
    return [];
  }
};

/**
 * Obtener todos los correos que tienen una etiqueta específica
 * @param {string} userId - ID del usuario
 * @param {string} tagId - ID de la etiqueta
 * @returns {Array} - Array de IDs de correos
 */
export const getEmailsByTag = (userId, tagId) => {
  try {
    const mapping = getEmailTagsMapping(userId);
    
    // Filtrar correos que tienen esta etiqueta
    return Object.entries(mapping)
      .filter(([_, tagIds]) => tagIds.includes(tagId))
      .map(([emailId, _]) => emailId);
  } catch (error) {
    console.error('Error al obtener correos por etiqueta:', error);
    return [];
  }
};
