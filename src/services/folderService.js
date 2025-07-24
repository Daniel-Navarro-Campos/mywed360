/**
 * Servicio para gestionar carpetas personalizadas de correo
 * Permite crear, editar, eliminar y mover correos entre carpetas
 */

import { v4 as uuidv4 } from 'uuid';

// Clave para almacenamiento local
const FOLDERS_STORAGE_KEY = 'lovenda_email_folders';
const EMAIL_FOLDER_MAPPING_KEY = 'lovenda_email_folder_mapping';

/**
 * Obtener todas las carpetas del usuario actual
 * @param {string} userId - ID del usuario
 * @returns {Array} - Array de objetos de carpeta
 */
export const getUserFolders = (userId) => {
  try {
    // Formato de clave: lovenda_email_folders_[userId]
    const storageKey = `${FOLDERS_STORAGE_KEY}_${userId}`;
    const foldersJson = localStorage.getItem(storageKey);
    
    if (!foldersJson) {
      return [];
    }
    
    return JSON.parse(foldersJson);
  } catch (error) {
    console.error('Error al obtener carpetas:', error);
    return [];
  }
};

/**
 * Crear una nueva carpeta
 * @param {string} userId - ID del usuario
 * @param {string} folderName - Nombre de la carpeta
 * @returns {Object} - Objeto con la carpeta creada
 */
export const createFolder = (userId, folderName) => {
  try {
    const folders = getUserFolders(userId);
    
    // Verificar si ya existe una carpeta con el mismo nombre
    const folderExists = folders.some(folder => 
      folder.name.toLowerCase() === folderName.toLowerCase()
    );
    
    if (folderExists) {
      throw new Error('Ya existe una carpeta con ese nombre');
    }
    
    // Crear nueva carpeta
    const newFolder = {
      id: uuidv4(),
      name: folderName,
      createdAt: new Date().toISOString(),
      unread: 0
    };
    
    // Guardar carpetas actualizadas
    const updatedFolders = [...folders, newFolder];
    saveUserFolders(userId, updatedFolders);
    
    return newFolder;
  } catch (error) {
    console.error('Error al crear carpeta:', error);
    throw error;
  }
};

/**
 * Renombrar una carpeta existente
 * @param {string} userId - ID del usuario
 * @param {string} folderId - ID de la carpeta
 * @param {string} newName - Nuevo nombre de la carpeta
 * @returns {Object} - Objeto con la carpeta actualizada
 */
export const renameFolder = (userId, folderId, newName) => {
  try {
    const folders = getUserFolders(userId);
    
    // Verificar si ya existe otra carpeta con el mismo nombre
    const folderExists = folders.some(folder => 
      folder.name.toLowerCase() === newName.toLowerCase() && 
      folder.id !== folderId
    );
    
    if (folderExists) {
      throw new Error('Ya existe otra carpeta con ese nombre');
    }
    
    // Encontrar y actualizar la carpeta
    const updatedFolders = folders.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, name: newName };
      }
      return folder;
    });
    
    // Guardar carpetas actualizadas
    saveUserFolders(userId, updatedFolders);
    
    return updatedFolders.find(folder => folder.id === folderId);
  } catch (error) {
    console.error('Error al renombrar carpeta:', error);
    throw error;
  }
};

/**
 * Eliminar una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} folderId - ID de la carpeta
 * @returns {boolean} - true si se eliminó con éxito
 */
export const deleteFolder = (userId, folderId) => {
  try {
    const folders = getUserFolders(userId);
    
    // Filtrar la carpeta a eliminar
    const updatedFolders = folders.filter(folder => folder.id !== folderId);
    
    // Guardar carpetas actualizadas
    saveUserFolders(userId, updatedFolders);
    
    // También eliminar mapeos de correos a esta carpeta
    removeEmailsFromFolder(userId, folderId);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar carpeta:', error);
    throw error;
  }
};

/**
 * Guardar carpetas del usuario
 * @param {string} userId - ID del usuario
 * @param {Array} folders - Array de objetos de carpeta
 * @private
 */
