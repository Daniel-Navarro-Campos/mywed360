import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailTemplateService from '../../services/EmailTemplateService';

describe('EmailTemplateService', () => {
  let templateService;
  
  beforeEach(() => {
    templateService = new EmailTemplateService();
    // Mockear console.log para evitar salida durante las pruebas
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('debe inicializarse con plantillas predeterminadas', () => {
    expect(templateService.templates).toBeDefined();
    expect(Object.keys(templateService.templates).length).toBeGreaterThan(0);
    
    // Verificar que existen las categorías principales
    expect(templateService.templates.fotografía).toBeDefined();
    expect(templateService.templates.catering).toBeDefined();
    expect(templateService.templates.general).toBeDefined();
  });
  
  it('debe obtener plantilla correcta según la categoría del proveedor', () => {
    // Pruebas para fotografía
    expect(templateService.getTemplateByCategory('fotografía')).toBe(templateService.templates.fotografía);
    expect(templateService.getTemplateByCategory('fotografia')).toBe(templateService.templates.fotografía);
    expect(templateService.getTemplateByCategory('Fotógrafo')).toBe(templateService.templates.fotografía);
    
    // Pruebas para catering
    expect(templateService.getTemplateByCategory('catering')).toBe(templateService.templates.catering);
    expect(templateService.getTemplateByCategory('comida')).toBe(templateService.templates.catering);
    
    // Prueba para categoría desconocida (debe devolver general)
    expect(templateService.getTemplateByCategory('categoría desconocida')).toBe(templateService.templates.general);
    expect(templateService.getTemplateByCategory(null)).toBe(templateService.templates.general);
  });
  
  it('debe reemplazar variables en las plantillas', () => {
    const template = 'Hola {name}, bienvenido a {place}';
    const data = { name: 'Juan', place: 'Madrid' };
    
    const result = templateService.replaceTemplateVariables(template, data);
    
    expect(result).toBe('Hola Juan, bienvenido a Madrid');
  });
  
  it('debe manejar correctamente variables faltantes en los datos', () => {
    const template = 'Hola {name}, bienvenido a {place}. Tu código es {code}';
    const data = { name: 'Juan', place: 'Madrid' };
    
    const result = templateService.replaceTemplateVariables(template, data);
    
    expect(result).toBe('Hola Juan, bienvenido a Madrid. Tu código es ');
  });
  
  it('debe generar asunto según la categoría y datos', () => {
    const data = {
      providerName: 'Estudio Fotográfico',
      date: '15 de julio de 2025',
      userName: 'María'
    };
    
    const subject = templateService.generateSubjectFromTemplate('fotografía', data);
    
    expect(subject).toContain('Estudio Fotográfico');
    expect(subject).toContain('fotografía');
  });
  
  it('debe generar cuerpo según la categoría y datos', () => {
    const data = {
      providerName: 'Florista Bella',
      searchQuery: 'arreglos florales para boda en jardín',
      aiInsight: 'Este proveedor tiene buenas reseñas para bodas al aire libre',
      date: '15 de julio de 2025',
      userName: 'Carlos',
      guests: '150'
    };
    
    const body = templateService.generateBodyFromTemplate('florista', data);
    
    // Verificar que incluye los datos proporcionados
    expect(body).toContain('Florista Bella');
    expect(body).toContain('arreglos florales para boda en jardín');
    expect(body).toContain('Este proveedor tiene buenas reseñas');
    expect(body).toContain('15 de julio de 2025');
    expect(body).toContain('Carlos');
  });
  
  it('debe registrar el uso de plantillas', () => {
    const spy = vi.spyOn(console, 'log');
    
    templateService.logTemplateUsage('fotografía', { id: 123 }, true);
    
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('Template usage logged:', expect.objectContaining({
      category: 'fotografía',
      aiResultId: 123,
      wasCustomized: true
    }));
  });
  
  it('debe manejar correctamente categorías con acentos', () => {
    expect(templateService.getTemplateByCategory('música')).toBe(templateService.templates.música);
    expect(templateService.getTemplateByCategory('musica')).toBe(templateService.templates.música);
    expect(templateService.getTemplateByCategory('Músico')).toBe(templateService.templates.música);
  });
  
  it('debe generar plantillas para catering con información de número de invitados', () => {
    const data = {
      providerName: 'Delicious Catering',
      searchQuery: 'menú gourmet para boda',
      guests: '200',
      date: '15 de julio de 2025',
      userName: 'Ana'
    };
    
    const body = templateService.generateBodyFromTemplate('catering', data);
    
    expect(body).toContain('Delicious Catering');
    expect(body).toContain('menú gourmet para boda');
    expect(body).toContain('200 invitados');
    expect(body).toContain('15 de julio de 2025');
    expect(body).toContain('Ana');
  });
});
