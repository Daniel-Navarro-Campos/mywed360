import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateUserStats, getUserStats, saveUserStats, __setStorageProviderForTests } from '../../services/statsService';

// Mock de los servicios dependientes
vi.mock('../../services/emailService', () => ({
  getMails: vi.fn()
}));

vi.mock('../../services/folderService', () => ({
  getUserFolders: vi.fn(),
  getEmailsInFolder: vi.fn()
}));

vi.mock('../../services/tagService', () => ({
  getUserTags: vi.fn(),
  getEmailsByTag: vi.fn(),
  getEmailTagsDetails: vi.fn()
}));

// Mock de métricas agregadas para evitar llamadas a Firebase
vi.mock('../../services/emailMetricsService', () => ({
  getAggregatedStats: vi.fn().mockResolvedValue(null),
  getDailyStats: vi.fn().mockResolvedValue([])
}));

// Importar servicios después del mock para poder manipularlos
import { getMails } from '../../services/emailService';
import { getUserFolders, getEmailsInFolder } from '../../services/folderService';
import { getUserTags, getEmailsByTag, getEmailTagsDetails } from '../../services/tagService';

describe('statsService', () => {
  // Mock del localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      clear: vi.fn(() => { store = {}; })
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  // Forzar a statsService a usar nuestro mock
  __setStorageProviderForTests(() => localStorageMock);
  
  // Datos de prueba
  const mockUserId = 'user123';
  const mockInboxEmails = [
    { id: 'email1', from: 'contact@example.com', to: 'user@lovenda.com', subject: 'Asunto 1', 
      body: 'Contenido 1', date: '2025-05-01T10:00:00Z', read: true, folder: 'inbox' },
    { id: 'email2', from: 'info@company.com', to: 'user@lovenda.com', subject: 'Asunto 2', 
      body: 'Contenido 2', date: '2025-05-02T15:30:00Z', read: false, folder: 'inbox' },
    { id: 'email3', from: 'contact@example.com', to: 'user@lovenda.com', subject: 'Re: Asunto 1', 
      body: 'Respuesta', date: '2025-05-03T11:20:00Z', read: false, folder: 'inbox',
      inReplyTo: 'sent1' }
  ];
  
  const mockSentEmails = [
    { id: 'sent1', from: 'user@lovenda.com', to: 'contact@example.com', subject: 'Asunto 1', 
      body: 'Contenido original', date: '2025-05-01T09:00:00Z', folder: 'sent' },
    { id: 'sent2', from: 'user@lovenda.com', to: 'info@provider.com', subject: 'Consulta', 
      body: 'Pregunta', date: '2025-05-04T16:00:00Z', folder: 'sent' }
  ];
  
  const mockTrashEmails = [
    { id: 'trash1', from: 'spam@example.com', to: 'user@lovenda.com', subject: 'Promoción', 
      body: 'Oferta', date: '2025-04-15T10:00:00Z', read: true, folder: 'trash' }
  ];
  
  const mockFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true },
    { id: 'work', name: 'Trabajo', system: false }
  ];
  
  const mockTags = [
    { id: 'important', name: 'Importante', color: '#e53e3e' },
    { id: 'personal', name: 'Personal', color: '#38a169' },
    { id: 'work', name: 'Trabajo', color: '#3182ce' }
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    // Configurar mocks por defecto
    getMails.mockImplementation((folder) => {
      if (folder === 'inbox') return Promise.resolve(mockInboxEmails);
      if (folder === 'sent') return Promise.resolve(mockSentEmails);
      if (folder === 'trash') return Promise.resolve(mockTrashEmails);
      return Promise.resolve([]);
    });
    
    getUserFolders.mockReturnValue(mockFolders);
    getUserTags.mockReturnValue(mockTags);
    getEmailsByTag.mockImplementation(() => []);
    getEmailTagsDetails.mockImplementation(() => []);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('getUserStats', () => {
    it('devuelve un objeto vacío si no se proporciona userId', () => {
      const stats = getUserStats();
      expect(stats).toEqual({});
    });
    
    it('devuelve un objeto vacío si no hay estadísticas guardadas', () => {
      const stats = getUserStats(mockUserId);
      expect(stats).toEqual({});
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`lovenda_email_stats_${mockUserId}`);
    });
    
    it('devuelve estadísticas si existen en localStorage', () => {
      const mockStats = { emailCounts: { total: 10 } };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStats));
      
      const stats = getUserStats(mockUserId);
      expect(stats).toEqual(mockStats);
    });
    
    it('maneja errores al parsear JSON', () => {
      localStorageMock.getItem.mockReturnValue('{ datos inválidos }');
      
      const stats = getUserStats(mockUserId);
      expect(stats).toEqual({});
    });
  });
  
  describe('saveUserStats', () => {
    it('no hace nada si no se proporciona userId', () => {
      saveUserStats(null, { data: 'test' });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
    
    it('guarda correctamente las estadísticas en localStorage', () => {
      const stats = { emailCounts: { total: 10 } };
      saveUserStats(mockUserId, stats);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `lovenda_email_stats_${mockUserId}`,
        JSON.stringify(stats)
      );
    });
  });
  
  describe('generateUserStats', () => {
    it('devuelve un objeto vacío si no se proporciona userId', async () => {
      const stats = await generateUserStats();
      expect(stats).toEqual({});
    });
    
    it('genera estadísticas completas con todos los datos', async () => {
      const stats = await generateUserStats(mockUserId);
      
      // Verificar estructura general
      expect(stats).toHaveProperty('lastUpdated');
      expect(stats).toHaveProperty('emailCounts');
      expect(stats).toHaveProperty('activityMetrics');
      expect(stats).toHaveProperty('folderDistribution');
      expect(stats).toHaveProperty('tagDistribution');
      expect(stats).toHaveProperty('contactAnalysis');
      expect(stats).toHaveProperty('responseMetrics');
      
      // Verificar conteos
      expect(stats.emailCounts.total).toBe(6); // 3 inbox + 2 sent + 1 trash
      expect(stats.emailCounts.inbox).toBe(3);
      expect(stats.emailCounts.sent).toBe(2);
      expect(stats.emailCounts.unread).toBe(2); // 2 no leídos en inbox
      
      // Verificar que se guarda en localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
    
    it('genera correctamente estadísticas de contactos', async () => {
      const stats = await generateUserStats(mockUserId);
      
      expect(stats.contactAnalysis).toHaveProperty('topContacts');
      expect(stats.contactAnalysis.topContacts.length).toBeGreaterThan(0);
      
      // contact@example.com aparece 2 veces
      const topContact = stats.contactAnalysis.topContacts[0];
      expect(topContact.email).toBe('contact@example.com');
      expect(topContact.count).toBe(2);
    });
    
    it('calcula correctamente métricas de respuesta', async () => {
      const stats = await generateUserStats(mockUserId);
      
      expect(stats.responseMetrics).toHaveProperty('responseRate');
      expect(stats.responseMetrics).toHaveProperty('averageResponseTime');
      
      // Verificar tasa de respuesta
      // Hay un email (email3) que es respuesta al email sent1
      expect(stats.responseMetrics.responseRate).toBeGreaterThan(0);
    });
    
    it('maneja errores durante la generación', async () => {
      // Simular un error en la obtención de correos
      getMails.mockRejectedValue(new Error('Error de prueba'));
      
      const stats = await generateUserStats(mockUserId);
      
      expect(stats).toHaveProperty('error', true);
      expect(stats).toHaveProperty('message');
    });
    
    it('genera estadísticas incluso sin correos', async () => {
      // No hay correos en ninguna carpeta
      getMails.mockResolvedValue([]);
      
      const stats = await generateUserStats(mockUserId);
      
      expect(stats.emailCounts.total).toBe(0);
      expect(stats.emailCounts.inbox).toBe(0);
      expect(stats.emailCounts.sent).toBe(0);
    });
    
    it('calcula correctamente la distribución por carpetas', async () => {
      // Añadir un email en una carpeta personalizada
      const mockWorkEmail = { id: 'work1', folder: 'work', subject: 'Trabajo' };
      getEmailsInFolder.mockResolvedValue([mockWorkEmail]);
      
      const stats = await generateUserStats(mockUserId);
      
      expect(stats.folderDistribution).toHaveProperty('data');
      expect(stats.folderDistribution).toHaveProperty('labels');
      
      // Verificar que incluye la carpeta personalizada
      expect(stats.folderDistribution.labels).toContain('Trabajo');
    });
    
    it('calcula correctamente la distribución por etiquetas', async () => {
      // Configurar emails con etiquetas
      getEmailsByTag.mockImplementation((tagId) => {
        if (tagId === 'important') return [mockInboxEmails[0]];
        if (tagId === 'work') return [mockInboxEmails[1], mockSentEmails[0]];
        return [];
      });
      
      const stats = await generateUserStats(mockUserId);
      
      expect(stats.tagDistribution).toHaveProperty('data');
      expect(stats.tagDistribution).toHaveProperty('labels');
      expect(stats.tagDistribution).toHaveProperty('colors');
      
      // Verificar que las etiquetas tienen datos
      const workIndex = stats.tagDistribution.labels.indexOf('Trabajo');
      expect(workIndex).not.toBe(-1);
      expect(stats.tagDistribution.data[workIndex]).toBe(2); // 2 emails con esta etiqueta
    });
  });
});
