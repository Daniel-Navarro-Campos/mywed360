import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  assignEmailToFolder,
  removeEmailFromFolder,
  getEmailFolder,
  getEmailsInFolder,
  updateFolderUnreadCount,
  isEmailInCustomFolder
} from '../../services/folderService';

describe('folderService', () => {
  // Constantes para pruebas
  const USER_ID = 'testuser123';
  const FOLDERS_STORAGE_KEY = 'lovenda_email_folders_testuser123';
  const EMAIL_FOLDER_MAPPING_KEY = 'lovenda_email_folder_mapping_testuser123';
  
  // Mock para localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
      clear: vi.fn(() => { store = {}; })
    };
  })();
  
  // Reemplazar localStorage global con nuestro mock
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  // Datos de ejemplo para pruebas
  const mockFolders = [
    { id: 'folder1', name: 'Trabajo', createdAt: '2025-01-01T10:00:00Z', unread: 0 },
    { id: 'folder2', name: 'Personal', createdAt: '2025-01-02T10:00:00Z', unread: 2 }
  ];
  
  const mockEmailFolderMapping = {
    'email1': 'folder1',
    'email2': 'folder1',
    'email3': 'folder2'
  };
  
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // UUID mock para resultados predecibles
    vi.mock('uuid', () => ({
      v4: () => 'new-folder-id'
    }));
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('getUserFolders', () => {
    it('devuelve un array vacío si no hay carpetas para el usuario', () => {
      const folders = getUserFolders(USER_ID);
      expect(folders).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(FOLDERS_STORAGE_KEY);
    });
    
    it('devuelve las carpetas del usuario desde localStorage', () => {
      // Configurar datos de prueba
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      const folders = getUserFolders(USER_ID);
      expect(folders).toEqual(mockFolders);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(FOLDERS_STORAGE_KEY);
    });
    
    it('maneja errores y devuelve array vacío en caso de fallo', () => {
      // Forzar un error en localStorage.getItem
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Error de prueba');
      });
      
      const folders = getUserFolders(USER_ID);
      expect(folders).toEqual([]);
      // Verificar que se registró el error en la consola
      expect(console.error).toHaveBeenCalled;
    });
  });
  
  describe('createFolder', () => {
    it('crea una nueva carpeta correctamente', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      const folderName = 'Nueva Carpeta';
      const newFolder = createFolder(USER_ID, folderName);
      
      expect(newFolder).toEqual({
        id: 'new-folder-id',
        name: folderName,
        createdAt: expect.any(String),
        unread: 0
      });
      
      // Verificar que se guardaron las carpetas actualizadas
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        FOLDERS_STORAGE_KEY,
        expect.stringContaining(folderName)
      );
    });
    
    it('lanza error si ya existe una carpeta con el mismo nombre', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      // Intentar crear carpeta con nombre existente
      expect(() => {
        createFolder(USER_ID, 'Trabajo');
      }).toThrow('Ya existe una carpeta con ese nombre');
      
      // Verificar que no se guardaron cambios
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('renameFolder', () => {
    it('renombra una carpeta correctamente', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      const folderId = 'folder1';
      const newName = 'Trabajo Actualizado';
      
      const result = renameFolder(USER_ID, folderId, newName);
      
      // Verificar que la función devuelve la carpeta actualizada
      expect(result.name).toBe(newName);
      expect(result.id).toBe(folderId);
      
      // Verificar que se guardaron las carpetas actualizadas
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        FOLDERS_STORAGE_KEY,
        expect.stringContaining(newName)
      );
    });
    
    it('lanza error si el nuevo nombre ya existe en otra carpeta', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      // Intentar renombrar con nombre existente
      expect(() => {
        renameFolder(USER_ID, 'folder1', 'Personal');
      }).toThrow('Ya existe otra carpeta con ese nombre');
      
      // Verificar que no se guardaron cambios
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteFolder', () => {
    beforeEach(() => {
      // Configurar datos de carpetas
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === FOLDERS_STORAGE_KEY) {
          return JSON.stringify(mockFolders);
        }
        if (key === EMAIL_FOLDER_MAPPING_KEY) {
          return JSON.stringify(mockEmailFolderMapping);
        }
        return null;
      });
    });
    
    it('elimina una carpeta correctamente', () => {
      const result = deleteFolder(USER_ID, 'folder1');
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se guardaron las carpetas actualizadas (sin la carpeta eliminada)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        FOLDERS_STORAGE_KEY,
        expect.not.stringContaining('Trabajo')
      );
      
      // Verificar que se actualizó el mapeo de correos (sin los correos de la carpeta eliminada)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_FOLDER_MAPPING_KEY,
        expect.not.stringContaining('email1')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_FOLDER_MAPPING_KEY,
        expect.not.stringContaining('email2')
      );
    });
    
    it('devuelve false si la carpeta no existe', () => {
      const result = deleteFolder(USER_ID, 'carpeta-inexistente');
      
      expect(result).toBe(false);
    });
  });
  
  describe('assignEmailToFolder', () => {
    beforeEach(() => {
      // Configurar datos de carpetas y mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === FOLDERS_STORAGE_KEY) {
          return JSON.stringify(mockFolders);
        }
        if (key === EMAIL_FOLDER_MAPPING_KEY) {
          return JSON.stringify(mockEmailFolderMapping);
        }
        return null;
      });
    });
    
    it('asigna un correo a una carpeta correctamente', () => {
      const emailId = 'email4';
      const folderId = 'folder2';
      
      const result = assignEmailToFolder(USER_ID, emailId, folderId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_FOLDER_MAPPING_KEY,
        expect.stringContaining(emailId)
      );
    });
    
    it('actualiza la carpeta si el correo ya estaba en otra', () => {
      const emailId = 'email1'; // Ya está en folder1
      const newFolderId = 'folder2';
      
      const result = assignEmailToFolder(USER_ID, emailId, newFolderId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_FOLDER_MAPPING_KEY,
        expect.stringContaining(`"${emailId}":"${newFolderId}"`)
      );
    });
  });
  
  describe('removeEmailFromFolder', () => {
    beforeEach(() => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === EMAIL_FOLDER_MAPPING_KEY) {
          return JSON.stringify(mockEmailFolderMapping);
        }
        return null;
      });
    });
    
    it('elimina un correo de su carpeta correctamente', () => {
      const emailId = 'email1';
      
      const result = removeEmailFromFolder(USER_ID, emailId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo (sin el correo eliminado)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_FOLDER_MAPPING_KEY,
        expect.not.stringContaining(`"${emailId}":`)
      );
    });
    
    it('devuelve false si el correo no estaba en ninguna carpeta', () => {
      const emailId = 'email-no-existente';
      
      const result = removeEmailFromFolder(USER_ID, emailId);
      
      // Verificar resultado
      expect(result).toBe(false);
    });
  });
  
  describe('getEmailFolder', () => {
    it('devuelve el ID de la carpeta de un correo', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const emailId = 'email1';
      const folderId = getEmailFolder(USER_ID, emailId);
      
      expect(folderId).toBe('folder1');
    });
    
    it('devuelve null si el correo no está asignado a ninguna carpeta', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const emailId = 'email-no-existente';
      const folderId = getEmailFolder(USER_ID, emailId);
      
      expect(folderId).toBeNull();
    });
  });
  
  describe('getEmailsInFolder', () => {
    it('devuelve los IDs de correos en una carpeta', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const folderId = 'folder1';
      const emails = getEmailsInFolder(USER_ID, folderId);
      
      expect(emails).toContain('email1');
      expect(emails).toContain('email2');
      expect(emails.length).toBe(2);
    });
    
    it('devuelve array vacío si no hay correos en la carpeta', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const folderId = 'carpeta-sin-correos';
      const emails = getEmailsInFolder(USER_ID, folderId);
      
      expect(emails).toEqual([]);
    });
  });
  
  describe('updateFolderUnreadCount', () => {
    it('actualiza el contador de no leídos de una carpeta', () => {
      // Configurar datos de carpetas
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      const folderId = 'folder1';
      const newCount = 5;
      
      const result = updateFolderUnreadCount(USER_ID, folderId, newCount);
      
      // Verificar resultado
      expect(result).toEqual({
        ...mockFolders[0],
        unread: newCount
      });
      
      // Verificar que se guardaron las carpetas actualizadas
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        FOLDERS_STORAGE_KEY,
        expect.stringContaining(`"unread":${newCount}`)
      );
    });
    
    it('devuelve null si la carpeta no existe', () => {
      // Configurar datos de carpetas
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockFolders));
      
      const folderId = 'carpeta-inexistente';
      const result = updateFolderUnreadCount(USER_ID, folderId, 3);
      
      expect(result).toBeNull();
    });
  });
  
  describe('isEmailInCustomFolder', () => {
    it('devuelve true si el correo está en una carpeta personalizada', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const result = isEmailInCustomFolder(USER_ID, 'email1');
      
      expect(result).toBe(true);
    });
    
    it('devuelve false si el correo no está en ninguna carpeta', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailFolderMapping));
      
      const result = isEmailInCustomFolder(USER_ID, 'email-no-existente');
      
      expect(result).toBe(false);
    });
  });
});
