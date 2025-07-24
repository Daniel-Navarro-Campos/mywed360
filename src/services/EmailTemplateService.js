/**
 * Servicio para gestionar plantillas de correo electrónico para diferentes tipos de proveedores
 * y contextos de búsqueda AI.
 */
class EmailTemplateService {
  /**
   * Construye el servicio de plantillas de correo
   */
  constructor() {
    this.templates = {};
    this.loadDefaultTemplates();
  }

  /**
   * Carga las plantillas predeterminadas para diferentes categorías de proveedores
   * @private
   */
  loadDefaultTemplates() {
    // Plantillas base por categoría de proveedor
    this.templates = {
      fotografía: {
        subject: 'Consulta sobre servicios de fotografía para boda - {providerName}',
        body: `
Hola {providerName},

Estoy organizando mi boda y me ha llamado la atención su trabajo como fotógrafo. {aiInsight}

Me gustaría consultarle sobre:
- Disponibilidad para el {date} (fecha provisional)
- Su estilo y enfoque fotográfico
- Paquetes y precios que ofrece
- Proceso de reserva

Busco específicamente: {searchQuery}

¿Podría proporcionarme información más detallada? Si lo prefiere, también podríamos concertar una llamada.

Gracias de antemano,
{userName}
        `
      },
      catering: {
        subject: 'Información sobre servicios de catering para boda - {providerName}',
        body: `
Hola {providerName},

Estoy en proceso de planificación de mi boda y estoy interesado/a en sus servicios de catering. {aiInsight}

Me gustaría obtener información sobre:
- Menús disponibles y opciones especiales (vegetarianas, alergias, etc.)
- Capacidad de servicio para aproximadamente {guests} invitados
- Costes estimados y opciones de personalización
- Degustación de menú y proceso de reserva

Estoy especialmente interesado/a en: {searchQuery}

¿Podría enviarme información detallada de sus servicios? También me interesaría conocer su disponibilidad para la fecha {date}.

Muchas gracias,
{userName}
        `
      },
      florista: {
        subject: 'Consulta sobre decoración floral para boda - {providerName}',
        body: `
Hola {providerName},

Estoy organizando mi boda y me gustaría consultar sobre sus servicios de decoración floral. {aiInsight}

Me interesa conocer:
- Estilos y opciones de arreglos florales para ceremonia y recepción
- Disponibilidad para la fecha {date}
- Presupuesto aproximado y opciones según diferentes rangos de precio
- Proceso de diseño y planificación

Mi idea para la decoración floral es: {searchQuery}

¿Sería posible concertar una cita para hablar sobre estas ideas en mayor detalle?

Atentamente,
{userName}
        `
      },
      música: {
        subject: 'Solicitud de información sobre servicios musicales para boda - {providerName}',
        body: `
Hola {providerName},

Estamos organizando nuestra boda y nos gustaría contar con su música para el evento. {aiInsight}

Nos interesaría conocer:
- Su repertorio y estilos musicales
- Disponibilidad para el {date}
- Equipamiento y necesidades técnicas
- Duración de las actuaciones y precios

Estamos buscando específicamente: {searchQuery}

¿Sería posible obtener esta información y quizás algunos ejemplos de su trabajo?

Saludos cordiales,
{userName}
        `
      },
      local: {
        subject: 'Consulta sobre disponibilidad de espacio para boda - {providerName}',
        body: `
Hola {providerName},

Estamos en proceso de elegir el lugar para nuestra boda y su espacio nos ha llamado la atención. {aiInsight}

Nos gustaría saber:
- Disponibilidad para la fecha {date}
- Capacidad y características del espacio
- Servicios incluidos y opcionales (catering, decoración, etc.)
- Costes y condiciones de reserva

Estamos buscando un lugar que: {searchQuery}

¿Sería posible concertar una visita para conocer el espacio en persona?

Gracias de antemano,
{userName}
        `
      },
      general: {
        subject: 'Consulta sobre servicios para boda - {providerName}',
        body: `
Hola {providerName},

Estoy organizando mi boda y me interesa conocer más sobre los servicios que ofrece. {aiInsight}

Me gustaría obtener información sobre:
- Detalle de los servicios que proporciona
- Disponibilidad para la fecha {date}
- Precios y opciones disponibles
- Proceso de reserva y contratación

Estoy buscando específicamente: {searchQuery}

¿Podría proporcionarme más información? También estoy disponible para resolver cualquier duda por teléfono si lo prefiere.

Muchas gracias,
{userName}
        `
      }
    };
  }

