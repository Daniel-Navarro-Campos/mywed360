/**
 * Plantillas de email predefinidas para comunicación con proveedores
 */

const proveedorTemplates = [
  {
    id: 'template_proveedor_solicitud_info_1',
    name: 'Solicitud inicial de información',
    category: 'Proveedores - Solicitud de información',
    subject: 'Solicitud de información para {{servicio}} - Boda {{fecha_boda}}',
    body: `
Estimado/a {{nombre_proveedor}},

Esperamos que este email le encuentre bien. Mi nombre es {{nombre_cliente}} y estoy organizando mi boda que tendrá lugar el {{fecha_boda}} en {{lugar_boda}}.

Estamos interesados en sus servicios de {{servicio}} y nos gustaría recibir más información sobre:

- Disponibilidad para la fecha mencionada
- Paquetes y servicios que ofrecen
- Precios aproximados y opciones de presupuesto
- Proceso de reserva y calendario de pagos

Tenemos prevista una asistencia de aproximadamente {{numero_invitados}} invitados.

Estaré encantado/a de proporcionar cualquier información adicional que pueda necesitar para elaborar una propuesta adecuada a nuestras necesidades.

Quedo a la espera de su respuesta.

Saludos cordiales,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'servicio', 'fecha_boda', 'lugar_boda', 'nombre_cliente', 'numero_invitados', 'telefono_cliente']
  },
  {
    id: 'template_proveedor_solicitud_info_2',
    name: 'Solicitud detallada de presupuesto',
    category: 'Proveedores - Solicitud de información',
    subject: 'Solicitud de presupuesto detallado para {{servicio}}',
    body: `
Estimado/a {{nombre_proveedor}},

Tras revisar la información inicial que nos proporcionó sobre sus servicios de {{servicio}}, estamos muy interesados en seguir adelante y nos gustaría solicitar un presupuesto más detallado.

Detalles de nuestra boda:
- Fecha: {{fecha_boda}}
- Lugar: {{lugar_boda}}
- Número de invitados: {{numero_invitados}}
- Horario aproximado: {{horario_evento}}

Estamos especialmente interesados en:
{{detalles_especificos}}

Nuestro presupuesto aproximado para este servicio es de {{presupuesto}}, ¿podría indicarnos qué opciones se ajustarían a este rango?

Agradecemos de antemano su tiempo y quedamos a la espera de su respuesta.

Atentamente,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'servicio', 'fecha_boda', 'lugar_boda', 'numero_invitados', 'horario_evento', 'detalles_especificos', 'presupuesto', 'nombre_cliente', 'telefono_cliente']
  },
  {
    id: 'template_proveedor_confirmacion_1',
    name: 'Confirmación de contratación',
    category: 'Proveedores - Confirmación',
    subject: 'Confirmación de contratación de servicios para boda {{fecha_boda}}',
    body: `
Estimado/a {{nombre_proveedor}},

Me complace confirmar que hemos decidido contratar sus servicios de {{servicio}} para nuestra boda que se celebrará el {{fecha_boda}} en {{lugar_boda}}.

Estamos muy satisfechos con la propuesta que nos ha enviado y creemos que se ajusta perfectamente a lo que estábamos buscando. 

Para proceder con la formalización del contrato y realizar el primer pago, ¿podría indicarnos los siguientes pasos a seguir? ¿Necesitamos concertar una reunión para discutir los detalles finales o podemos proceder directamente?

Quedamos a la espera de sus indicaciones para avanzar con el proceso.

Un cordial saludo,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'servicio', 'fecha_boda', 'lugar_boda', 'nombre_cliente', 'telefono_cliente']
  },
  {
    id: 'template_proveedor_confirmacion_2',
    name: 'Confirmación de detalles finales',
    category: 'Proveedores - Confirmación',
    subject: 'Confirmación de detalles finales para {{servicio}} - Boda {{fecha_boda}}',
    body: `
Estimado/a {{nombre_proveedor}},

Espero que se encuentre bien. A medida que se acerca nuestra fecha de boda ({{fecha_boda}}), me gustaría confirmar algunos detalles finales sobre el servicio de {{servicio}} que hemos contratado con ustedes.

Según lo acordado:
- Fecha del evento: {{fecha_boda}}
- Horario de inicio: {{hora_inicio}}
- Horario de finalización: {{hora_fin}}
- Lugar: {{lugar_boda}}
- Número confirmado de invitados: {{numero_invitados_final}}

¿Podría por favor confirmar que todos estos detalles son correctos según su registro?

Además, ¿hay algo específico que necesitemos saber o proporcionar antes del gran día?

Gracias por su atención y por ayudarnos a hacer de nuestra boda un día especial.

Saludos cordiales,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'servicio', 'fecha_boda', 'hora_inicio', 'hora_fin', 'lugar_boda', 'numero_invitados_final', 'nombre_cliente', 'telefono_cliente']
  },
  {
    id: 'template_proveedor_cancelacion_1',
    name: 'Cancelación de servicios',
    category: 'Proveedores - Cancelación',
    subject: 'Cancelación de servicios para boda del {{fecha_boda}}',
    body: `
Estimado/a {{nombre_proveedor}},

Lamento comunicarle que debido a {{motivo_cancelacion}}, nos vemos en la necesidad de cancelar los servicios de {{servicio}} que teníamos contratados para nuestra boda del {{fecha_boda}}.

Entendemos que esta cancelación puede causar inconvenientes, y estamos dispuestos a cumplir con las condiciones de cancelación establecidas en nuestro contrato. Por favor, háganme saber los próximos pasos a seguir conforme a lo acordado.

Si hubiera alguna posibilidad de reducir o ajustar los cargos por cancelación dadas las circunstancias, lo agradeceríamos enormemente.

Le agradezco su comprensión y lamento cualquier inconveniente causado.

Atentamente,
{{nombre_cliente}}
{{telefono_cliente}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'motivo_cancelacion', 'servicio', 'fecha_boda', 'nombre_cliente', 'telefono_cliente']
  },
  {
    id: 'template_proveedor_seguimiento_1',
    name: 'Seguimiento post-evento',
    category: 'Proveedores - Seguimiento',
    subject: 'Agradecimiento por sus servicios en nuestra boda',
    body: `
Estimado/a {{nombre_proveedor}},

Queremos expresar nuestro sincero agradecimiento por los excelentes servicios de {{servicio}} que proporcionaron en nuestra boda el pasado {{fecha_boda}}.

{{comentario_personalizado}}

Su profesionalidad y atención a los detalles contribuyeron significativamente a hacer de nuestro día especial un evento inolvidable tanto para nosotros como para nuestros invitados.

Si hay algún portal o plataforma donde podamos dejar una reseña positiva sobre su trabajo, no dude en indicárnoslo, ya que estaríamos encantados de recomendarles a futuros clientes.

Nuevamente, muchas gracias por ser parte de nuestro día especial.

Saludos cordiales,
{{nombre_cliente}} y {{nombre_pareja}}
    `,
    isSystem: true,
    variables: ['nombre_proveedor', 'servicio', 'fecha_boda', 'comentario_personalizado', 'nombre_cliente', 'nombre_pareja']
  },
];

export default proveedorTemplates;
