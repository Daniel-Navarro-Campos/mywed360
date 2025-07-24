# Sistema de Recomendaciones Inteligentes para Correos

## Introducción

Este documento describe el diseño e implementación del sistema de recomendaciones inteligentes para la redacción de correos electrónicos en Lovenda. Este sistema utiliza datos históricos de efectividad para sugerir acciones que mejoren la tasa de respuesta y efectividad de las comunicaciones con proveedores.

## Componentes Principales

El sistema de recomendaciones está compuesto por los siguientes elementos:

1. **EmailRecommendationService**: Servicio que genera recomendaciones basadas en métricas históricas
2. **EmailRecommendationsPanel**: Componente visual que muestra las recomendaciones al usuario
3. **SmartEmailComposer**: Componente mejorado para redactar correos con integración de recomendaciones
4. **Integración con AIEmailTrackingService**: Utiliza los datos recopilados para analizar patrones de efectividad

### Diagrama de Arquitectura

```
[AIEmailTrackingService] → [Métricas de efectividad] → [EmailRecommendationService]
                                                           ↓
[SmartEmailComposer] ←---------------------------- [EmailRecommendationsPanel]
        ↓                                                 ↑
  [Correo Final] → [Envío] → [Seguimiento] → [Actualización de métricas]
```

## EmailRecommendationService

### Propósito

Generar recomendaciones inteligentes basadas en los datos históricos de efectividad de correos previos, analizando patrones como tiempo de envío, personalización, uso de plantillas y tiempos de respuesta.

### Funciones Principales

#### `generateRecommendations(category, searchQuery)`

Genera un conjunto completo de recomendaciones personalizadas.

**Parámetros:**
- `category` (opcional): Categoría del proveedor para recomendaciones específicas
- `searchQuery` (opcional): Consulta de búsqueda original para contextualizar recomendaciones

**Retorna:**
- Objeto con recomendaciones estructuradas por tipo

#### `getRecommendationsHistory()`

Obtiene historial de recomendaciones previas.

**Retorna:**
- Array con recomendaciones históricas

#### `markRecommendationAsApplied(recommendationId)`

Marca una recomendación como aplicada para seguimiento de efectividad.

**Parámetros:**
- `recommendationId`: ID único de la recomendación

**Retorna:**
- Boolean indicando éxito

### Tipos de Recomendaciones Generadas

1. **Mejor momento para enviar**: Análisis de franjas horarias con mayor tasa de respuesta
2. **Líneas de asunto efectivas**: Patrones de asuntos que generan mayor tasa de apertura
3. **Impacto de personalización**: Análisis del efecto de personalizar mensajes vs. usar plantillas genéricas
4. **Plantillas recomendadas**: Recomendación de plantillas según categoría y efectividad histórica
5. **Expectativas de tiempo de respuesta**: Predicción de tiempo esperado para recibir respuesta
6. **Recomendaciones por categoría**: Consejos específicos según el tipo de proveedor
7. **Recomendaciones contextuales**: Sugerencias basadas en la consulta de búsqueda

## EmailRecommendationsPanel

### Propósito

Presentar visualmente las recomendaciones generadas al usuario de manera clara y accionable.

### Propiedades

- `category`: Categoría del proveedor (opcional)
- `searchQuery`: Consulta original de búsqueda (opcional)
- `onApplyRecommendation`: Callback llamado cuando el usuario aplica una recomendación

### Estructura de UI

- **Indicador de confianza**: Muestra la fiabilidad de las recomendaciones según cantidad de datos
- **Acordeones temáticos**: Organizan las recomendaciones por tipo
- **Botones de acción**: Permiten aplicar recomendaciones directamente
- **Visualización condicional**: Adapta el contenido según la disponibilidad de datos

## SmartEmailComposer

### Propósito

Componente avanzado para redactar correos electrónicos que integra las recomendaciones directamente en el flujo de trabajo de redacción.

### Propiedades

- `provider`: Información del proveedor destinatario
- `searchQuery`: Consulta original de búsqueda
- `onSend`: Callback para envío de correo
- `onCancel`: Callback para cancelar
- `templates`: Plantillas disponibles

### Características Principales

- **Panel de recomendaciones integrado**: Visible/oculto según preferencia
- **Aplicación directa**: Las recomendaciones se pueden aplicar con un clic
- **Programación inteligente**: Sugerencias de horario óptimo para envío
- **Feedback inmediato**: Notificaciones al aplicar recomendaciones
- **Seguimiento de aplicación**: Registro de qué recomendaciones se aplicaron

