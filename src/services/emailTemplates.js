// Servicio de plantillas de correo para diferentes tipos de proveedores
// Este servicio proporciona plantillas predefinidas para agilizar la comunicación con proveedores

/**
 * Plantillas de correo para diferentes tipos de proveedores
 * Cada plantilla incluye asunto y cuerpo con variables que se reemplazan con datos del proveedor
 * Variables disponibles:
 * - {{providerName}} - Nombre del proveedor
 * - {{weddingDate}} - Fecha de la boda
 * - {{weddingPlace}} - Lugar de la boda
 * - {{coupleName}} - Nombre de la pareja
 * - {{userName}} - Nombre del usuario
 * - {{userPhone}} - Teléfono del usuario (si está disponible)
 * - {{userEmail}} - Email del usuario
 */

export const EMAIL_TEMPLATES = {
  // Solicitud de información general
  GENERAL_INFO: {
    name: "Solicitud de información",
    subject: "Solicitud de información para boda el {{weddingDate}} en {{weddingPlace}}",
    body: `Hola {{providerName}},

Soy {{userName}} y estoy organizando mi boda que se celebrará el {{weddingDate}} en {{weddingPlace}}. 

Me gustaría recibir más información sobre sus servicios, disponibilidad para esa fecha y precios aproximados.

¿Podrían enviarme un catálogo o información detallada sobre las opciones que ofrecen?

Muchas gracias por su atención.
Un cordial saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Solicitud de presupuesto
  BUDGET_REQUEST: {
    name: "Solicitud de presupuesto",
    subject: "Solicitud de presupuesto para boda el {{weddingDate}}",
    body: `Hola {{providerName}},

Soy {{userName}} y junto con mi pareja estamos organizando nuestra boda para el {{weddingDate}} en {{weddingPlace}}.

Hemos visto sus servicios y nos encantaría recibir un presupuesto detallado adaptado a nuestras necesidades.

Detalles de nuestro evento:
- Fecha: {{weddingDate}}
- Lugar: {{weddingPlace}}
- Número aproximado de invitados: [INDICAR NÚMERO]

Estamos interesados específicamente en: [DETALLAR SERVICIOS ESPECÍFICOS]

¿Sería posible concertar una llamada o videollamada para comentar más detalles?

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Confirmación de reserva
  BOOKING_CONFIRMATION: {
    name: "Confirmación de reserva",
    subject: "Confirmación de reserva para nuestra boda - {{weddingDate}}",
    body: `Estimado/a {{providerName}},

Por la presente queremos confirmar la reserva de sus servicios para nuestra boda que se celebrará el {{weddingDate}} en {{weddingPlace}}.

Tras revisar su presupuesto y condiciones, estamos de acuerdo con los términos establecidos.

¿Podría indicarnos los siguientes pasos a seguir para formalizar la reserva? ¿Es necesario realizar algún pago por adelantado o firmar algún contrato?

Quedamos a la espera de su respuesta.

Saludos cordiales,
{{coupleName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Seguimiento
  FOLLOW_UP: {
    name: "Seguimiento",
    subject: "Seguimiento sobre consulta para boda {{weddingDate}}",
    body: `Hola {{providerName}},

Hace unos días les envié una consulta sobre sus servicios para nuestra boda del {{weddingDate}} en {{weddingPlace}}.

Quería hacer un seguimiento para saber si han tenido oportunidad de revisar mi solicitud y si necesitan alguna información adicional por mi parte.

Seguimos muy interesados en contar con sus servicios para nuestro día especial.

Gracias por su atención.
Un saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Fotografía
  PHOTOGRAPHY: {
    name: "Fotógrafo - Consulta",
    subject: "Consulta sobre servicios de fotografía para boda {{weddingDate}}",
    body: `Hola {{providerName}},

Soy {{userName}} y estoy organizando mi boda para el {{weddingDate}} en {{weddingPlace}}.

Estamos buscando un fotógrafo profesional que capture los momentos especiales de nuestra boda. Me gustaría saber:

- ¿Qué paquetes o servicios ofrecen?
- ¿Tienen disponibilidad para nuestra fecha?
- ¿Cuánto tiempo de cobertura incluyen?
- ¿Entregan todas las fotos editadas?
- ¿Cuánto tiempo tardan en entregar el trabajo final?
- ¿Hacen álbumes físicos?

Si es posible, me encantaría ver ejemplos de bodas anteriores que hayan fotografiado.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Catering
  CATERING: {
    name: "Catering - Consulta",
    subject: "Consulta sobre servicios de catering para boda {{weddingDate}}",
    body: `Estimado equipo de {{providerName}},

Mi pareja y yo estamos organizando nuestra boda para el {{weddingDate}} en {{weddingPlace}} y estamos interesados en sus servicios de catering.

Nos gustaría saber:

- ¿Qué menús ofrecen para bodas?
- ¿Tienen opciones para dietas especiales (vegetarianos, veganos, alergias)?
- ¿Incluyen servicio de camareros, menaje y mobiliario?
- ¿Ofrecen degustación previa del menú?
- Precio aproximado por persona

Esperamos su respuesta para valorar las distintas opciones.

Un cordial saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // DJ/Música
  MUSIC: {
    name: "DJ/Música - Consulta",
    subject: "Consulta sobre música/DJ para boda {{weddingDate}}",
    body: `Hola {{providerName}},

Estamos organizando nuestra boda para el {{weddingDate}} en {{weddingPlace}} y estamos buscando servicios de DJ/música para amenizar el evento.

Nos gustaría saber:

- ¿Qué servicios ofrecen exactamente?
- ¿Disponen de equipo de sonido e iluminación?
- ¿Tienen disponibilidad para nuestra fecha?
- ¿Durante cuántas horas darían servicio?
- ¿Es posible proporcionarles una lista de canciones de nuestra elección?
- ¿Podrían encargarse también de la música durante la ceremonia?

Agradecemos de antemano su respuesta.

Saludos cordiales,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Flores
  FLOWERS: {
    name: "Flores - Consulta",
    subject: "Consulta sobre decoración floral para boda {{weddingDate}}",
    body: `Estimado/a {{providerName}},

Estoy organizando mi boda que se celebrará el {{weddingDate}} en {{weddingPlace}} y estoy interesado/a en sus servicios de decoración floral.

Me gustaría recibir información sobre:

- Ramos de novia y complementos florales para novios
- Decoración floral para la ceremonia
- Centros de mesa para el banquete
- Disponibilidad y precios para la fecha indicada
- Proceso de diseño y posibilidad de personalización

Si tienen un catálogo o portfolio que puedan compartirme, sería de gran ayuda.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Lugar de celebración
  VENUE: {
    name: "Lugar de celebración - Consulta",
    subject: "Consulta sobre disponibilidad para boda {{weddingDate}}",
    body: `Estimado equipo de {{providerName}},

Mi pareja y yo estamos buscando un lugar para celebrar nuestra boda el {{weddingDate}}.

Nos gustaría saber:

- ¿Tienen disponibilidad para esa fecha?
- ¿Qué capacidad tiene el espacio?
- ¿Qué servicios incluye (catering propio, coordinación, decoración)?
- ¿Cuál es el precio aproximado por persona?
- ¿Es posible realizar tanto la ceremonia como el banquete en sus instalaciones?
- ¿Tienen limitaciones de horario?
- ¿Podríamos concertar una visita para conocer el espacio?

Agradecemos de antemano su atención.

Un cordial saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Vestido / Traje
  DRESS_SUIT: {
    name: "Vestido/Traje - Consulta",
    subject: "Consulta sobre cita para vestido/traje de boda",
    body: `Hola {{providerName}},

Estoy organizando mi boda para el {{weddingDate}} y estoy interesado/a en sus servicios para encontrar mi vestido/traje ideal.

Me gustaría saber:

- ¿Es necesario pedir cita previa?
- ¿Qué marcas o diseñadores tienen disponibles?
- ¿Cuál es el rango de precios?
- ¿Cuánto tiempo se necesita normalmente desde la compra hasta poder llevarlo?
- ¿Ofrecen servicio de ajustes y modificaciones?

Agradezco su atención y espero poder visitarles pronto.

Un saludo,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  },

  // Invitaciones
  INVITATIONS: {
    name: "Invitaciones - Consulta",
    subject: "Consulta sobre diseño de invitaciones para boda",
    body: `Hola {{providerName}},

Estamos organizando nuestra boda que tendrá lugar el {{weddingDate}} en {{weddingPlace}} y estamos interesados en sus servicios de diseño e impresión de invitaciones.

Nos gustaría saber:

- ¿Qué tipos de invitaciones ofrecen?
- ¿Realizan diseños personalizados?
- ¿Cuál es el tiempo de producción desde la aprobación del diseño?
- ¿Cuáles son sus tarifas aproximadas?
- ¿Ofrecen servicios adicionales como sobres, etiquetas, o tarjetas complementarias?

Esperamos su respuesta para poder avanzar con este aspecto de nuestra boda.

Muchas gracias,
{{userName}}
{{userPhone}}
{{userEmail}}
`
  }
};

/**
 * Obtener todas las plantillas disponibles
 * @returns {Object} Objeto con todas las plantillas
 */
export function getAllTemplates() {
  return EMAIL_TEMPLATES;
}

/**
 * Obtener una plantilla específica por su clave
 * @param {string} templateKey - Clave de la plantilla
 * @returns {Object|null} Plantilla o null si no existe
 */
export function getTemplate(templateKey) {
  return EMAIL_TEMPLATES[templateKey] || null;
}

/**
 * Aplicar los datos del proveedor y usuario a una plantilla
 * @param {string} templateKey - Clave de la plantilla
 * @param {Object} data - Datos para reemplazar en la plantilla
 * @returns {Object} Objeto con asunto y cuerpo procesados
 */
export function applyTemplate(templateKey, data) {
  const template = getTemplate(templateKey);
  if (!template) {
    throw new Error(`La plantilla ${templateKey} no existe`);
  }

  // Función para reemplazar variables en texto
  const replaceVars = (text, data) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  };

  // Aplicar reemplazos a asunto y cuerpo
  return {
    name: template.name,
    subject: replaceVars(template.subject, data),
    body: replaceVars(template.body, data)
  };
}

/**
 * Obtener listado de plantillas para mostrar en selector
 * @returns {Array} Array de objetos con key y name de cada plantilla
 */
export function getTemplateOptions() {
  return Object.entries(EMAIL_TEMPLATES).map(([key, template]) => ({
    key,
    name: template.name
  }));
}
