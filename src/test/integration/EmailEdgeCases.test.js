import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as EmailService from '../../services/EmailService';
import * as TagService from '../../services/TagService';

// Mock para fetch global
global.fetch = vi.fn();

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

describe('Casos límite y manejo de errores del sistema de correo', () => {
  const userId = 'user123';
  const mockProfile = {
    id: 'profile123',
    userId: 'user123',
    brideFirstName: 'María',
    brideLastName: 'García',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Inicializar el servicio con un perfil
    EmailService.initEmailService(mockProfile);
    
    // Configurar respuesta de fetch por defecto
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Casos límite de EmailService', () => {
    it('maneja correctamente emails con caracteres especiales en el asunto o cuerpo', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const specialCharEmail = {
        to: 'destinatario@example.com',
        subject: 'Símbolos especiales: áéíóúñ€$%&@#!?¿',
        body: '<p>Texto con <strong>HTML</strong> y caracteres como áéíóúñ€$%&@"\'</p>'
      };
      
      const result = await EmailService.sendMail(specialCharEmail);
      expect(result.success).toBe(true);
      
      // Verificar que se guardó correctamente
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].subject).toBe(specialCharEmail.subject);
      expect(saved[0].body).toBe(specialCharEmail.body);
    });

    it('maneja correctamente emails sin asunto', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const noSubjectEmail = {
        to: 'destinatario@example.com',
        subject: '',
        body: '<p>Correo sin asunto</p>'
      };
      
      const result = await EmailService.sendMail(noSubjectEmail);
      expect(result.success).toBe(true);
      
      // Verificar que se guardó con "(Sin asunto)" o similar
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].subject).toBe('(Sin asunto)');
    });

    it('maneja correctamente emails con adjuntos muy grandes', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      // Simular un archivo adjunto de 25MB (por encima del límite típico)
      const largeAttachment = {
        filename: 'archivo_grande.pdf',
        size: 25 * 1024 * 1024, // 25MB
        content: 'base64-encoded-content'
      };
      
      const emailWithLargeAttachment = {
        to: 'destinatario@example.com',
        subject: 'Adjunto grande',
        body: '<p>Correo con adjunto grande</p>',
        attachments: [largeAttachment]
      };
      
      // El servicio debería validar el tamaño y rechazar adjuntos muy grandes
      await expect(EmailService.sendMail(emailWithLargeAttachment))
        .rejects.toThrow(/tamaño máximo|demasiado grande/i);
    });

    it('gestiona fallos de red al enviar correos', async () => {
      // Configurar para usar backend con error de red
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular error de red
      global.fetch.mockRejectedValueOnce(new Error('Error de conexión de red'));
      
      const email = {
        to: 'destinatario@example.com',
        subject: 'Prueba de red',
        body: '<p>Contenido de prueba</p>'
      };
      
      // El servicio debería intentar usar localStorage como fallback
      const result = await EmailService.sendMail(email);
      
      // Verificar que usó el fallback y el email se guardó localmente
      expect(result.success).toBe(true);
      expect(result.usingFallback).toBe(true);
      
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved).toHaveLength(1);
      expect(saved[0].subject).toBe('Prueba de red');
    });
    
    it('gestiona respuestas de error del servidor', async () => {
      // Configurar para usar backend con error del servidor
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular respuesta de error del servidor
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Error interno del servidor' })
      });
      
      const email = {
        to: 'destinatario@example.com',
        subject: 'Prueba de servidor',
        body: '<p>Contenido de prueba</p>'
      };
      
      // El servicio debería manejar el error y usar fallback
      const result = await EmailService.sendMail(email);
      
      expect(result.success).toBe(true);
      expect(result.usingFallback).toBe(true);
    });
    
    it('gestiona direcciones de correo malformadas', async () => {
      const invalidEmailAddress = {
        to: 'esto-no-es-un-email',
        subject: 'Correo inválido',
        body: '<p>Contenido de prueba</p>'
      };
      
      // El servicio debería rechazar la dirección inválida
      await expect(EmailService.sendMail(invalidEmailAddress))
        .rejects.toThrow(/dirección no válida|email inválido/i);
    });
  });

  describe('Casos límite de TagService', () => {
    it('maneja correctamente nombres de etiquetas con caracteres especiales', () => {
      const specialCharTagName = 'Etiqueta áéíóúñ€$%&@#!?¿';
      const tag = TagService.createTag(userId, specialCharTagName, '#8B5CF6');
      
      expect(tag.name).toBe(specialCharTagName);
      
      // Verificar que se guardó correctamente
      const savedTags = TagService.getCustomTags(userId);
      expect(savedTags[0].name).toBe(specialCharTagName);
    });

    it('maneja correctamente nombres de etiquetas muy largos', () => {
      const longTagName = 'A'.repeat(100); // Nombre extremadamente largo
      const tag = TagService.createTag(userId, longTagName, '#8B5CF6');
      
      // Verificar que se truncó o se manejó apropiadamente
      expect(tag.name.length).toBeLessThanOrEqual(50); // Asumiendo un límite de 50 caracteres
    });

    it('gestiona múltiples operaciones simultáneas de etiquetado', () => {
      // Crear varias etiquetas
      const tag1 = TagService.createTag(userId, 'Etiqueta 1');
      const tag2 = TagService.createTag(userId, 'Etiqueta 2');
      const tag3 = TagService.createTag(userId, 'Etiqueta 3');
      
      // Aplicar múltiples etiquetas a varios correos
      const emailId1 = 'email1';
      const emailId2 = 'email2';
      
      // Operaciones simultáneas
      TagService.addTagToEmail(userId, emailId1, tag1.id);
      TagService.addTagToEmail(userId, emailId1, tag2.id);
      TagService.addTagToEmail(userId, emailId2, tag2.id);
      TagService.addTagToEmail(userId, emailId2, tag3.id);
      
      // Verificar que todas las etiquetas se aplicaron correctamente
      const email1Tags = TagService.getEmailTags(userId, emailId1);
      expect(email1Tags).toContain(tag1.id);
      expect(email1Tags).toContain(tag2.id);
      
      const email2Tags = TagService.getEmailTags(userId, emailId2);
      expect(email2Tags).toContain(tag2.id);
      expect(email2Tags).toContain(tag3.id);
    });

    it('gestiona errores de almacenamiento local', () => {
      // Simular error en localStorage.setItem
      localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Error de almacenamiento');
      });
      
      // Intentar crear una etiqueta
      expect(() => TagService.createTag(userId, 'Etiqueta prueba'))
        .not.toThrow();
      
      // El servicio debería capturar el error y no propagarlo
    });
  });

  describe('Pruebas de integración de casos límite', () => {
    it('gestiona correctamente la eliminación de una etiqueta asignada a múltiples correos', () => {
      // Crear una etiqueta
      const tag = TagService.createTag(userId, 'Etiqueta compartida');
      
      // Asignarla a varios correos
      const emailIds = ['email1', 'email2', 'email3'];
      emailIds.forEach(emailId => {
        TagService.addTagToEmail(userId, emailId, tag.id);
      });
      
      // Verificar que se asignó correctamente
      emailIds.forEach(emailId => {
        const tags = TagService.getEmailTags(userId, emailId);
        expect(tags).toContain(tag.id);
      });
      
      // Eliminar la etiqueta
      TagService.deleteTag(userId, tag.id);
      
      // Verificar que se eliminó de todos los correos
      emailIds.forEach(emailId => {
        const tags = TagService.getEmailTags(userId, emailId);
        expect(tags).not.toContain(tag.id);
      });
    });

    it('mantiene la consistencia al reintentar operaciones fallidas', async () => {
      // Configurar para usar backend con fallo intermitente
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Primer intento falla
      global.fetch.mockRejectedValueOnce(new Error('Error de conexión'));
      
      // Segundo intento funciona
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { id: 'msg123' } })
      });
      
      const email = {
        to: 'destinatario@example.com',
        subject: 'Prueba de reintento',
        body: '<p>Contenido de prueba</p>'
      };
      
      // Primer envío - debería fallar y usar fallback
      await EmailService.sendMail(email);
      
      // Crear una etiqueta
      const tag = TagService.createTag(userId, 'Etiqueta importante');
      
      // Etiquetar el correo guardado localmente
      const localMails = JSON.parse(localStorage.getItem('mywed360_mails'));
      const localEmailId = localMails[0].id;
      TagService.addTagToEmail(userId, localEmailId, tag.id);
      
      // Verificar que se etiquetó correctamente
      const emailTags = TagService.getEmailTags(userId, localEmailId);
      expect(emailTags).toContain(tag.id);
      
      // Segundo envío - debería tener éxito con la API
      const result = await EmailService.sendMail(email);
      expect(result.success).toBe(true);
      expect(result.usingFallback).toBeFalsy();
    });
  });
});
