/**
 * Plantillas de email predefinidas para comunicación con invitados
 */

const invitadosTemplates = [
  {
    id: 'template_invitados_info_1',
    name: 'Información inicial y save the date',
    category: 'Invitados - Información',
    subject: 'Save the Date - Nuestra boda el {{fecha_boda}}',
    body: `
Querido/a {{nombre_invitado}},

¡Nos casamos! Y queremos que formes parte de este día tan especial.

Te escribimos para que reserves la fecha del {{fecha_boda}}, día en que celebraremos nuestra boda en {{lugar_boda}}.

En las próximas semanas recibirás la invitación oficial con todos los detalles del evento, pero queríamos que fueras de los primeros en conocer la noticia y apartar la fecha en tu agenda.

Estamos muy ilusionados de poder compartir este momento tan importante con las personas que queremos.

Con cariño,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'lugar_boda', 'nombre_novios']
  },
  {
    id: 'template_invitados_info_2',
    name: 'Invitación formal',
    category: 'Invitados - Información',
    subject: 'Invitación a nuestra boda - {{fecha_boda}}',
    body: `
Querido/a {{nombre_invitado}},

Tenemos el placer de invitarte formalmente a nuestra ceremonia de boda que se celebrará el {{fecha_boda}} a las {{hora_ceremonia}} en {{lugar_ceremonia}}.

Después de la ceremonia, la celebración continuará en {{lugar_recepcion}} a partir de las {{hora_recepcion}}.

Información importante:
- Código de vestimenta: {{codigo_vestimenta}}
- Confirmación de asistencia: Por favor, confirma tu asistencia antes del {{fecha_limite_confirmacion}}
- Alojamiento: {{informacion_alojamiento}}
- Cómo llegar: {{informacion_transporte}}

Si tienes alguna restricción alimentaria o necesidad especial, házmelo saber lo antes posible para poder tenerlo en cuenta.

Esperamos poder compartir este día tan especial contigo.

Con mucho cariño,
{{nombre_novios}}

P.D.: Hemos creado un sitio web con toda la información detallada sobre la boda. Puedes visitarlo aquí: {{enlace_web_boda}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'hora_ceremonia', 'lugar_ceremonia', 'lugar_recepcion', 'hora_recepcion', 'codigo_vestimenta', 'fecha_limite_confirmacion', 'informacion_alojamiento', 'informacion_transporte', 'nombre_novios', 'enlace_web_boda']
  },
  {
    id: 'template_invitados_info_3',
    name: 'Información sobre lista de bodas',
    category: 'Invitados - Información',
    subject: 'Información sobre nuestra lista de bodas',
    body: `
Querido/a {{nombre_invitado}},

Muchas gracias por confirmar tu asistencia a nuestra boda el próximo {{fecha_boda}}. Estamos muy ilusionados de poder contar con tu presencia en este día tan especial.

Como respuesta a las preguntas que algunos nos habéis hecho sobre regalos, hemos creado una lista de bodas que puedes consultar a través del siguiente enlace:

{{enlace_lista_bodas}}

Por supuesto, tu presencia es el mejor regalo que podemos recibir, así que no sientas ninguna obligación. Lo más importante para nosotros es poder compartir este día contigo.

Si tienes cualquier duda, no dudes en contactarnos.

Con cariño,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'enlace_lista_bodas', 'nombre_novios']
  },
  {
    id: 'template_invitados_recordatorio_1',
    name: 'Recordatorio de confirmación',
    category: 'Invitados - Recordatorio',
    subject: 'Recordatorio: Confirmación de asistencia a nuestra boda',
    body: `
Querido/a {{nombre_invitado}},

Esperamos que te encuentres bien. Te escribimos porque la fecha de nuestra boda ({{fecha_boda}}) se acerca y estamos finalizando los preparativos.

Nos gustaría saber si podrás acompañarnos en este día tan especial. Si aún no has confirmado tu asistencia, ¿podrías hacerlo antes del {{fecha_limite_confirmacion}}? Puedes responder a este email o utilizar el siguiente enlace:

{{enlace_confirmacion}}

Tu respuesta nos ayudará mucho con la organización final del evento.

Si tienes alguna restricción alimentaria o necesidad especial, por favor házmelo saber.

¡Gracias por tu atención!

Con cariño,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'fecha_limite_confirmacion', 'enlace_confirmacion', 'nombre_novios']
  },
  {
    id: 'template_invitados_recordatorio_2',
    name: 'Recordatorio final con detalles',
    category: 'Invitados - Recordatorio',
    subject: 'Recordatorio y detalles finales - Nuestra boda este {{dia_semana}}',
    body: `
Querido/a {{nombre_invitado}},

¡Ya queda muy poco para nuestra boda! Este {{dia_semana}} {{fecha_boda}} por fin celebraremos nuestro gran día y estamos muy ilusionados de poder compartirlo contigo.

Quería recordarte los detalles más importantes:

- Ceremonia: {{hora_ceremonia}} en {{lugar_ceremonia}}
- Recepción: {{hora_recepcion}} en {{lugar_recepcion}}
- Código de vestimenta: {{codigo_vestimenta}}
- Aparcamiento: {{informacion_aparcamiento}}
- Previsión meteorológica: {{prevision_tiempo}}

Si necesitas cualquier indicación adicional o tienes alguna duda de última hora, no dudes en contactarnos.

¡Estamos deseando verte y celebrar juntos!

Con mucha ilusión,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'dia_semana', 'fecha_boda', 'hora_ceremonia', 'lugar_ceremonia', 'hora_recepcion', 'lugar_recepcion', 'codigo_vestimenta', 'informacion_aparcamiento', 'prevision_tiempo', 'nombre_novios']
  },
  {
    id: 'template_invitados_agradecimiento',
    name: 'Agradecimiento post-boda',
    category: 'Invitados - Información',
    subject: 'Gracias por compartir nuestro día especial',
    body: `
Querido/a {{nombre_invitado}},

Queremos expresar nuestro más sincero agradecimiento por haber sido parte de nuestra boda el pasado {{fecha_boda}}. Tu presencia y cariño hicieron de este día algo verdaderamente memorable para nosotros.

{{agradecimiento_regalo}}

Estamos muy felices de haber podido compartir este momento tan importante de nuestras vidas con las personas que más queremos.

En las próximas semanas compartiremos algunas fotos del evento.

Con todo nuestro cariño y gratitud,
{{nombre_novios}}
    `,
    isSystem: true,
    variables: ['nombre_invitado', 'fecha_boda', 'agradecimiento_regalo', 'nombre_novios']
  },
];

export default invitadosTemplates;
