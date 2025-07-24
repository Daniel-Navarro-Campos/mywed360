// @ts-check
import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { launch } from 'puppeteer';
import lighthouse from 'lighthouse';
import { startFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api.js';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

/**
 * Pruebas de rendimiento para el sistema de correo electrónico
 * 
 * Este archivo implementa pruebas automatizadas de rendimiento utilizando 
 * Lighthouse y Puppeteer para evaluar el rendimiento del sistema de correo.
 */

// Configuraciones
const PORT = process.env.TEST_PORT || 5173;
const BASE_URL = `http://localhost:${PORT}`;
const EMAIL_URL = `${BASE_URL}/email`;
const REPORTS_DIR = path.join(process.cwd(), 'lighthouse-reports');

// Umbrales de rendimiento
const PERF_THRESHOLD = 80;
const ACCESSIBILITY_THRESHOLD = 90;
const BEST_PRACTICES_THRESHOLD = 85;

// Asegurarnos de que exista el directorio de reportes
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

describe('Pruebas de rendimiento para el sistema de correo', () => {
  /** @type {import('puppeteer').Browser} */
  let browser;
  
  /** @type {import('puppeteer').Page} */
  let page;

  beforeAll(async () => {
    // Iniciar navegador
    browser = await launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    // Crear página
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Simular usuario autenticado (insertar datos de autenticación en localStorage)
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('authUser', JSON.stringify({ 
        uid: 'test-user-123', 
        email: 'test@example.com'
      }));
      
      localStorage.setItem('userProfile', JSON.stringify({
        id: 'profile123',
        userId: 'test-user-123',
        brideFirstName: 'María',
        brideLastName: 'García',
        groomFirstName: 'Juan',
        groomLastName: 'López',
        weddingDate: '2025-06-15',
        emailAlias: 'maria.garcia'
      }));
    });
  });

  afterAll(async () => {
    // Cerrar navegador
    await browser.close();
  });

  it('debe cargar la página de correo con buen rendimiento', async () => {
    // Navegar a la página de correo
    const response = await page.goto(EMAIL_URL, { waitUntil: 'networkidle0' });
    
    // Verificar que la página cargó correctamente
    expect(response.status()).toBeLessThan(400);
    
    // Ejecutar lighthouse
    const result = await lighthouse(EMAIL_URL, {
      port: (new URL(browser.wsEndpoint())).port,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices']
    });
    
    // Guardar reporte
    const reportPath = path.join(REPORTS_DIR, 'email-homepage.json');
    fs.writeFileSync(reportPath, JSON.stringify(result.lhr, null, 2));
    
    // Verificar métricas de rendimiento
    const { performance, accessibility, 'best-practices': bestPractices } = result.lhr.categories;
    
    // Logging para análisis
    console.log('--- Resultados de rendimiento ---');
    console.log(`Rendimiento: ${performance.score * 100}`);
    console.log(`Accesibilidad: ${accessibility.score * 100}`);
    console.log(`Mejores prácticas: ${bestPractices.score * 100}`);
    
    // Afirmaciones
    expect(performance.score * 100).toBeGreaterThanOrEqual(PERF_THRESHOLD);
    expect(accessibility.score * 100).toBeGreaterThanOrEqual(ACCESSIBILITY_THRESHOLD);
    expect(bestPractices.score * 100).toBeGreaterThanOrEqual(BEST_PRACTICES_THRESHOLD);
  });
  
  it('debe manejar eficientemente la carga de muchos correos', async () => {
    // Iniciar un flujo de Lighthouse para analizar múltiples acciones
    const flow = await startFlow(page);
    
    // Paso 1: Navegar a la página de correo
    await flow.navigate(EMAIL_URL, {
      name: 'Carga inicial de página de correo'
    });
    
    // Paso 2: Simular clic en "Ver todos los correos" o alguna acción que cargue muchos correos
    await flow.startTimespan({ name: 'Carga de lista completa de correos' });
    
    // Hacer clic en el botón que carga todos los correos (ajustar selector según la implementación)
    await page.waitForSelector('[data-testid="load-all-emails"]');
    await page.click('[data-testid="load-all-emails"]');
    
    // Esperar a que se carguen los correos (ajustar selector según la implementación)
    await page.waitForSelector('[data-testid="email-list-item"]');
    
    // Finalizar timespan
    await flow.endTimespan();
    
    // Paso 3: Probar la búsqueda de correos
    await flow.startTimespan({ name: 'Búsqueda de correos' });
    
    // Simular búsqueda de correos (ajustar selector según la implementación)
    await page.waitForSelector('[data-testid="email-search-input"]');
    await page.type('[data-testid="email-search-input"]', 'presupuesto');
    
    // Esperar a que se actualice la lista filtrada
    await page.waitForTimeout(1000);
    
    // Finalizar timespan
    await flow.endTimespan();
    
    // Guardar resultados del flujo
    const reportPath = path.join(REPORTS_DIR, 'email-load-performance.json');
    fs.writeFileSync(reportPath, JSON.stringify(await flow.getFlowResult(), null, 2));
  });
  
  it('debe tener buen rendimiento al cargar un correo con adjuntos', async () => {
    // Navegar a la página de correo
    await page.goto(EMAIL_URL, { waitUntil: 'networkidle0' });
    
    // Iniciar un flujo de Lighthouse
    const flow = await startFlow(page);
    
    // Simular clic en un correo con adjuntos (ajustar selector según la implementación)
    await flow.startTimespan({ name: 'Apertura de correo con adjuntos' });
    
    // Hacer clic en un correo que sabemos tiene adjuntos
    await page.waitForSelector('[data-testid="email-with-attachment"]');
    await page.click('[data-testid="email-with-attachment"]');
    
    // Esperar a que se cargue el contenido del correo
    await page.waitForSelector('[data-testid="email-attachment-list"]');
    
    // Finalizar timespan
    await flow.endTimespan();
    
    // Paso 2: Probar la descarga de adjuntos
    await flow.startTimespan({ name: 'Descarga de adjuntos' });
    
    // Simular clic en botón de descarga (ajustar selector según la implementación)
    await page.click('[data-testid="download-attachment-button"]');
    
    // Esperar un tiempo prudente para que inicie la descarga
    await page.waitForTimeout(1000);
    
    // Finalizar timespan
    await flow.endTimespan();
    
    // Guardar resultados del flujo
    const reportPath = path.join(REPORTS_DIR, 'email-attachment-performance.json');
    fs.writeFileSync(reportPath, JSON.stringify(await flow.getFlowResult(), null, 2));
  });
});