  /**
   * Obtiene una plantilla para una categoría específica de proveedor
   * @param {string} category - Categoría del proveedor (fotografía, catering, etc.)
   * @returns {Object} Objeto con subject y body para la plantilla
   */
  getTemplateByCategory(category) {
    // Normalizar categoría (minúsculas, sin acentos)
    const normalizedCategory = category
      ? category.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : '';
    
    // Buscar plantilla específica o devolver la general
    if (normalizedCategory.includes('foto') || normalizedCategory.includes('fotogra')) {
      return this.templates.fotografía;
    } else if (
      normalizedCategory.includes('catering') || 
      normalizedCategory.includes('comida') || 
      normalizedCategory.includes('gastronomia')
    ) {
      return this.templates.catering;
    } else if (
      normalizedCategory.includes('flor') || 
      normalizedCategory.includes('florista') || 
      normalizedCategory.includes('decoracion floral')
    ) {
      return this.templates.florista;
    } else if (
      normalizedCategory.includes('music') || 
      normalizedCategory.includes('dj') || 
      normalizedCategory.includes('banda')
    ) {
      return this.templates.música;
    } else if (
      normalizedCategory.includes('local') || 
      normalizedCategory.includes('finca') || 
      normalizedCategory.includes('salon') ||
      normalizedCategory.includes('espacio')
    ) {
      return this.templates.local;
    } 
    
    // Plantilla genérica por defecto
    return this.templates.general;
  }

  /**
   * Genera un asunto personalizado según la plantilla y datos proporcionados
   * @param {string} category - Categoría del proveedor
   * @param {Object} data - Datos para rellenar la plantilla
   * @returns {string} Asunto personalizado
   */
  generateSubjectFromTemplate(category, data) {
    const template = this.getTemplateByCategory(category);
    
    return this.replaceTemplateVariables(template.subject, data);
  }

  /**
   * Genera un cuerpo de correo personalizado según la plantilla y datos proporcionados
   * @param {string} category - Categoría del proveedor
   * @param {Object} data - Datos para rellenar la plantilla
   * @returns {string} Cuerpo del correo personalizado
   */
  generateBodyFromTemplate(category, data) {
    const template = this.getTemplateByCategory(category);
    
    return this.replaceTemplateVariables(template.body, data);
  }

  /**
   * Reemplaza las variables en una plantilla con los datos proporcionados
   * @param {string} template - Plantilla con variables entre llaves
   * @param {Object} data - Objeto con los valores para reemplazar
   * @returns {string} Plantilla con las variables reemplazadas
   * @private
   */
  replaceTemplateVariables(template, data) {
    let result = template;
    
    // Reemplazar todas las variables en la plantilla
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, data[key] || '');
    });
    
    return result;
  }

  /**
   * Registra y analiza el uso de plantillas para mejorar recomendaciones futuras
   * @param {string} category - Categoría utilizada
   * @param {Object} aiResult - Resultado de búsqueda AI utilizado
   * @param {boolean} wasCustomized - Si el usuario personalizó la plantilla
   */
  logTemplateUsage(category, aiResult, wasCustomized) {
    // Aquí se implementaría la lógica para registrar el uso de plantillas
    // y mejorar las recomendaciones futuras
    console.log('Template usage logged:', {
      category,
      aiResultId: aiResult?.id,
      wasCustomized
    });
  }
}

export default EmailTemplateService;
