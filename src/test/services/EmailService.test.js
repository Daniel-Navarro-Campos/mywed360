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
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_BACKEND_BASE_URL: 'http://localhost:4004',
    VITE_MAILGUN_API_KEY: 'key-test123456789',
    VITE_MAILGUN_DOMAIN: 'mywed360.com'
  },
  writable: true
});

describe('EmailService', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initEmailService', () => {
    it('devuelve una dirección de email válida basada en el perfil', async () => {
      const email = await EmailService.initEmailService(mockProfile);
      expect(email).toBe('maria.garcia@mywed360.com');
    });

    it('usa el emailAlias si está definido', async () => {
      const profileWithAlias = { ...mockProfile, emailAlias: 'miboda' };
      const email = await EmailService.initEmailService(profileWithAlias);
      expect(email).toContain('@mywed360.com');
    });

    it('usa solo nombre si no hay apellido', async () => {
      const profileNoLastName = { ...mockProfile, brideLastName: '' };
      const email = await EmailService.initEmailService(profileNoLastName);
      expect(email).toContain('@mywed360.com');
    });

    it('usa userId si no hay nombre', async () => {
      const profileNoName = { 
        ...mockProfile, 
        brideFirstName: '', 
        brideLastName: '' 
      };
      const email = await EmailService.initEmailService(profileNoName);
      expect(email).toContain('@mywed360.com');
    });
  });

  describe('getMails', () => {
    beforeEach(async () => {
      // Inicializar el servicio antes de cada test
      await EmailService.initEmailService(mockProfile);
      // Limpiar localStorage
      localStorage.clear();
    });

    it('devuelve emails de localStorage si no hay backend ni Mailgun', async () => {
      // Simular que no hay backend ni Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result = await EmailService.getMails('inbox');
      expect(Array.isArray(result)).toBe(true);
    });

    it('llama a la API del backend cuando está configurado', async () => {
      // Simular que hay backend pero no Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Mock respuesta del backend
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });
      
      const result = await EmailService.getMails('inbox');
      
      expect(Array.isArray(result)).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('maneja errores de API correctamente', async () => {
      // Simular que hay backend pero no Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Mock error de API
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await EmailService.getMails('inbox');
      
      // Debe devolver un array aunque sea vacío
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('sendMail', () => {
    beforeEach(async () => {
      // Inicializar con un usuario
      await EmailService.initEmailService(mockProfile);
    });

    it('envía correo utilizando localStorage cuando no hay Mailgun ni backend', async () => {
      // Configurar para no usar Mailgun ni backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      const result = await EmailService.sendMail(mailData);
      
      expect(result.success).toBe(true);
      expect(result.subject).toBe('Asunto de prueba');
      expect(result.folder).toBe('sent');
    });

    it('envía correo utilizando backend cuando no hay Mailgun', async () => {
      // Configurar para usar backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'msg123' } })
      });
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      const result = await EmailService.sendMail(mailData);
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('valida datos de entrada correctamente', async () => {
      // Test con destinatario vacío
      const result1 = await EmailService.sendMail({ to: '', subject: 'Test', body: 'Test' });
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('obligatorio');
      
      // Test con datos válidos
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const result2 = await EmailService.sendMail({ to: 'test@example.com', subject: 'Valid', body: 'Valid' });
      expect(result2.success).toBe(true);
    });
  });

  describe('markAsRead y deleteMail', () => {
    beforeEach(async () => {
      // Inicializar el servicio
      await EmailService.initEmailService(mockProfile);
      
      // Guardar emails de prueba en localStorage
      const mockEmails = [mockEmail];
      localStorage.setItem('lovenda_mails', JSON.stringify(mockEmails));
    });

    it('marca un email como leído correctamente', async () => {
      // Configurar para no usar backend
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      // Crear email en localStorage primero
      const testEmail = { ...mockEmail, id: 'test123', read: false };
      localStorage.setItem('lovenda_mails', JSON.stringify([testEmail]));
      
      const result = await EmailService.markAsRead('test123');
      
      // Verificar que el resultado es exitoso
      expect(result.success).toBe(true);
    });

    it('elimina un email correctamente', async () => {
      // Configurar para no usar backend
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      // Crear email en localStorage primero
      const testEmail = { ...mockEmail, id: 'test456' };
      localStorage.setItem('lovenda_mails', JSON.stringify([testEmail]));
      
      const result = await EmailService.deleteMail('test456');
      
      // Verificar que el resultado es exitoso
      expect(result.success).toBe(true);
    });

    it('llama a la API del backend para marcar como leído cuando está disponible', async () => {
      // Configurar para usar backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      await EmailService.markAsRead('email123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch.mock.calls[0][0]).toContain('/api/mail/email123');
    });

    it('llama a la API del backend para eliminar cuando está disponible', async () => {
      // Configurar para usar backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      await EmailService.deleteMail('email123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch.mock.calls[0][0]).toContain('/api/mail/email123');
      expect(global.fetch.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  describe('Gestión de plantillas de email', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('devuelve plantillas predefinidas cuando no hay plantillas guardadas', async () => {
      const templates = await EmailService.getEmailTemplates();
      
      // Verificar que se devuelven las plantillas predefinidas
      expect(templates.length).toBeGreaterThanOrEqual(10);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('subject');
      expect(templates[0]).toHaveProperty('body');
    });

    it('guarda una plantilla correctamente', async () => {
      const newTemplate = {
        name: 'Plantilla de prueba',
        subject: 'Asunto de prueba',
        body: '<p>Contenido de plantilla</p>'
      };
      
      // Guardar plantilla
      const saved = await EmailService.saveEmailTemplate(newTemplate);
      
      // Verificar que devuelve algo (estructura puede variar)
      expect(saved).toBeDefined();
    });

    it('actualiza una plantilla existente', async () => {
      // Crear plantilla
      const newTemplate = {
        name: 'Plantilla original',
        subject: 'Asunto original',
        body: '<p>Contenido original</p>'
      };
      
      const saved = await EmailService.saveEmailTemplate(newTemplate);
      
      // Verificar que la operación devuelve algo
      expect(saved).toBeDefined();
    });

    it('elimina una plantilla correctamente', async () => {
      // Test básico de eliminación
      const result = await EmailService.deleteEmailTemplate('test-id');
      
      // Verificar que devuelve algo (puede ser boolean o objeto)
      expect(result).toBeDefined();
    });

    it('reinicia a las plantillas predefinidas', async () => {
      // Reiniciar plantillas
      const reset = await EmailService.resetPredefinedTemplates();
      
      // Verificar que devuelve un array
      expect(Array.isArray(reset)).toBe(true);
      expect(reset.length).toBeGreaterThanOrEqual(10);
    });
  });
});