const saveUserFolders = (userId, folders) => {
  const storageKey = `${FOLDERS_STORAGE_KEY}_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(folders));
};

/**
 * Obtener mapeo de correos a carpetas para un usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} - Objeto con mapeos de correos a carpetas
 * @private
 */
const getEmailFolderMapping = (userId) => {
  try {
    const storageKey = `${EMAIL_FOLDER_MAPPING_KEY}_${userId}`;
    const mappingJson = localStorage.getItem(storageKey);
    
    if (!mappingJson) {
      return {};
    }
    
    return JSON.parse(mappingJson);
  } catch (error) {
    console.error('Error al obtener mapeo de correos a carpetas:', error);
    return {};
  }
};

/**
 * Guardar mapeo de correos a carpetas
 * @param {string} userId - ID del usuario
 * @param {Object} mapping - Objeto con mapeos de correos a carpetas
 * @private
 */
const saveEmailFolderMapping = (userId, mapping) => {
  const storageKey = `${EMAIL_FOLDER_MAPPING_KEY}_${userId}`;
  localStorage.setItem(storageKey, JSON.stringify(mapping));
};

/**
 * Asignar un correo a una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @param {string} folderId - ID de la carpeta
 * @returns {boolean} - true si se asignó con éxito
 */
export const assignEmailToFolder = (userId, emailId, folderId) => {
  try {
    // Verificar que la carpeta existe
    const folders = getUserFolders(userId);
    const folderExists = folders.some(folder => folder.id === folderId);
    
    if (!folderExists) {
      throw new Error('La carpeta especificada no existe');
    }
    
    // Obtener mapeo actual
    const mapping = getEmailFolderMapping(userId);
    
    // Actualizar mapeo
    mapping[emailId] = folderId;
    
    // Guardar mapeo actualizado
    saveEmailFolderMapping(userId, mapping);
    
    return true;
  } catch (error) {
    console.error('Error al asignar correo a carpeta:', error);
    throw error;
  }
};

/**
 * Quitar un correo de una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {boolean} - true si se quitó con éxito
 */
export const removeEmailFromFolder = (userId, emailId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailFolderMapping(userId);
    
    // Eliminar la asignación del correo
    delete mapping[emailId];
    
    // Guardar mapeo actualizado
    saveEmailFolderMapping(userId, mapping);
    
    return true;
  } catch (error) {
    console.error('Error al quitar correo de carpeta:', error);
    throw error;
  }
};

/**
 * Eliminar todos los correos de una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} folderId - ID de la carpeta
 * @returns {boolean} - true si se eliminaron con éxito
 * @private
 */
const removeEmailsFromFolder = (userId, folderId) => {
  try {
    // Obtener mapeo actual
    const mapping = getEmailFolderMapping(userId);
    
    // Filtrar mapeos para eliminar los de esta carpeta
    const updatedMapping = {};
    
    for (const [emailId, mappedFolderId] of Object.entries(mapping)) {
      if (mappedFolderId !== folderId) {
        updatedMapping[emailId] = mappedFolderId;
      }
    }
    
    // Guardar mapeo actualizado
    saveEmailFolderMapping(userId, updatedMapping);
    
    return true;
  } catch (error) {
    console.error('Error al eliminar correos de carpeta:', error);
    throw error;
  }
};

/**
 * Obtener la carpeta asignada a un correo
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {string|null} - ID de la carpeta o null si no está asignado
 */
export const getEmailFolder = (userId, emailId) => {
  try {
    const mapping = getEmailFolderMapping(userId);
    return mapping[emailId] || null;
  } catch (error) {
    console.error('Error al obtener carpeta de correo:', error);
    return null;
  }
};

/**
 * Obtener todos los correos asignados a una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} folderId - ID de la carpeta
 * @returns {Array} - Array de IDs de correos
 */
export const getEmailsInFolder = (userId, folderId) => {
  try {
    const mapping = getEmailFolderMapping(userId);
    
    // Filtrar correos que pertenecen a esta carpeta
    return Object.entries(mapping)
      .filter(([_, mappedFolderId]) => mappedFolderId === folderId)
      .map(([emailId, _]) => emailId);
  } catch (error) {
    console.error('Error al obtener correos de carpeta:', error);
    return [];
  }
};

/**
 * Actualizar contador de no leídos para una carpeta
 * @param {string} userId - ID del usuario
 * @param {string} folderId - ID de la carpeta
 * @param {number} unreadCount - Número de correos no leídos
 */
export const updateFolderUnreadCount = (userId, folderId, unreadCount) => {
  try {
    const folders = getUserFolders(userId);
    
    // Actualizar contador de no leídos
    const updatedFolders = folders.map(folder => {
      if (folder.id === folderId) {
        return { ...folder, unread: unreadCount };
      }
      return folder;
    });
    
    // Guardar carpetas actualizadas
    saveUserFolders(userId, updatedFolders);
    
    return true;
  } catch (error) {
    console.error('Error al actualizar contador de no leídos:', error);
    return false;
  }
};

/**
 * Verificar si un correo pertenece a alguna carpeta personalizada
 * @param {string} userId - ID del usuario
 * @param {string} emailId - ID del correo
 * @returns {boolean} - true si el correo está en alguna carpeta
 */
export const isEmailInCustomFolder = (userId, emailId) => {
  const mapping = getEmailFolderMapping(userId);
  return !!mapping[emailId];
};