## Modelo de Datos

### Estructura de Recomendaciones

```javascript
{
  bestTimeToSend: {
    bestTimeSlot: "morning",
    bestTimeSlotName: "mañana (8-12h)",
    bestRate: "75.0",
    timeSlots: {...},
    hasSufficientData: true
  },
  subjectLineRecommendations: {...},
  templateRecommendations: {...},
  customizationImpact: {...},
  responseTimeExpectations: {...},
  categorySpecific: {...},
  querySpecific: {...},
  confidenceScore: 85
}
```

### Indicador de Confianza

El sistema calcula un "indicador de confianza" (0-100) para las recomendaciones basado en:

1. Cantidad total de datos históricos disponibles
2. Cantidad de datos específicos para la categoría consultada
3. Distribución de respuestas (penaliza si hay muy pocas o demasiadas)
4. Consistencia de los patrones detectados

## Integración en el Flujo de Trabajo

### Uso Típico

1. Usuario selecciona un proveedor desde resultados de búsqueda AI
2. Se abre `SmartEmailComposer` con contexto del proveedor y la búsqueda
3. El sistema genera recomendaciones en segundo plano
4. Usuario puede ver/ocultar panel de recomendaciones
5. Al aplicar recomendaciones, se registra para análisis futuro
6. Al enviar, se registran las recomendaciones aplicadas para seguimiento

### Ciclo de Mejora Continua

```
[Usuario envía correo] → [Se registran métricas] → [Se actualiza modelo de recomendación]
        ↑                                                      ↓
[Nuevas recomendaciones] ←-------------------------------------|
```

## Pruebas y Validación

El sistema incluye pruebas unitarias exhaustivas:

1. **EmailRecommendationService.test.js**: Valida la generación de recomendaciones y su precisión
2. **EmailRecommendationsPanel.test.jsx**: Valida la visualización correcta de recomendaciones (pendiente)
3. **SmartEmailComposer.test.jsx**: Valida la integración de recomendaciones en el compositor (pendiente)

## Métricas de Éxito

El éxito del sistema de recomendaciones se evalúa mediante:

1. **Tasa de adopción**: Porcentaje de recomendaciones aplicadas por los usuarios
2. **Mejora en tasa de respuesta**: Diferencia entre correos con/sin recomendaciones aplicadas
3. **Reducción en tiempo de respuesta**: Mejora en tiempos promedio de respuesta
4. **Feedback de usuario**: Valoración explícita de utilidad de recomendaciones

## Trabajo Futuro

Mejoras planificadas para el sistema:

1. **Aprendizaje automatizado**: Implementar modelos ML para mejorar predicciones
2. **Análisis de sentimiento**: Evaluar tono y contenido emocional de mensajes
3. **Pruebas A/B**: Sistema para comparar efectividad entre diferentes recomendaciones
4. **Personalización avanzada**: Adaptación a preferencias específicas de cada usuario
5. **Recomendaciones multilenguaje**: Soporte para recomendaciones en diversos idiomas

## Guía para Desarrolladores

### Integración del Sistema de Recomendaciones

Para integrar el sistema de recomendaciones en un nuevo componente:

```jsx
import EmailRecommendationService from '../../services/EmailRecommendationService';
import EmailRecommendationsPanel from './EmailRecommendationsPanel';

// Instanciar servicio
const recommendationService = new EmailRecommendationService();

// Generar recomendaciones
const recommendations = recommendationService.generateRecommendations(
  'fotografía',  // categoría
  'fotos para boda'  // consulta
);

// Manejar aplicación de recomendaciones
const handleApplyRecommendation = (type, data) => {
  // Implementar lógica específica según el tipo
  switch(type) {
    case 'subject':
      // Aplicar asunto recomendado
      break;
    case 'template':
      // Aplicar plantilla recomendada
      break;
    // etc.
  }
};

// Renderizar panel de recomendaciones
<EmailRecommendationsPanel
  category="fotografía"
  searchQuery="fotos para boda"
  onApplyRecommendation={handleApplyRecommendation}
/>
```

### Extensión del Sistema

Para añadir nuevos tipos de recomendaciones:

1. Añadir método en `EmailRecommendationService` para generar el nuevo tipo
2. Actualizar `generateRecommendations` para incluir el nuevo tipo
3. Añadir visualización en `EmailRecommendationsPanel`
4. Implementar lógica de aplicación en `SmartEmailComposer`
