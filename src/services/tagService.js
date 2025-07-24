/**
 * Servicio para gestionar etiquetas (tags) de correo
 * Permite crear, eliminar, asignar y filtrar etiquetas para correos
 */

import { v4 as uuidv4 } from 'uuid';
import { loadJson, saveJson } from '../utils/storage.js';

// Caché en memoria para tests y runtime rápido
const runtimeCustomTags = {};

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
  try {
    // Intentar primero la caché en memoria
    let customTags = runtimeCustomTags[userId];
    if (!customTags) {
      // Formato de clave: lovenda_email_tags_[userId]
      const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
      customTags = loadJson(storageKey, []);
      // Sincronizar cache para futuras llamadas
      runtimeCustomTags[userId] = customTags;
    }
    
    return [...SYSTEM_TAGS, ...customTags];
  } catch (error) {
    console.error('Error al obtener etiquetas:', error);
    return [...SYSTEM_TAGS]; // Al menos devolver las del sistema
  }
};

/**
 * Obtener solo las etiquetas personalizadas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de etiqueta personalizados
 */
export const getCustomTags = (userId) => {
  try {
    // Primero intentar memoria para velocidad y para entornos de test
    if (runtimeCustomTags[userId]) {
      return runtimeCustomTags[userId];
    }

    // Formato de clave: lovenda_email_tags_[userId]
    const storageKey = `${TAGS_STORAGE_KEY}_${userId}`;
    const fromStorage = loadJson(storageKey, []);

    // Sincronizar cache
    runtimeCustomTags[userId] = fromStorage;
    return fromStorage;
  } catch (error) {
    console.error('Error al obtener etiquetas personalizadas:', error);
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
    
    // Generar un nombre único si ya existe una etiqueta con el mismo nombre
    const allTags = [...SYSTEM_TAGS, ...tags];

    const generateUniqueName = (baseName, existing) => {
      let counter = 0;
      let candidate = baseName;
      const exists = (name) => existing.some(t => t.name.toLowerCase() === name.toLowerCase());
      while (exists(candidate)) {
        counter += 1;
        candidate = `${baseName} (${counter})`;
      }
      return candidate;
    };

    const uniqueName = generateUniqueName(tagName, allTags);

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
  try {
    // Verificar que no sea una etiqueta del sistema
    const isSystemTag = SYSTEM_TAGS.some(tag => tag.id === tagId);
    if (isSystemTag) {
      throw new Error('No se pueden eliminar etiquetas del sistema');
    }
    
    const tags = getCustomTags(userId);
    
    // Filtrar la etiqueta a eliminar
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    
    // Guardar etiquetas actualizadas
    saveUserTags(userId, updatedTags);
    
    // También eliminar asignaciones de esta etiqueta a correos
    removeTagFromAllEmails(userId, tagId);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar etiqueta:', error);
    throw error;
  }
};

/**
 * Guardar etiquetas personalizadas del usuario
 * @param {string} userId - ID del usuario
 * @param {Array} tags - Array de objetos de etiqueta
 * @private
 */
const saveUserTags = (userId, tags) => {
  // Sincronizar caché primero
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
      runtimeCustomTags[userId] = undefined; // invalidar caché
      allTags = getUserTags(userId);
      tagExists = allTags.some(tag => tag.id === tagId);
    }

    if (!tagExists) {
      // Etiqueta inexistente
      return false;
    }
    
    // Obtener mapeo actual
    const mapping = getEmailTagsMapping(userId);
    
    // Inicializar array de etiquetas para este correo si no existe
    if (!mapping[emailId]) {
      mapping[emailId] = [];
    }
    
    // Verificar si la etiqueta ya está asignada
    if (mapping[emailId].includes(tagId)) {
      return false; // Duplicado, no guardar ni modificar
    }
    mapping[emailId].push(tagId);
    // Guardar mapeo actualizado
    saveEmailTagsMapping(userId, mapping);
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
    
    // Si el correo no tiene etiquetas, no hay nada que hacer
    if (!mapping[emailId]) {
      return false;
    }
    
    const originalLength = mapping[emailId].length;
    // Filtrar la etiqueta a quitar
    mapping[emailId] = mapping[emailId].filter(id => id !== tagId);
    if (mapping[emailId].length === originalLength) {
      return false; // No había la etiqueta
    }
    // Guardar mapeo actualizado
    saveEmailTagsMapping(userId, mapping);
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
