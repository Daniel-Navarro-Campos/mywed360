import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserTags,
  getCustomTags,
  createTag,
  deleteTag,
  addTagToEmail,
  removeTagFromEmail,
  getEmailTags,
  getEmailTagsDetails,
  getEmailsByTag,
  SYSTEM_TAGS
} from '../../services/tagService';

describe('tagService', () => {
  // Constantes para pruebas
  const USER_ID = 'testuser123';
  const TAGS_STORAGE_KEY = 'lovenda_email_tags_testuser123';
  const EMAIL_TAGS_MAPPING_KEY = 'lovenda_email_tags_mapping_testuser123';
  
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
  const mockCustomTags = [
    { id: 'custom1', name: 'Cliente', color: '#8b5cf6', createdAt: '2025-01-01T10:00:00Z' },
    { id: 'custom2', name: 'Urgente', color: '#ef4444', createdAt: '2025-01-02T10:00:00Z' }
  ];
  
  const mockEmailTagsMapping = {
    'email1': ['important', 'custom1'],
    'email2': ['work', 'custom2'],
    'email3': ['personal']
  };
  
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // UUID mock para resultados predecibles
    vi.mock('uuid', () => ({
      v4: () => 'new-tag-id'
    }));
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('getUserTags', () => {
    it('devuelve etiquetas del sistema cuando no hay etiquetas personalizadas', () => {
      const tags = getUserTags(USER_ID);
      
      // Verificar que devuelve las etiquetas del sistema
      expect(tags.length).toBe(SYSTEM_TAGS.length);
      SYSTEM_TAGS.forEach(systemTag => {
        expect(tags.find(tag => tag.id === systemTag.id)).toBeDefined();
      });
      
      // Verificar que intentó obtener etiquetas personalizadas
      expect(localStorageMock.getItem).toHaveBeenCalledWith(TAGS_STORAGE_KEY);
    });
    
    it('combina etiquetas del sistema con las personalizadas', () => {
      // Configurar datos de prueba
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockCustomTags));
      
      const tags = getUserTags(USER_ID);
      
      // Verificar que devuelve todas las etiquetas
      expect(tags.length).toBe(SYSTEM_TAGS.length + mockCustomTags.length);
      
      // Verificar etiquetas personalizadas
      expect(tags.find(tag => tag.id === 'custom1')).toBeDefined();
      expect(tags.find(tag => tag.id === 'custom2')).toBeDefined();
    });
    
    it('maneja errores y devuelve al menos las etiquetas del sistema', () => {
      // Forzar un error en localStorage.getItem
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Error de prueba');
      });
      
      const tags = getUserTags(USER_ID);
      
      // Verificar que devuelve las etiquetas del sistema
      expect(tags.length).toBe(SYSTEM_TAGS.length);
      
      // Verificar que se registró el error en la consola
      expect(console.error).toHaveBeenCalled;
    });
  });
  
  describe('getCustomTags', () => {
    it('devuelve un array vacío si no hay etiquetas personalizadas', () => {
      const tags = getCustomTags(USER_ID);
      expect(tags).toEqual([]);
    });
    
    it('devuelve las etiquetas personalizadas del usuario', () => {
      // Configurar datos de prueba
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockCustomTags));
      
      const tags = getCustomTags(USER_ID);
      expect(tags).toEqual(mockCustomTags);
    });
    
    it('maneja errores y devuelve array vacío', () => {
      // Forzar un error en localStorage.getItem
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Error de prueba');
      });
      
      const tags = getCustomTags(USER_ID);
      expect(tags).toEqual([]);
    });
  });
  
  describe('createTag', () => {
    it('crea una nueva etiqueta correctamente', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockCustomTags));
      
      const tagName = 'Nueva Etiqueta';
      const tagColor = '#14b8a6'; // Color turquesa
      
      const newTag = createTag(USER_ID, tagName, tagColor);
      
      expect(newTag).toEqual({
        id: 'new-tag-id',
        name: tagName,
        color: tagColor,
        createdAt: expect.any(String)
      });
      
      // Verificar que se guardaron las etiquetas actualizadas
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        TAGS_STORAGE_KEY,
        expect.stringContaining(tagName)
      );
    });
    
    it('usa un color predeterminado si no se especifica', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockCustomTags));
      
      const tagName = 'Etiqueta Sin Color';
      const newTag = createTag(USER_ID, tagName);
      
      expect(newTag.color).toBe('#64748b'); // Color predeterminado
    });
    
    it('lanza error si ya existe una etiqueta con el mismo nombre', () => {
      // Configurar datos previos
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockCustomTags));
      
      // Intentar crear etiqueta con nombre existente (tanto personalizado como del sistema)
      expect(() => {
        createTag(USER_ID, 'Cliente'); // Ya existe en mockCustomTags
      }).toThrow('Ya existe una etiqueta con ese nombre');
      
      expect(() => {
        createTag(USER_ID, 'Importante'); // Ya existe en SYSTEM_TAGS
      }).toThrow('Ya existe una etiqueta con ese nombre');
      
      // Verificar que no se guardaron cambios
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteTag', () => {
    beforeEach(() => {
      // Configurar datos de etiquetas y mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === TAGS_STORAGE_KEY) {
          return JSON.stringify(mockCustomTags);
        }
        if (key === EMAIL_TAGS_MAPPING_KEY) {
          return JSON.stringify(mockEmailTagsMapping);
        }
        return null;
      });
    });
    
    it('elimina una etiqueta personalizada correctamente', () => {
      const result = deleteTag(USER_ID, 'custom1');
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se guardaron las etiquetas actualizadas (sin la etiqueta eliminada)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        TAGS_STORAGE_KEY,
        expect.not.stringContaining('Cliente')
      );
      
      // Verificar que se actualizó el mapeo de correos (sin la etiqueta eliminada)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.not.stringContaining('custom1')
      );
    });
    
    it('no permite eliminar etiquetas del sistema', () => {
      const result = deleteTag(USER_ID, 'important');
      
      // Verificar resultado
      expect(result).toBe(false);
      
      // Verificar que no se modificaron las etiquetas
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        TAGS_STORAGE_KEY,
        expect.any(String)
      );
    });
    
    it('devuelve false si la etiqueta no existe', () => {
      const result = deleteTag(USER_ID, 'etiqueta-inexistente');
      
      expect(result).toBe(false);
    });
  });
  
  describe('addTagToEmail', () => {
    beforeEach(() => {
      // Configurar datos de etiquetas y mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === TAGS_STORAGE_KEY) {
          return JSON.stringify(mockCustomTags);
        }
        if (key === EMAIL_TAGS_MAPPING_KEY) {
          return JSON.stringify(mockEmailTagsMapping);
        }
        return null;
      });
    });
    
    it('añade una etiqueta a un correo correctamente', () => {
      const emailId = 'email4'; // Correo sin etiquetas previas
      const tagId = 'work';
      
      const result = addTagToEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.stringContaining(`"${emailId}":["${tagId}"]`)
      );
    });
    
    it('añade una etiqueta a un correo que ya tiene otras', () => {
      const emailId = 'email1'; // Ya tiene etiquetas 'important' y 'custom1'
      const tagId = 'work';
      
      const result = addTagToEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo manteniendo las etiquetas previas
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.stringContaining('important')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.stringContaining('custom1')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.stringContaining('work')
      );
    });
    
    it('no añade etiquetas duplicadas', () => {
      const emailId = 'email1'; // Ya tiene la etiqueta 'important'
      const tagId = 'important';
      
      const result = addTagToEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(false); // No se añadió nada nuevo
      
      // Verificar que no se modificó el mapeo
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
    
    it('rechaza etiquetas inexistentes', () => {
      const emailId = 'email1';
      const tagId = 'etiqueta-inexistente';
      
      const result = addTagToEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(false);
      
      // Verificar que no se modificó el mapeo
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('removeTagFromEmail', () => {
    beforeEach(() => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === EMAIL_TAGS_MAPPING_KEY) {
          return JSON.stringify(mockEmailTagsMapping);
        }
        return null;
      });
    });
    
    it('elimina una etiqueta de un correo correctamente', () => {
      const emailId = 'email1'; // Tiene etiquetas 'important' y 'custom1'
      const tagId = 'important';
      
      const result = removeTagFromEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que se actualizó el mapeo (sin la etiqueta eliminada)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.not.stringContaining(`"${tagId}"`)
      );
      // Pero la otra etiqueta sigue presente
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        EMAIL_TAGS_MAPPING_KEY,
        expect.stringContaining('custom1')
      );
    });
    
    it('maneja correos sin la etiqueta especificada', () => {
      const emailId = 'email1'; // No tiene la etiqueta 'work'
      const tagId = 'work';
      
      const result = removeTagFromEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(false);
      
      // Verificar que no se modificó el mapeo
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
    
    it('maneja correos sin etiquetas', () => {
      const emailId = 'email-sin-etiquetas';
      const tagId = 'important';
      
      const result = removeTagFromEmail(USER_ID, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(false);
      
      // Verificar que no se modificó el mapeo
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('getEmailTags', () => {
    it('devuelve las etiquetas de un correo', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailTagsMapping));
      
      const emailId = 'email1';
      const tags = getEmailTags(USER_ID, emailId);
      
      expect(tags).toEqual(['important', 'custom1']);
    });
    
    it('devuelve array vacío si el correo no tiene etiquetas', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailTagsMapping));
      
      const emailId = 'email-sin-etiquetas';
      const tags = getEmailTags(USER_ID, emailId);
      
      expect(tags).toEqual([]);
    });
  });
  
  describe('getEmailTagsDetails', () => {
    beforeEach(() => {
      // Configurar datos de etiquetas y mapeo
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === TAGS_STORAGE_KEY) {
          return JSON.stringify(mockCustomTags);
        }
        if (key === EMAIL_TAGS_MAPPING_KEY) {
          return JSON.stringify(mockEmailTagsMapping);
        }
        return null;
      });
    });
    
    it('devuelve detalles completos de las etiquetas de un correo', () => {
      const emailId = 'email1'; // Tiene etiquetas 'important' y 'custom1'
      const tagsDetails = getEmailTagsDetails(USER_ID, emailId);
      
      expect(tagsDetails.length).toBe(2);
      
      // Verificar etiqueta del sistema
      const importantTag = tagsDetails.find(tag => tag.id === 'important');
      expect(importantTag).toBeDefined();
      expect(importantTag.name).toBe('Importante');
      expect(importantTag.color).toBe('#e53e3e');
      
      // Verificar etiqueta personalizada
      const customTag = tagsDetails.find(tag => tag.id === 'custom1');
      expect(customTag).toBeDefined();
      expect(customTag.name).toBe('Cliente');
      expect(customTag.color).toBe('#8b5cf6');
    });
    
    it('devuelve array vacío si el correo no tiene etiquetas', () => {
      const emailId = 'email-sin-etiquetas';
      const tagsDetails = getEmailTagsDetails(USER_ID, emailId);
      
      expect(tagsDetails).toEqual([]);
    });
  });
  
  describe('getEmailsByTag', () => {
    it('devuelve los correos que tienen una etiqueta específica', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailTagsMapping));
      
      const tagId = 'important';
      const emails = getEmailsByTag(USER_ID, tagId);
      
      expect(emails).toContain('email1');
      expect(emails.length).toBe(1);
    });
    
    it('devuelve array vacío si no hay correos con la etiqueta', () => {
      // Configurar datos de mapeo
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockEmailTagsMapping));
      
      const tagId = 'etiqueta-sin-uso';
      const emails = getEmailsByTag(USER_ID, tagId);
      
      expect(emails).toEqual([]);
    });
  });
});
