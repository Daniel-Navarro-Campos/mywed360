import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as EmailService from '../../services/EmailService';

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

// Mock para import.meta.env
vi.mock('../../services/EmailService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Variables de entorno simuladas
    BASE: 'https://api.test.lovenda.com',
    MAILGUN_API_KEY: 'key-test123456789',
    MAILGUN_DOMAIN: 'test.lovenda.com',
    USE_MAILGUN: true,
    USE_BACKEND: false,
    MAX_ATTACHMENT_SIZE_MB: 10 // 10MB límite para pruebas
  };
});

describe('EmailService - Casos Límite y Manejo de Errores', () => {
  const mockProfile = {
    id: 'profile123',
    userId: 'user123',
    brideFirstName: 'María',
    brideLastName: 'García',
    emailAlias: '',
  };

  const mockEmail = {
    id: 'email123',
    from: 'remitente@example.com',
    to: 'usuario@test.lovenda.com',
    subject: 'Asunto de prueba',
    body: '<p>Contenido de prueba</p>',
    date: '2025-07-10T10:00:00Z',
    folder: 'inbox',
    read: false,
    attachments: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Configurar respuesta de fetch por defecto
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} })
    });
    
    // Inicializar servicio con usuario
    EmailService.initEmailService(mockProfile);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Emails malformados', () => {
    it('maneja correos sin campos obligatorios', async () => {
      // Email sin destinatario ni asunto
      const invalidEmail = {
        body: '<p>Contenido sin destinatario ni asunto</p>'
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);

      // Intentar enviar correo sin campos obligatorios
      const result = await EmailService.sendMail(invalidEmail);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain('Destinatario es obligatorio');
    });

    it('sanitiza contenido HTML potencialmente peligroso', async () => {
      // Email con script malicioso
      const emailWithScript = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: '<p>Contenido normal</p><script>alert("XSS attack")</script>'
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithScript);
      
      // Verificar que se guardó correctamente
      expect(result.success).toBe(true);
      
      // Obtener el correo guardado y verificar que se sanitizó el contenido
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].body).not.toContain('<script>');
      expect(saved[0].body).toContain('Contenido normal');
    });

    it('maneja correos con campos excesivamente largos', async () => {
      // Email con asunto muy largo (>255 caracteres)
      const veryLongSubject = 'A'.repeat(300);
      const emailWithLongSubject = {
        to: 'destinatario@example.com',
        subject: veryLongSubject,
        body: '<p>Contenido de prueba</p>'
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithLongSubject);
      
      // Verificar que se guardó correctamente pero se truncó el asunto
      expect(result.success).toBe(true);
      
      // Obtener el correo guardado y verificar que se truncó el asunto
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].subject.length).toBeLessThanOrEqual(255);
    });

    it('rechaza emails con demasiados destinatarios', async () => {
      // Generar muchos destinatarios (>50)
      const tooManyRecipients = Array(51).fill(0).map((_, i) => `recipient${i}@example.com`).join(', ');
      
      const emailWithManyRecipients = {
        to: tooManyRecipients,
        subject: 'Asunto de prueba',
        body: '<p>Contenido de prueba</p>'
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithManyRecipients);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('demasiados destinatarios');
    });
  });

  describe('Manejo de errores de red', () => {
    it('maneja errores de red en getMails', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular error de red
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Guardar emails en localStorage como fallback
      localStorage.setItem('mywed360_mails', JSON.stringify([mockEmail]));
      
      // Debería usar los datos locales como fallback
      const result = await EmailService.getMails('inbox');
      
      expect(result).toEqual([mockEmail]);
    });

    it('maneja errores de red en sendMail con Mailgun', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(true);
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      // Simular error de red en sendMailWithMailgun
      vi.spyOn(EmailService, 'sendMailWithMailgun')
        .mockRejectedValueOnce(new Error('Error de conexión'));
      
      const result = await EmailService.sendMail(mailData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error de conexión');
    });

    it('maneja errores de red en sendMail con backend', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular error de red
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      const result = await EmailService.sendMail(mailData);
      
      // Verifica que detecta el error
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      
      // Verifica que intenta guardar localmente como fallback
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('maneja timeout en solicitudes a la API', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular un timeout 
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });
      
      global.fetch.mockImplementationOnce(() => timeoutPromise);
      
      // Guardar emails en localStorage como fallback
      localStorage.setItem('mywed360_mails', JSON.stringify([mockEmail]));
      
      const result = await EmailService.getMails('inbox');
      
      // Debería usar los datos locales como fallback
      expect(result).toEqual([mockEmail]);
    });
  });

  describe('Límites de tamaño en adjuntos', () => {
    it('rechaza adjuntos que exceden el tamaño máximo', async () => {
      // Crear un email con adjunto que excede el límite
      const largeAttachment = {
        name: 'archivo_grande.pdf',
        type: 'application/pdf',
        size: 15 * 1024 * 1024, // 15MB (mayor al límite de 10MB)
        content: 'base64data...'
      };
      
      const emailWithLargeAttachment = {
        to: 'destinatario@example.com',
        subject: 'Email con adjunto grande',
        body: '<p>Contenido de prueba</p>',
        attachments: [largeAttachment]
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithLargeAttachment);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('tamaño máximo');
    });

    it('rechaza cuando el tamaño total de adjuntos excede el límite', async () => {
      // Crear un email con múltiples adjuntos que juntos exceden el límite
      const attachment1 = {
        name: 'archivo1.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024, // 6MB
        content: 'base64data1...'
      };
      
      const attachment2 = {
        name: 'archivo2.pdf',
        type: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
        content: 'base64data2...'
      };
      
      const attachment3 = {
        name: 'archivo3.pdf',
        type: 'application/pdf',
        size: 1 * 1024 * 1024, // 1MB
        content: 'base64data3...'
      };
      
      // Total: 12MB, excede el límite de 10MB
      const emailWithMultipleAttachments = {
        to: 'destinatario@example.com',
        subject: 'Email con múltiples adjuntos',
        body: '<p>Contenido de prueba</p>',
        attachments: [attachment1, attachment2, attachment3]
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithMultipleAttachments);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('tamaño máximo');
    });

    it('acepta adjuntos que cumplen con el límite de tamaño', async () => {
      // Crear un email con adjunto dentro del límite
      const validAttachment = {
        name: 'archivo_valido.pdf',
        type: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB (dentro del límite)
        content: 'base64data...'
      };
      
      const emailWithValidAttachment = {
        to: 'destinatario@example.com',
        subject: 'Email con adjunto válido',
        body: '<p>Contenido de prueba</p>',
        attachments: [validAttachment]
      };

      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.sendMail(emailWithValidAttachment);
      
      expect(result.success).toBe(true);
      
      // Verificar que el adjunto se guardó correctamente
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].attachments).toHaveLength(1);
      expect(saved[0].attachments[0].name).toBe('archivo_valido.pdf');
    });
  });

  describe('Estados de carga y error', () => {
    it('maneja respuestas 404 en getMail', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular respuesta 404
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, message: 'Email no encontrado' })
      });
      
      try {
        await EmailService.getMail('nonexistent123');
        // Si no lanza excepción, fallamos el test
        expect(true).toBe(false); 
      } catch (error) {
        expect(error.message).toContain('no encontrado');
        expect(error.status).toBe(404);
      }
    });

    it('maneja errores 500 del servidor', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular error del servidor
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Error interno del servidor' })
      });
      
      // Guardar emails en localStorage como fallback
      localStorage.setItem('mywed360_mails', JSON.stringify([mockEmail]));
      
      const result = await EmailService.getMails('inbox');
      
      // Debería usar los datos locales como fallback
      expect(result).toEqual([mockEmail]);
    });

    it('maneja correctamente respuestas de servidor sin formato JSON válido', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular respuesta con JSON inválido
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });
      
      // Guardar emails en localStorage como fallback
      localStorage.setItem('mywed360_mails', JSON.stringify([mockEmail]));
      
      const result = await EmailService.getMails('inbox');
      
      // Debería usar los datos locales como fallback
      expect(result).toEqual([mockEmail]);
    });

    it('maneja errores de autenticación (401)', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular error de autenticación
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, message: 'No autorizado' })
      });
      
      try {
        await EmailService.sendMail({
          to: 'destinatario@example.com',
          subject: 'Prueba',
          body: 'Contenido'
        });
        // Si no lanza excepción, fallamos el test
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('No autorizado');
        expect(error.status).toBe(401);
      }
    });

    it('maneja respuestas exitosas pero con error en el cuerpo', async () => {
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Simular respuesta 200 pero con error en el cuerpo
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false, message: 'Error de negocio' })
      });
      
      const result = await EmailService.sendMail({
        to: 'destinatario@example.com',
        subject: 'Prueba',
        body: 'Contenido'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error de negocio');
    });
  });
});
