/**
 * Plantillas de email generales para diversas situaciones
 */

const generalTemplates = [
  {
    id: 'template_general_consulta_1',
    name: 'Consulta general',
    category: 'General',
    subject: 'Consulta sobre {{tema_consulta}}',
    body: `
Estimado/a {{nombre_destinatario}},

Espero que este email le encuentre bien. Me dirijo a usted para realizar una consulta relacionada con {{tema_consulta}}.

{{detalle_consulta}}

Agradezco de antemano su atención y quedo a la espera de su respuesta.

Saludos cordiales,
{{nombre_remitente}}
{{datos_contacto}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'tema_consulta', 'detalle_consulta', 'nombre_remitente', 'datos_contacto']
  },
  {
    id: 'template_general_agradecimiento_1',
    name: 'Agradecimiento general',
    category: 'General',
    subject: 'Agradecimiento por {{motivo_agradecimiento}}',
    body: `
Estimado/a {{nombre_destinatario}},

Quería expresar mi más sincero agradecimiento por {{motivo_agradecimiento}}. Su ayuda/colaboración ha sido fundamental para {{beneficio_obtenido}}.

{{mensaje_personalizado}}

Nuevamente, muchas gracias por su tiempo y atención.

Atentamente,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'motivo_agradecimiento', 'beneficio_obtenido', 'mensaje_personalizado', 'nombre_remitente']
  },
  {
    id: 'template_general_recordatorio_1',
    name: 'Recordatorio de evento',
    category: 'General',
    subject: 'Recordatorio: {{nombre_evento}} el {{fecha_evento}}',
    body: `
Hola {{nombre_destinatario}},

Este es un recordatorio amistoso para el evento {{nombre_evento}} programado para el {{fecha_evento}} a las {{hora_evento}} en {{lugar_evento}}.

Detalles importantes a tener en cuenta:
- {{detalle_1}}
- {{detalle_2}}
- {{detalle_3}}

Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.

Saludos,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'nombre_evento', 'fecha_evento', 'hora_evento', 'lugar_evento', 'detalle_1', 'detalle_2', 'detalle_3', 'nombre_remitente']
  },
  {
    id: 'template_general_confirmacion_1',
    name: 'Confirmación de recepción',
    category: 'General',
    subject: 'Confirmación de recepción: {{asunto_original}}',
    body: `
Estimado/a {{nombre_destinatario}},

Le escribo para confirmar que he recibido su {{tipo_comunicacion}} sobre {{asunto_original}}. 

{{estado_solicitud}}

Me pondré en contacto con usted nuevamente {{tiempo_respuesta}} con más información.

Gracias por su paciencia.

Saludos cordiales,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'tipo_comunicacion', 'asunto_original', 'estado_solicitud', 'tiempo_respuesta', 'nombre_remitente']
  },
  {
    id: 'template_general_reunion_1',
    name: 'Solicitud de reunión',
    category: 'General',
    subject: 'Solicitud de reunión - {{tema_reunion}}',
    body: `
Hola {{nombre_destinatario}},

Me gustaría solicitar una reunión contigo para discutir sobre {{tema_reunion}}.

Propongo las siguientes opciones de fecha y hora:
- {{opcion_fecha_1}} a las {{opcion_hora_1}}
- {{opcion_fecha_2}} a las {{opcion_hora_2}}
- {{opcion_fecha_3}} a las {{opcion_hora_3}}

La reunión tendría una duración aproximada de {{duracion_estimada}} y podríamos realizarla {{modo_reunion}}.

Si ninguna de estas opciones te conviene, por favor indícame qué fechas y horarios serían más adecuados para ti.

Gracias por tu atención.

Saludos,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'tema_reunion', 'opcion_fecha_1', 'opcion_hora_1', 'opcion_fecha_2', 'opcion_hora_2', 'opcion_fecha_3', 'opcion_hora_3', 'duracion_estimada', 'modo_reunion', 'nombre_remitente']
  },
  {
    id: 'template_general_disculpa_1',
    name: 'Disculpa formal',
    category: 'General',
    subject: 'Disculpas por {{motivo_disculpa}}',
    body: `
Estimado/a {{nombre_destinatario}},

Quiero expresar mis sinceras disculpas por {{motivo_disculpa}}. Entiendo completamente el inconveniente que esto ha podido causarle y asumo toda la responsabilidad.

{{explicacion_situacion}}

Para remediar esta situación, me comprometo a {{solucion_propuesta}}.

Espero que pueda aceptar mis disculpas y le aseguro que tomaré todas las medidas necesarias para evitar que situaciones similares vuelvan a ocurrir en el futuro.

Atentamente,
{{nombre_remitente}}
    `,
    isSystem: true,
    variables: ['nombre_destinatario', 'motivo_disculpa', 'explicacion_situacion', 'solucion_propuesta', 'nombre_remitente']
  }
];

export default generalTemplates;
