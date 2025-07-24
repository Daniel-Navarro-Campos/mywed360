import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as TagService from '../../services/TagService';

// Mock para localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('TagService', () => {
  const userId = 'user123';
  
  // Datos de ejemplo para pruebas
  const mockCustomTag = {
    name: 'Proyecto Boda',
    color: '#8B5CF6'
  };
  
  const mockEmailId = 'email123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserTags', () => {
    it('devuelve etiquetas del sistema + personalizadas', () => {
      // Crear algunas etiquetas personalizadas para el usuario
      const customTags = [
        { id: 'custom1', name: 'Familia', color: '#F59E0B' },
        { id: 'custom2', name: 'Urgente', color: '#EF4444' }
      ];
      
      // Guardar en localStorage
      localStorage.setItem(
        `lovenda_email_tags_${userId}`, 
        JSON.stringify(customTags)
      );
      
      // Obtener todas las etiquetas
      const tags = TagService.getUserTags(userId);
      
      // Verificar que incluye etiquetas del sistema y personalizadas
      expect(tags.length).toBe(TagService.SYSTEM_TAGS.length + customTags.length);
      expect(tags.find(tag => tag.id === 'important')).toBeDefined(); // Sistema
      expect(tags.find(tag => tag.id === 'custom1')).toBeDefined(); // Personalizada
    });

    it('devuelve solo etiquetas del sistema si no hay personalizadas', () => {
      const tags = TagService.getUserTags(userId);
      
      // Verificar que solo hay etiquetas del sistema
      expect(tags.length).toBe(TagService.SYSTEM_TAGS.length);
      expect(tags.every(tag => TagService.SYSTEM_TAGS.some(st => st.id === tag.id))).toBe(true);
    });

    it('maneja errores y devuelve etiquetas del sistema', () => {
      // Simular un error en localStorage
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Error simulado');
      });
      
      const tags = TagService.getUserTags(userId);
      
      // Debe devolver al menos las etiquetas del sistema
      expect(tags.length).toBe(TagService.SYSTEM_TAGS.length);
    });
  });

  describe('getCustomTags', () => {
    it('devuelve solo etiquetas personalizadas', () => {
      // Crear etiquetas personalizadas
      const customTags = [
        { id: 'custom1', name: 'Familia', color: '#F59E0B' }
      ];
      
      // Guardar en localStorage
      localStorage.setItem(
        `lovenda_email_tags_${userId}`, 
        JSON.stringify(customTags)
      );
      
      const tags = TagService.getCustomTags(userId);
      
      // Verificar que solo devuelve etiquetas personalizadas
      expect(tags).toEqual(customTags);
    });

    it('devuelve array vacío si no hay etiquetas personalizadas', () => {
      const tags = TagService.getCustomTags(userId);
      expect(tags).toEqual([]);
    });
  });

  describe('createTag', () => {
    it('crea una nueva etiqueta personalizada', () => {
      const newTag = TagService.createTag(
        userId, 
        mockCustomTag.name, 
        mockCustomTag.color
      );
      
      // Verificar propiedades del tag creado
      expect(newTag).toHaveProperty('id');
      expect(newTag.name).toBe(mockCustomTag.name);
      expect(newTag.color).toBe(mockCustomTag.color);
      
      // Verificar que se guardó en localStorage
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Verificar que se puede recuperar
      const savedTags = TagService.getCustomTags(userId);
      expect(savedTags).toHaveLength(1);
      expect(savedTags[0].id).toBe(newTag.id);
    });

    it('usa un color por defecto si no se especifica', () => {
      const newTag = TagService.createTag(userId, 'Etiqueta sin color');
      expect(newTag.color).toBe('#64748b'); // Color por defecto
    });

    it('maneja nombres duplicados agregando un sufijo', () => {
      // Crear primera etiqueta
      const tag1 = TagService.createTag(userId, 'Duplicada');
      
      // Crear segunda etiqueta con el mismo nombre
      const tag2 = TagService.createTag(userId, 'Duplicada');
      
      // Verificar que los nombres son diferentes pero relacionados
      expect(tag1.name).toBe('Duplicada');
      expect(tag2.name).toBe('Duplicada (1)');
      
      // Crear una tercera etiqueta con el mismo nombre
      const tag3 = TagService.createTag(userId, 'Duplicada');
      expect(tag3.name).toBe('Duplicada (2)');
    });
  });

  describe('deleteTag', () => {
    let customTagId;
    
    beforeEach(() => {
      // Crear una etiqueta para eliminarla después
      const newTag = TagService.createTag(
        userId, 
        mockCustomTag.name, 
        mockCustomTag.color
      );
      customTagId = newTag.id;
      
      // Limpiar mocks después de crear
      vi.clearAllMocks();
    });

    it('elimina una etiqueta personalizada', () => {
      const result = TagService.deleteTag(userId, customTagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que la etiqueta ya no existe
      const savedTags = TagService.getCustomTags(userId);
      expect(savedTags.find(tag => tag.id === customTagId)).toBeUndefined();
    });

    it('no permite eliminar etiquetas del sistema', () => {
      // Intentar eliminar una etiqueta del sistema debe lanzar un error
      expect(() => TagService.deleteTag(userId, 'important')).toThrow('No se pueden eliminar etiquetas del sistema');
    });

    it('quita la etiqueta de todos los correos al eliminarla', () => {
      // Asignar la etiqueta a un correo
      TagService.addTagToEmail(userId, mockEmailId, customTagId);
      
      // Verificar que está asignada
      let emailTags = TagService.getEmailTags(userId, mockEmailId);
      expect(emailTags).toContain(customTagId);
      
      // Eliminar la etiqueta
      TagService.deleteTag(userId, customTagId);
      
      // Verificar que ya no está asignada al correo
      emailTags = TagService.getEmailTags(userId, mockEmailId);
      expect(emailTags).not.toContain(customTagId);
    });
  });

  describe('addTagToEmail y removeTagFromEmail', () => {
    const emailId = 'email123';
    let tagId;
    
    beforeEach(() => {
      // Crear una etiqueta de prueba
      const newTag = TagService.createTag(
        userId, 
        mockCustomTag.name, 
        mockCustomTag.color
      );
      tagId = newTag.id;
      
      // Limpiar mocks después de crear
      vi.clearAllMocks();
    });

    it('asigna una etiqueta a un correo', () => {
      const result = TagService.addTagToEmail(userId, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que la etiqueta está asignada
      const emailTags = TagService.getEmailTags(userId, emailId);
      expect(emailTags).toContain(tagId);
    });

    it('elimina una etiqueta de un correo', () => {
      // Primero agregar la etiqueta
      TagService.addTagToEmail(userId, emailId, tagId);
      
      // Luego quitarla
      const result = TagService.removeTagFromEmail(userId, emailId, tagId);
      
      // Verificar resultado
      expect(result).toBe(true);
      
      // Verificar que la etiqueta ya no está asignada
      const emailTags = TagService.getEmailTags(userId, emailId);
      expect(emailTags).not.toContain(tagId);
    });

    it('no duplica etiquetas al asignarlas varias veces', () => {
      // Asignar la misma etiqueta dos veces
      TagService.addTagToEmail(userId, emailId, tagId);
      TagService.addTagToEmail(userId, emailId, tagId);
      
      // Verificar que solo hay una instancia
      const emailTags = TagService.getEmailTags(userId, emailId);
      expect(emailTags.filter(id => id === tagId)).toHaveLength(1);
    });
  });

  describe('getEmailTagsDetails', () => {
    const emailId = 'email123';
    let customTag;
    
    beforeEach(() => {
      // Crear una etiqueta personalizada
      customTag = TagService.createTag(
        userId, 
        mockCustomTag.name, 
        mockCustomTag.color
      );
      
      // Asignar una etiqueta del sistema y la personalizada
      TagService.addTagToEmail(userId, emailId, 'important'); // Sistema
      TagService.addTagToEmail(userId, emailId, customTag.id); // Personalizada
      
      // Limpiar mocks después de crear
      vi.clearAllMocks();
    });

    it('devuelve detalles completos de las etiquetas asignadas', () => {
      const tagDetails = TagService.getEmailTagsDetails(userId, emailId);
      
      // Verificar que hay 2 etiquetas
      expect(tagDetails).toHaveLength(2);
      
      // Verificar que cada etiqueta tiene todos los detalles
      const systemTag = tagDetails.find(tag => tag.id === 'important');
      const userTag = tagDetails.find(tag => tag.id === customTag.id);
      
      expect(systemTag).toHaveProperty('name');
      expect(systemTag).toHaveProperty('color');
      expect(systemTag.name).toBe('Importante');
      
      expect(userTag).toHaveProperty('name');
      expect(userTag).toHaveProperty('color');
      expect(userTag.name).toBe(mockCustomTag.name);
    });

    it('devuelve array vacío si el correo no tiene etiquetas', () => {
      const tagDetails = TagService.getEmailTagsDetails(userId, 'email-sin-tags');
      expect(tagDetails).toEqual([]);
    });
  });

  describe('addTagToEmail', () => {
    let customTagId;
    
    beforeEach(() => {
      // Crear una etiqueta para asignarla a correos
      const newTag = TagService.createTag(userId, 'Tag prueba', '#FF0000');
      customTagId = newTag.id;
    });

    it('asigna correctamente una etiqueta a un correo', () => {
      const result = TagService.addTagToEmail(userId, mockEmailId, customTagId);
      
      expect(result).toBe(true);
      
      // Verificar que la etiqueta está asignada al correo
      const emailTags = TagService.getEmailTags(userId, mockEmailId);
      expect(emailTags).toContain(customTagId);
    });

    it('no asigna etiquetas duplicadas al mismo correo', () => {
      // Asignar la primera vez
      TagService.addTagToEmail(userId, mockEmailId, customTagId);
      
      // Intentar asignar de nuevo la misma etiqueta
      const result = TagService.addTagToEmail(userId, mockEmailId, customTagId);
      
      // Debe indicar éxito pero sin duplicar
      expect(result).toBe(true);
      
      // Verificar que la etiqueta aparece solo una vez
      const emailTags = TagService.getEmailTags(userId, mockEmailId);
      const occurrences = emailTags.filter(id => id === customTagId).length;
      expect(occurrences).toBe(1);
    });

    it('rechaza asignar etiquetas que no existen', () => {
      // Intentar asignar una etiqueta que no existe
      expect(() => TagService.addTagToEmail(userId, mockEmailId, 'tag-inexistente'))
        .toThrow('La etiqueta especificada no existe');
    });
  });

  describe('removeTagFromEmail', () => {
    let customTagId;
    
    beforeEach(() => {
      // Crear una etiqueta para las pruebas
      const newTag = TagService.createTag(userId, 'Tag prueba', '#FF0000');
      customTagId = newTag.id;
      
      // Asignarla a un correo
      TagService.addTagToEmail(userId, mockEmailId, customTagId);
    });

    it('quita correctamente una etiqueta de un correo', () => {
      const result = TagService.removeTagFromEmail(userId, mockEmailId, customTagId);
      
      expect(result).toBe(true);
      
      // Verificar que la etiqueta ya no está asignada
      const emailTags = TagService.getEmailTags(userId, mockEmailId);
      expect(emailTags).not.toContain(customTagId);
    });

    it('maneja correctamente intentos de quitar etiquetas no asignadas', () => {
      // Quitar una etiqueta de un correo que no la tiene
      const result = TagService.removeTagFromEmail(userId, 'email-diferente', customTagId);
      
      // Debe indicar éxito aunque no había nada que quitar
      expect(result).toBe(true);
    });
  });

  describe('removeTagFromAllEmails', () => {
    let customTagId;
    const emailIds = ['email1', 'email2', 'email3'];
    
    beforeEach(() => {
      // Crear una etiqueta para las pruebas
      const newTag = TagService.createTag(userId, 'Tag prueba', '#FF0000');
      customTagId = newTag.id;
      
      // Asignarla a varios correos
      emailIds.forEach(emailId => {
        TagService.addTagToEmail(userId, emailId, customTagId);
      });
    });

    it('quita una etiqueta de todos los correos', () => {
      // Este método es privado pero se usa en deleteTag
      // Lo hacemos accesible para la prueba
      const result = TagService.removeTagFromAllEmails(userId, customTagId);
      
      expect(result).toBe(true);
      
      // Verificar que ningún correo tiene la etiqueta
      emailIds.forEach(emailId => {
        const tags = TagService.getEmailTags(userId, emailId);
        expect(tags).not.toContain(customTagId);
      });
    });
  });

  describe('getEmailTags', () => {
    let tagId1, tagId2;
    
    beforeEach(() => {
      // Crear dos etiquetas para las pruebas
      const tag1 = TagService.createTag(userId, 'Tag 1', '#FF0000');
      const tag2 = TagService.createTag(userId, 'Tag 2', '#00FF00');
      tagId1 = tag1.id;
      tagId2 = tag2.id;
      
      // Asignar ambas etiquetas al correo de prueba
      TagService.addTagToEmail(userId, mockEmailId, tagId1);
      TagService.addTagToEmail(userId, mockEmailId, tagId2);
    });

    it('obtiene todas las etiquetas asignadas a un correo', () => {
      const tags = TagService.getEmailTags(userId, mockEmailId);
      
      expect(tags).toHaveLength(2);
      expect(tags).toContain(tagId1);
      expect(tags).toContain(tagId2);
    });

    it('devuelve array vacío para correos sin etiquetas', () => {
      const tags = TagService.getEmailTags(userId, 'email-sin-tags');
      expect(tags).toEqual([]);
    });
  });

  describe('getEmailTagsDetails', () => {
    let tagId1, tagId2;
    
    beforeEach(() => {
      // Crear dos etiquetas para las pruebas
      const tag1 = TagService.createTag(userId, 'Tag 1', '#FF0000');
      const tag2 = TagService.createTag(userId, 'Tag 2', '#00FF00');
      tagId1 = tag1.id;
      tagId2 = tag2.id;
      
      // Asignar ambas etiquetas al correo de prueba
      TagService.addTagToEmail(userId, mockEmailId, tagId1);
      TagService.addTagToEmail(userId, mockEmailId, tagId2);
      
      // También asignar una etiqueta del sistema
      TagService.addTagToEmail(userId, mockEmailId, 'important');
    });

    it('obtiene detalles completos de las etiquetas asignadas a un correo', () => {
      const tagDetails = TagService.getEmailTagsDetails(userId, mockEmailId);
      
      // Debe contener 3 etiquetas: 2 personalizadas + 1 del sistema
      expect(tagDetails).toHaveLength(3);
      
      // Verificar que cada etiqueta tiene sus detalles completos
      const tag1Details = tagDetails.find(t => t.id === tagId1);
      expect(tag1Details).toBeDefined();
      expect(tag1Details.name).toBe('Tag 1');
      expect(tag1Details.color).toBe('#FF0000');
      
      // Verificar etiqueta del sistema
      const importantTag = tagDetails.find(t => t.id === 'important');
      expect(importantTag).toBeDefined();
      expect(importantTag.name).toBe('Importante');
    });

    it('devuelve array vacío para correos sin etiquetas', () => {
      const tagDetails = TagService.getEmailTagsDetails(userId, 'email-sin-tags');
      expect(tagDetails).toEqual([]);
    });
  });

  describe('getEmailsByTag', () => {
    const emailId1 = 'email1';
    const emailId2 = 'email2';
    let tagId;
    
    beforeEach(() => {
      // Crear una etiqueta
      const newTag = TagService.createTag(
        userId, 
        mockCustomTag.name, 
        mockCustomTag.color
      );
      tagId = newTag.id;
      
      // Asignar etiqueta a ambos correos
      TagService.addTagToEmail(userId, emailId1, tagId);
      TagService.addTagToEmail(userId, emailId2, tagId);
      
      // Limpiar mocks después de crear
      vi.clearAllMocks();
    });

    it('devuelve todos los correos con una etiqueta específica', () => {
      const emails = TagService.getEmailsByTag(userId, tagId);
      
      // Verificar que ambos correos tienen la etiqueta
      expect(emails).toContain(emailId1);
      expect(emails).toContain(emailId2);
      expect(emails).toHaveLength(2);
    });

    it('devuelve array vacío si ningún correo tiene la etiqueta', () => {
      const emails = TagService.getEmailsByTag(userId, 'tag-inexistente');
      expect(emails).toEqual([]);
    });
  });
});
