import express from 'express';
import logger from '../logger.js';

const router = express.Router();

// Plantillas de email predefinidas para Lovenda
const EMAIL_TEMPLATES = [
  {
    id: 'wedding-invitation',
    name: 'Invitación de Boda',
    subject: '¡Estás invitado/a a nuestra boda! 💕',
    body: `¡Hola!

Nos complace invitarte a celebrar nuestro gran día con nosotros.

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
📍 Lugar: [LUGAR]

Tu presencia haría que este día sea aún más especial.

¡Esperamos verte allí!

Con amor,
[NOMBRES]`,
    category: 'invitation'
  },
  {
    id: 'save-the-date',
    name: 'Reserva la Fecha',
    subject: '¡Reserva la fecha! 📅 Nuestra boda',
    body: `¡Hola querido/a [NOMBRE]!

Queremos que seas uno de los primeros en saberlo...

¡NOS CASAMOS! 💍

📅 Fecha: [FECHA]
📍 Ciudad: [CIUDAD]

La invitación formal llegará pronto, pero queríamos asegurarnos de que reserves esta fecha especial.

¡No podemos esperar a celebrar contigo!

Con cariño,
[NOMBRES]`,
    category: 'save-the-date'
  },
  {
    id: 'thank-you',
    name: 'Agradecimiento',
    subject: 'Gracias por hacer nuestro día tan especial ❤️',
    body: `Querido/a [NOMBRE],

No tenemos palabras para expresar lo agradecidos que estamos por haber compartido nuestro día especial con nosotros.

Tu presencia, tu cariño y tu alegría hicieron que nuestra boda fuera perfecta.

Gracias por ser parte de nuestra historia de amor.

Con todo nuestro amor,
[NOMBRES]`,
    category: 'thank-you'
  },
  {
    id: 'rsvp-reminder',
    name: 'Recordatorio RSVP',
    subject: 'Recordatorio: Confirma tu asistencia a nuestra boda',
    body: `¡Hola [NOMBRE]!

Esperamos que hayas recibido nuestra invitación de boda.

Nos encantaría saber si podrás acompañarnos en nuestro gran día:

📅 Fecha: [FECHA]
🕐 Hora: [HORA]
📍 Lugar: [LUGAR]

Por favor, confirma tu asistencia antes del [FECHA_LIMITE].

¡Esperamos celebrar contigo!

Con amor,
[NOMBRES]`,
    category: 'rsvp'
  },
  {
    id: 'vendor-inquiry',
    name: 'Consulta a Proveedor',
    subject: 'Consulta para servicios de boda - [FECHA]',
    body: `Estimado/a [PROVEEDOR],

Esperamos que se encuentre bien. Nos ponemos en contacto porque estamos organizando nuestra boda y estamos interesados en sus servicios.

Detalles del evento:
📅 Fecha: [FECHA]
👥 Número de invitados: [INVITADOS]
📍 Ubicación: [LUGAR]

Nos gustaría conocer:
- Disponibilidad para la fecha
- Paquetes disponibles
- Precios
- Condiciones de contratación

Quedamos a la espera de su respuesta.

Saludos cordiales,
[NOMBRES]
[TELEFONO]
[EMAIL]`,
    category: 'vendor'
  }
];

/**
 * GET /api/email-templates
 * Obtiene las plantillas de email disponibles para el usuario
 */
router.get('/', async (req, res) => {
  try {
    const { user } = req.query;
    
    logger.info(`Obteniendo plantillas de email para usuario: ${user}`);
    
    // En una implementación real, aquí podrías filtrar plantillas por usuario
    // o cargar plantillas personalizadas desde la base de datos
    
    const templates = EMAIL_TEMPLATES.map(template => ({
      ...template,
      // Personalizar plantillas con datos del usuario si es necesario
      lastModified: new Date().toISOString(),
      owner: user || 'system'
    }));
    
    res.json({
      success: true,
      templates,
      total: templates.length
    });
    
  } catch (error) {
    logger.error('Error obteniendo plantillas de email:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * GET /api/email-templates/:id
 * Obtiene una plantilla específica por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = EMAIL_TEMPLATES.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Plantilla no encontrada'
      });
    }
    
    logger.info(`Plantilla ${id} obtenida correctamente`);
    
    res.json({
      success: true,
      template: {
        ...template,
        lastModified: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo plantilla:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * POST /api/email-templates
 * Crea una nueva plantilla personalizada (futuro)
 */
router.post('/', async (req, res) => {
  try {
    // Por ahora solo devolvemos las plantillas predefinidas
    res.status(501).json({
      success: false,
      error: 'Funcionalidad no implementada',
      message: 'La creación de plantillas personalizadas estará disponible próximamente'
    });
  } catch (error) {
    logger.error('Error creando plantilla:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
