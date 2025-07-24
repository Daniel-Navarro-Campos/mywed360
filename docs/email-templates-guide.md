# Guía del Sistema de Plantillas de Correo Electrónico en Lovenda

## Introducción

El sistema de plantillas de correo electrónico permite generar contenido personalizado para comunicaciones con proveedores basado en:

1. La categoría del proveedor (fotografía, catering, florista, etc.)
2. El contexto de la búsqueda del usuario
3. Los resultados del análisis AI de proveedores

Este documento describe cómo está implementado el sistema, cómo extenderlo y cómo usarlo en diferentes contextos.

## Arquitectura

El sistema de plantillas está construido sobre los siguientes componentes:

### 1. EmailTemplateService.js

Este servicio es el núcleo del sistema de plantillas. Contiene:

- Plantillas predefinidas por categoría
- Lógica para seleccionar la plantilla adecuada según el contexto
- Métodos para reemplazar variables dentro de las plantillas
- Registro de uso para analítica y mejora continua

### 2. useAIProviderEmail.js

Hook personalizado que integra el servicio de plantillas con la búsqueda AI de proveedores, permitiendo:

- Generar asuntos personalizados basados en la categoría del proveedor
- Generar cuerpos de correo personalizados con información contextual
- Incluir insights de AI relevantes a la búsqueda del usuario

## Plantillas Disponibles

Actualmente, el sistema incluye plantillas específicas para las siguientes categorías:

| Categoría | Descripción | Variables Específicas |
|-----------|-------------|------------------------|
| fotografía | Plantilla para servicios de fotografía | Estilo fotográfico, paquetes, fecha |
| catering | Plantilla para servicios gastronómicos | Menús, invitados, requisitos alimentarios |
| florista | Plantilla para decoración floral | Estilos, colores, temporada |
| música | Plantilla para servicios musicales | Repertorio, duración, equipamiento |
| local | Plantilla para espacios y fincas | Capacidad, servicios incluidos, facilidades |
| general | Plantilla genérica para otros servicios | Adaptable a cualquier contexto |

## Estructura de una Plantilla

Cada plantilla contiene:

1. **Subject**: Asunto del correo con variables entre llaves `{variable}`
2. **Body**: Cuerpo del correo con secciones estructuradas y variables personalizables

### Variables Disponibles

Las plantillas pueden usar cualquiera de estas variables:

- `{providerName}`: Nombre del proveedor
- `{searchQuery}`: La consulta original del usuario
- `{aiInsight}`: Análisis personalizado generado por AI
- `{date}`: Fecha tentativa (formateada según el locale)
- `{price}`: Información de precios si está disponible
- `{location}`: Ubicación del proveedor
- `{userName}`: Nombre del usuario que envía el correo
- `{guests}`: Número de invitados (para bodas y eventos)

## Cómo Extender el Sistema

### Añadir Nueva Categoría

Para añadir soporte para una nueva categoría de proveedores:

1. Edita `EmailTemplateService.js` y añade la nueva plantilla en el método `loadDefaultTemplates()`:

```javascript
this.templates = {
  // Plantillas existentes...
  
  nuevaCategoria: {
    subject: 'Asunto personalizado para {providerName}',
    body: `
      Contenido personalizado...
      Con variables como {searchQuery}
    `
  }
}
```

2. Actualiza el método `getTemplateByCategory()` para reconocer la nueva categoría:

```javascript
if (normalizedCategory.includes('nueva') || normalizedCategory.includes('categoria')) {
  return this.templates.nuevaCategoria;
}
```

### Personalizar Plantillas Existentes

Para modificar plantillas existentes:

1. Localiza la plantilla deseada en `loadDefaultTemplates()`
2. Modifica el contenido de `subject` o `body` según sea necesario
3. Mantén las variables existentes o añade nuevas según tu necesidad

## Análisis y Mejora de Plantillas

El sistema incluye un método `logTemplateUsage()` que registra el uso de plantillas. Esta información se puede usar para:

1. Analizar qué categorías son más utilizadas
2. Identificar qué plantillas reciben más personalizaciones manuales
3. Mejorar continuamente las plantillas basándose en datos reales de uso

## Pruebas

El sistema de plantillas está cubierto por pruebas unitarias que verifican:

1. La correcta selección de plantillas según la categoría
2. El reemplazo adecuado de variables
3. El manejo de casos límite (categorías desconocidas, variables faltantes)

## Ejemplo de Uso

```javascript
import EmailTemplateService from '../services/EmailTemplateService';

// Crear instancia del servicio
const templateService = new EmailTemplateService();

// Datos para la plantilla
const templateData = {
  providerName: 'Estudio Fotográfico Luz',
  searchQuery: 'fotografía estilo documental para boda',
  aiInsight: 'Este estudio tiene excelentes reseñas para fotografía documental',
  date: '15 de julio de 2025',
  userName: 'María',
  guests: '120'
};

// Generar asunto personalizado
const subject = templateService.generateSubjectFromTemplate('fotografía', templateData);

// Generar cuerpo personalizado
const body = templateService.generateBodyFromTemplate('fotografía', templateData);

// Registrar uso de la plantilla (para análisis)
templateService.logTemplateUsage('fotografía', aiResultObject, false);
```

## Consideraciones para el Futuro

Posibles mejoras para el sistema de plantillas:

1. **Aprendizaje automático**: Ajustar plantillas basándose en tasas de respuesta
2. **Más personalización**: Añadir más variables contextuales
3. **Integración con calendario**: Incluir propuestas de fechas de reunión
4. **Versiones multilingües**: Soporte para plantillas en diferentes idiomas
