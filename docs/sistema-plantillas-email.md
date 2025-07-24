# Sistema de Plantillas de Email en Lovenda

## Descripción General

El sistema de plantillas de email en Lovenda permite a los usuarios crear, editar, guardar y utilizar diferentes plantillas de correo electrónico para comunicarse con proveedores, invitados y otros contactos relevantes en la organización de bodas. El sistema incluye plantillas predefinidas categorizadas por su uso y permite a los usuarios crear sus propias plantillas personalizadas.

## Estructura del Sistema

El sistema de plantillas de email está compuesto por los siguientes componentes principales:

### 1. Plantillas Predefinidas

Las plantillas predefinidas se organizan en archivos JavaScript separados según su categoría:

- `src/data/templates/proveedorTemplates.js`: Plantillas para comunicación con proveedores
- `src/data/templates/invitadosTemplates.js`: Plantillas para comunicación con invitados
- `src/data/templates/generalTemplates.js`: Plantillas de uso general
- `src/data/templates/seguimientoTemplates.js`: Plantillas para seguimiento de tareas y eventos

Todas estas plantillas se importan y exportan desde un archivo central:
- `src/data/templates/index.js`: Centraliza la importación y exportación de todas las plantillas

### 2. Servicio de Gestión de Email

El servicio EmailService (`src/services/EmailService.js`) proporciona las siguientes funcionalidades:

- Carga y guardado de emails
- Envío y recepción de emails
- Gestión de plantillas de email:
  - `getEmailTemplates()`: Obtiene todas las plantillas disponibles
  - `saveEmailTemplate(template)`: Guarda o actualiza una plantilla
  - `deleteEmailTemplate(templateId)`: Elimina una plantilla personalizada
  - `resetPredefinedTemplates()`: Restaura las plantillas predefinidas del sistema

### 3. Componente de Gestión de Plantillas

El componente `EmailTemplateManager` (`src/components/email/EmailTemplateManager.jsx`) proporciona la interfaz de usuario para:

- Visualizar plantillas existentes agrupadas por categoría
- Crear nuevas plantillas personalizadas
- Editar plantillas existentes (solo las no marcadas como del sistema)
- Eliminar plantillas personalizadas
- Restablecer las plantillas predefinidas del sistema
- Seleccionar plantillas para su uso en la composición de emails

## Estructura de Datos de las Plantillas

Cada plantilla de email tiene la siguiente estructura:

```javascript
{
  id: 'identificador_unico',
  name: 'Nombre de la plantilla',
  category: 'Categoría',
  subject: 'Asunto del email',
  body: 'Cuerpo del email con variables como {{nombre_variable}}',
  isSystem: true/false, // Indica si es una plantilla predefinida del sistema
  variables: ['variable1', 'variable2', ...] // Lista de variables utilizadas en la plantilla
}
```

## Categorías de Plantillas

El sistema actualmente incluye las siguientes categorías de plantillas:

1. **Proveedores**:
   - Solicitud de información
   - Confirmación
   - Cancelación
   - Seguimiento

2. **Invitados**:
   - Información
   - Recordatorio

3. **Seguimiento**:
   - Seguimiento de tareas pendientes
   - Seguimiento de confirmaciones
   - Seguimiento de pagos a proveedores
   - Organización despedida de soltero/a
   - Seguimiento de regalos recibidos
   - Confirmación de timing del evento

4. **General**:
   - Plantillas para uso general no específico

## Sistema de Almacenamiento

El sistema utiliza un enfoque dual para el almacenamiento de plantillas:

1. **Backend** (cuando está disponible):
   - Las plantillas se guardan y recuperan a través de la API del servidor

2. **LocalStorage** (respaldo):
   - En caso de que el backend no esté disponible, las plantillas se almacenan en localStorage
   - Clave utilizada: `'lovenda_email_templates'`

## Variables en Plantillas

Las plantillas utilizan un sistema de variables con la sintaxis `{{nombre_variable}}` para facilitar la personalización de los mensajes. Cada plantilla incluye una lista de las variables que utiliza, lo que permite a la interfaz generar automáticamente campos para que el usuario introduzca los valores correspondientes.

## Protección de Plantillas del Sistema

Las plantillas marcadas como `isSystem: true` están protegidas contra eliminación. Estas plantillas pueden ser modificadas temporalmente para su uso, pero no pueden ser eliminadas ni modificadas permanentemente. Si un usuario desea una versión personalizada de una plantilla del sistema, puede duplicarla y modificar la copia.

## Funcionalidad de Restablecimiento

El sistema incluye una funcionalidad para restablecer las plantillas predefinidas a su estado original, lo que resulta útil si:

- Las plantillas predefinidas han sido modificadas accidentalmente
- Se han eliminado plantillas predefinidas del almacenamiento local
- Se ha actualizado el conjunto de plantillas predefinidas con nuevas versiones

Esta función conserva las plantillas personalizadas del usuario mientras restaura o actualiza las plantillas predefinidas del sistema.

## Mejores Prácticas para Extender el Sistema

### Añadir Nuevas Categorías

1. Crear un nuevo archivo en `src/data/templates/` (p.ej., `nuevaCategoriaTemplates.js`)
2. Seguir el formato estándar de definición de plantillas
3. Importar y exportar las nuevas plantillas en `src/data/templates/index.js`

### Añadir Nuevas Plantillas a Categorías Existentes

1. Añadir la nueva plantilla al archivo correspondiente en `src/data/templates/`
2. Asignar un ID único que siga la convención de nomenclatura existente
3. Establecer `isSystem: true` para plantillas predefinidas

### Personalización de la Interfaz de Plantillas

El componente `EmailTemplateManager.jsx` puede ser extendido para añadir:
- Nuevas funcionalidades de filtrado
- Búsqueda de plantillas
- Vista previa mejorada
- Opciones adicionales de personalización

## Consideraciones de Rendimiento

Para optimizar el rendimiento del sistema de plantillas, especialmente en dispositivos móviles:

1. **Lazy Loading**: Considerar cargar las definiciones de plantillas bajo demanda
2. **Paginación**: Implementar paginación para visualizar grandes conjuntos de plantillas
3. **Compresión de Datos**: Considerar comprimir las plantillas guardadas en localStorage
4. **Caché**: Implementar estrategias de caché para reducir solicitudes repetidas al backend

## Futuras Mejoras

Algunas posibles mejoras para el sistema de plantillas incluyen:

1. **Editor WYSIWYG**: Incorporar un editor visual para la creación de plantillas
2. **Categorías personalizadas**: Permitir a los usuarios crear sus propias categorías
3. **Etiquetas**: Añadir un sistema de etiquetas para facilitar la búsqueda
4. **Estadísticas de uso**: Seguimiento de qué plantillas se utilizan con mayor frecuencia
5. **Versiones de plantillas**: Control de versiones para las plantillas predefinidas
6. **Importación/Exportación**: Funcionalidad para importar y exportar conjuntos de plantillas

## Integración con el Sistema de Email

El sistema de plantillas está diseñado para integrarse perfectamente con el componente de composición de emails, permitiendo a los usuarios:

1. Seleccionar una plantilla
2. Completar las variables requeridas
3. Personalizar adicionalmente el contenido si es necesario
4. Enviar el email resultante

Esta integración facilita la comunicación consistente y eficiente con proveedores, invitados y otros contactos relevantes en la organización de bodas.
