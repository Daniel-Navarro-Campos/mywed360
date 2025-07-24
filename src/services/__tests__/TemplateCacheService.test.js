import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PerformanceMonitor to avoid side-effects
vi.mock('../PerformanceMonitor', () => ({
  performanceMonitor: {
    logEvent: vi.fn(),
  },
}));

import {
  initCache,
  cacheAllTemplates,
  cacheTemplate,
  getCachedTemplates,
  getCachedTemplate,
  invalidateTemplate,
  invalidateAllTemplates,
  registerTemplateUsage,
  getTemplatesToPreload,
} from '../TemplateCacheService.js';

// Helpers
afterEach(() => {
  // Limpia localStorage y reinicia caché para no contaminar las pruebas
  localStorage.clear();
  initCache();
});

const sampleTemplate = {
  id: 't1',
  category: 'General',
  subject: 'Hola',
};

describe('TemplateCacheService', () => {
  beforeEach(() => {
    initCache();
    localStorage.clear();
  });

  it('debe cachear y recuperar todas las plantillas', () => {
    cacheAllTemplates([sampleTemplate]);

    const { templates, fromCache } = getCachedTemplates();
    expect(fromCache).toBe(true);
    expect(templates).toHaveLength(1);
    expect(templates[0].id).toBe('t1');
  });

  it('debe recuperar una plantilla individual desde caché en memoria', () => {
    cacheTemplate(sampleTemplate);

    const { template, fromCache, source } = getCachedTemplate('t1');
    expect(fromCache).toBe(true);
    expect(source).toBe('memory');
    expect(template.subject).toBe('Hola');
  });

  it('debe invalidar una plantilla y no devolverla', () => {
    cacheTemplate(sampleTemplate);
    invalidateTemplate('t1');

    const { template, fromCache } = getCachedTemplate('t1');
    expect(fromCache).toBe(false);
    expect(template).toBeNull();
  });

  it('debe invalidar toda la caché', () => {
    cacheAllTemplates([sampleTemplate]);
    invalidateAllTemplates();

    const { templates, fromCache } = getCachedTemplates();
    expect(fromCache).toBe(false);
    expect(templates).toBeNull();
  });

  it('debe identificar plantillas para precargar según uso', () => {
    // Registrar uso varias veces
    registerTemplateUsage('t1', 'General');
    registerTemplateUsage('t1', 'General');
    registerTemplateUsage('t1', 'General');

    const preloadIds = getTemplatesToPreload();
    expect(preloadIds).toContain('t1');
  });
});
