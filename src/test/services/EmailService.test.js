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
    USE_BACKEND: false
  };
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
    it('devuelve una dirección de email válida basada en el perfil', () => {
      const email = EmailService.initEmailService(mockProfile);
      expect(email).toBe('maria.garcia@test.lovenda.com');
      expect(EmailService.CURRENT_USER).toBe(mockProfile);
      expect(EmailService.CURRENT_USER_EMAIL).toBe('maria.garcia@test.lovenda.com');
    });

    it('usa el emailAlias si está definido', () => {
      const profileWithAlias = { ...mockProfile, emailAlias: 'miboda' };
      const email = EmailService.initEmailService(profileWithAlias);
      expect(email).toBe('miboda@test.lovenda.com');
    });

    it('usa solo nombre si no hay apellido', () => {
      const profileNoLastName = { ...mockProfile, brideLastName: '' };
      const email = EmailService.initEmailService(profileNoLastName);
      expect(email).toBe('maria@test.lovenda.com');
    });

    it('usa userId si no hay nombre', () => {
      const profileNoName = { 
        ...mockProfile, 
        brideFirstName: '', 
        brideLastName: '' 
      };
      const email = EmailService.initEmailService(profileNoName);
      expect(email).toBe('useruser123@test.lovenda.com');
    });
  });

  describe('getMails', () => {
    it('devuelve emails de localStorage si no hay backend ni Mailgun', async () => {
      // Simular que no hay backend ni Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      // Guardar emails de prueba en localStorage
      const mockEmails = [mockEmail];
      localStorage.setItem('mywed360_mails', JSON.stringify(mockEmails));
      
      const result = await EmailService.getMails('inbox');
      expect(result).toEqual(mockEmails);
      expect(localStorage.getItem).toHaveBeenCalledWith('mywed360_mails');
    });

    it('llama a la API del backend cuando está configurado', async () => {
      // Simular que hay backend pero no Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Mock respuesta del backend
      const mockResponse = [mockEmail];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse })
      });
      
      const result = await EmailService.getMails('inbox');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('maneja errores de API correctamente', async () => {
      // Simular que hay backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      // Mock error de API
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, message: 'Error interno' })
      });
      
      // Crear datos en localStorage como fallback
      localStorage.setItem('mywed360_mails', JSON.stringify([mockEmail]));
      
      const result = await EmailService.getMails('inbox');
      
      // Debe usar el fallback de localStorage ante un error
      expect(result).toEqual([mockEmail]);
    });
  });

  describe('sendMail', () => {
    beforeEach(() => {
      // Inicializar con un usuario
      EmailService.initEmailService(mockProfile);
    });

    it('envía correo utilizando Mailgun cuando está disponible', async () => {
      // Configurar para usar Mailgun
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(true);
      
      const sendMailgunSpy = vi.spyOn(EmailService, 'sendMailWithMailgun')
        .mockResolvedValueOnce({ success: true, id: 'msg123' });
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      const result = await EmailService.sendMail(mailData);
      
      expect(sendMailgunSpy).toHaveBeenCalled();
      expect(result.success).toBe(true);
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

    it('almacena correo en localStorage cuando no hay backend ni Mailgun', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      const mailData = {
        to: 'destinatario@example.com',
        subject: 'Asunto de prueba',
        body: 'Contenido de prueba'
      };
      
      const result = await EmailService.sendMail(mailData);
      
      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Verificar que el correo se guardó en localStorage
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved).toHaveLength(1);
      expect(saved[0].subject).toBe('Asunto de prueba');
      expect(saved[0].folder).toBe('sent');
    });
  });

  describe('markAsRead y deleteMail', () => {
    beforeEach(() => {
      // Guardar emails de prueba en localStorage
      const mockEmails = [mockEmail];
      localStorage.setItem('mywed360_mails', JSON.stringify(mockEmails));
    });

    it('marca un email como leído correctamente', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      await EmailService.markAsRead('email123');
      
      // Verificar que el email fue marcado como leído
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved[0].read).toBe(true);
    });

    it('elimina un email correctamente', async () => {
      // Configurar para usar localStorage
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(false);
      
      await EmailService.deleteMail('email123');
      
      // Verificar que el email fue eliminado
      const saved = JSON.parse(localStorage.getItem('mywed360_mails'));
      expect(saved).toHaveLength(0);
    });

    it('llama a la API del backend para marcar como leído cuando está disponible', async () => {
      // Configurar para usar backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      await EmailService.markAsRead('email123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch.mock.calls[0][0]).toContain('/api/emails/email123/read');
    });

    it('llama a la API del backend para eliminar cuando está disponible', async () => {
      // Configurar para usar backend
      vi.spyOn(EmailService, 'USE_MAILGUN', 'get').mockReturnValue(false);
      vi.spyOn(EmailService, 'USE_BACKEND', 'get').mockReturnValue(true);
      
      await EmailService.deleteMail('email123');
      
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch.mock.calls[0][0]).toContain('/api/emails/email123');
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
      expect(templates).toHaveLength(3); // Asumiendo 3 plantillas predefinidas
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('subject');
      expect(templates[0]).toHaveProperty('body');
    });

    it('guarda y recupera una plantilla correctamente', async () => {
      const newTemplate = {
        name: 'Plantilla de prueba',
        subject: 'Asunto de prueba',
        body: '<p>Contenido de plantilla</p>'
      };
      
      // Guardar plantilla
      const saved = await EmailService.saveEmailTemplate(newTemplate);
      expect(saved).toHaveProperty('id');
      expect(saved.name).toBe('Plantilla de prueba');
      
      // Recuperar plantilla por ID
      const retrieved = await EmailService.getEmailTemplateById(saved.id);
      expect(retrieved).toEqual(saved);
    });

    it('actualiza una plantilla existente', async () => {
      // Crear plantilla
      const newTemplate = {
        name: 'Plantilla original',
        subject: 'Asunto original',
        body: '<p>Contenido original</p>'
      };
      
      const saved = await EmailService.saveEmailTemplate(newTemplate);
      
      // Actualizar plantilla
      const updated = await EmailService.saveEmailTemplate({
        id: saved.id,
        name: 'Plantilla actualizada',
        subject: 'Asunto actualizado',
        body: '<p>Contenido actualizado</p>'
      });
      
      expect(updated.id).toBe(saved.id);
      expect(updated.name).toBe('Plantilla actualizada');
      
      // Verificar actualización
      const retrieved = await EmailService.getEmailTemplateById(saved.id);
      expect(retrieved.name).toBe('Plantilla actualizada');
    });

    it('elimina una plantilla correctamente', async () => {
      // Crear plantilla
      const newTemplate = {
        name: 'Plantilla para eliminar',
        subject: 'Asunto',
        body: '<p>Contenido</p>'
      };
      
      const saved = await EmailService.saveEmailTemplate(newTemplate);
      
      // Eliminar plantilla
      const result = await EmailService.deleteEmailTemplate(saved.id);
      expect(result).toBe(true);
      
      // Verificar eliminación
      const retrieved = await EmailService.getEmailTemplateById(saved.id);
      expect(retrieved).toBeNull();
    });

    it('reinicia a las plantillas predefinidas', async () => {
      // Crear plantilla personalizada
      await EmailService.saveEmailTemplate({
        name: 'Mi plantilla',
        subject: 'Asunto personalizado',
        body: '<p>Contenido personalizado</p>'
      });
      
      // Verificar que existe
      const beforeReset = await EmailService.getEmailTemplates();
      expect(beforeReset.some(t => t.name === 'Mi plantilla')).toBe(true);
      
      // Reiniciar plantillas
      const reset = await EmailService.resetPredefinedTemplates();
      
      // Verificar que las personalizadas ya no están
      expect(reset.some(t => t.name === 'Mi plantilla')).toBe(false);
      
      // Verificar que están las predefinidas
      expect(reset.length).toBeGreaterThanOrEqual(3);
    });
  });
});
