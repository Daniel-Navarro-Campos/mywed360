# Sistema de Seguimiento y Análisis de Correos Electrónicos en Lovenda

## Introducción

Este documento describe la implementación del sistema de seguimiento y análisis de correos electrónicos en Lovenda, con especial énfasis en el tracking de correos generados mediante búsquedas AI de proveedores.

El sistema está diseñado para:
- Registrar y realizar seguimiento de correos enviados desde la búsqueda AI
- Proporcionar métricas de efectividad y comparación entre correos generados por AI vs. correos tradicionales
- Visualizar el historial de comunicaciones y su efectividad
- Analizar la efectividad por categoría de proveedor y tipo de plantilla

## Arquitectura del Sistema

El sistema de seguimiento de correos electrónicos se compone de los siguientes elementos:

1. **EmailTrackingService.js**: Servicio base para el seguimiento de correos generales
2. **AIEmailTrackingService.js**: Servicio especializado para el seguimiento y análisis de correos generados por AI
3. **AIEmailHistoryPanel.jsx**: Componente para visualizar métricas e historial de correos AI
4. **Integración con hooks**: Integración con `useAIProviderEmail` para registro automático de actividades

### Diagrama de Flujo

```
[Búsqueda AI] → [useAIProviderEmail] → [AIEmailModal] → [EmailService]
                       ↓                                      ↓
                  [EmailTemplateService]           [AIEmailTrackingService]
                                 ↘                 ↙
                              [LocalStorage]
                                   ↓
                           [AIEmailHistoryPanel]
```

## AIEmailTrackingService.js

### Propósito

Servicio especializado para registrar, analizar y generar métricas sobre correos electrónicos generados mediante la búsqueda AI de proveedores.

### API Principal

#### `registerActivity(aiResult, searchQuery, options)`

Registra una nueva actividad de correo electrónico generado por AI.

**Parámetros:**
- `aiResult`: Objeto con información del resultado AI utilizado
- `searchQuery`: Consulta original del usuario
- `options`: Opciones adicionales (templateCategory, wasCustomized, emailId)

**Retorna:**
- `string`: ID único del registro de actividad

#### `updateWithResponse(activityId, responseData)`

Actualiza una actividad cuando se recibe respuesta al correo.

**Parámetros:**
- `activityId`: ID de la actividad a actualizar
- `responseData`: Datos de la respuesta (score, etc.)

**Retorna:**
- `boolean`: Éxito de la operación

#### `getActivities(filters)`

Obtiene actividades registradas, con posibilidad de filtrar.

**Parámetros:**
- `filters`: Objeto con filtros (category, status, responded, customized, providerName)

**Retorna:**
- `Array`: Lista de actividades que coinciden con los filtros

#### `getMetrics()`

Obtiene métricas actuales de efectividad.

**Retorna:**
- `Object`: Métricas calculadas

#### `getComparisonData()`

Obtiene datos para comparación entre correos AI y correos tradicionales.

**Retorna:**
- `Object`: Datos comparativos estructurados

### Almacenamiento

El servicio utiliza localStorage para persistir información en desarrollo:

- `aiEmailActivities`: Almacena actividades de correos AI
- `aiEmailMetrics`: Almacena métricas calculadas

> **Nota**: En un entorno de producción, estos datos se deberían almacenar en una base de datos.

## AIEmailHistoryPanel.jsx

### Propósito

Componente que visualiza estadísticas e historial de correos originados desde búsquedas AI, permitiendo:
- Ver resumen de métricas clave
- Comparar efectividad de correos AI vs tradicionales
- Explorar el historial de actividades

### Estructura

El componente utiliza un sistema de pestañas para organizar la información:

1. **Resumen**: Tarjetas con métricas clave y gráficos de distribución
2. **Comparativa AI vs Tradicional**: Tabla comparativa y gráficos
3. **Historial de Actividad**: Lista detallada de correos enviados

### Integración con Chart.js

El componente utiliza Chart.js para visualizar datos mediante gráficos:
- Gráfico circular (Pie) para distribución de respuestas
- Gráficos de barras para comparativas y categorías

## Integración con AIEmailModal

El componente modal `AIEmailModal` debe integrarse con el sistema de seguimiento mediante:

1. Inyección del servicio `AIEmailTrackingService`
2. Registro de actividad al enviar correo
3. Seguimiento del estado del correo

```jsx
// Ejemplo de integración
const trackingService = new AIEmailTrackingService();

// Al enviar correo
const activityId = trackingService.registerActivity(
  selectedProvider,
  searchQuery,
  { 
    templateCategory: templateType,
    wasCustomized: isCustomized,
    emailId: sentEmailId
  }
);
```

## Métricas de Efectividad

El sistema calcula y analiza las siguientes métricas:

- **Tasa de respuesta**: Porcentaje de correos que reciben respuesta
- **Tiempo promedio de respuesta**: Horas promedio hasta recibir respuesta
- **Efectividad por categoría**: Análisis segmentado por tipo de proveedor
- **Comparativa AI vs tradicional**: Diferencia en efectividad

## Pruebas Unitarias

Las pruebas unitarias para el sistema de seguimiento se encuentran en:
- `src/test/services/AIEmailTrackingService.test.js`
- `src/test/components/email/AIEmailHistoryPanel.test.jsx` (pendiente de implementación)

## Planes Futuros

1. **Persistencia en base de datos**: Migrar almacenamiento de localStorage a una solución persistente
2. **Machine Learning**: Analizar patrones para recomendar mejoras en plantillas
3. **Notificaciones**: Sistema proactivo de alertas para seguimiento de correos importantes
4. **Exportación de informes**: Generación de informes PDF/Excel con métricas y análisis
5. **Integración con CRM**: Conectar seguimiento de correos con sistema CRM

---

## Guía de Implementación para Desarrolladores

### Registro de Actividad AI

Para registrar una nueva actividad de correo AI:

```javascript
import AIEmailTrackingService from '../../services/AIEmailTrackingService';

const trackingService = new AIEmailTrackingService();

// Al enviar correo desde resultados AI
const activityId = trackingService.registerActivity(
  aiResultItem,         // Resultado AI seleccionado
  originalSearchQuery,  // Consulta original
  {
    templateCategory: 'fotografía', // Categoría de plantilla usada
    wasCustomized: true,            // Si el usuario personalizó el mensaje
    emailId: 'email-123'            // ID del correo enviado
  }
);

// Guardar el activityId para actualización posterior
```

### Actualizar con Respuesta

Cuando se recibe una respuesta a un correo AI:

```javascript
// Al recibir respuesta
trackingService.updateWithResponse(
  savedActivityId,  // ID guardado al enviar
  {
    score: 5        // Puntuación de efectividad (opcional)
  }
);
```

### Visualizar Panel de Historial

Integrar el componente de panel de historial:

```jsx
import AIEmailHistoryPanel from '../../components/email/AIEmailHistoryPanel';

function EmailAnalytics() {
  return (
    <div className="analytics-container">
      <h2>Analíticas de Email</h2>
      <AIEmailHistoryPanel />
    </div>
  );
}
```
