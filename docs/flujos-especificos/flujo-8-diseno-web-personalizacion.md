# 8. Flujo de Diseño Web y Personalización (Detallado)

## 8.1 Generación Automática de Sitio Web
**Objetivo:** Generar sitios web personalizados automáticamente usando IA y prompts editables

### Selección de Prompt y Generación
**Pasos detallados:**
- [ ] **Navegación al generador**
  - Desde dashboard principal → "Diseño Web"
  - Redirección a `/diseno-web`
  - Componente: `WebGenerator.jsx`

- [ ] **Selección de prompt base**
  - Prompt "Boda Clásica y Elegante"
  - Prompt "Boda Moderna y Minimalista"
  - Prompt "Boda Rústica y Natural"
  - Prompt "Boda Temática Personalizada"

- [ ] **Edición del prompt**
  - Editor de texto para personalizar el prompt
  - Variables automáticas: {nombres}, {fecha}, {ubicacion}
  - Vista previa del prompt final
  - Guardado de prompts personalizados

### Generación con Un Solo Botón
**Pasos detallados:**
- [ ] **Proceso de generación**
  - Botón "Generar Sitio Web" prominente
  - Uso de datos existentes del sistema (nombres, fecha, ubicación, invitados)
  - Generación automática con IA usando OpenAI API
  - Indicador de progreso durante generación

- [ ] **Contenido generado automáticamente**
  - Estructura HTML completa
  - Estilos CSS personalizados
  - Contenido de texto adaptado al estilo
  - Integración automática de datos de la boda
  - Formulario RSVP funcional

## 8.2 Sistema de Prompts Inteligentes
**Objetivo:** Proporcionar prompts base editables para diferentes estilos de boda

### Biblioteca de Prompts
**Pasos detallados:**
- [ ] **Prompts predefinidos**
  - "Crea un sitio web elegante y clásico para la boda de {nombres} el {fecha} en {ubicacion}. Incluye secciones de historia, ceremonia, celebración y RSVP con un diseño sofisticado en tonos dorados y blancos."
  - "Diseña un sitio web moderno y minimalista para {nombres}. Usa tipografías limpias, mucho espacio en blanco y una paleta de colores neutros. Enfócate en la funcionalidad y simplicidad."
  - "Genera un sitio web rústico y natural para la boda de {nombres} en {ubicacion}. Incorpora elementos naturales, texturas de madera y una sensación acogedora y campestre."

- [ ] **Editor de prompts**
  - Componente: `PromptEditor.jsx`
  - Textarea con syntax highlighting
  - Variables dinámicas resaltadas
  - Vista previa de prompt procesado
  - Validación de variables requeridas

- [ ] **Gestión de prompts personalizados**
  - Guardar prompts editados
  - Biblioteca personal de prompts
  - Compartir prompts entre bodas (wedding planners)
  - Historial de prompts utilizados

### Integración con Datos del Sistema
**Pasos detallados:**
- [ ] **Variables automáticas**
  - {nombres}: Nombres de la pareja desde perfil
  - {fecha}: Fecha de la boda desde configuración
  - {ubicacion}: Lugar de ceremonia y celebración
  - {invitados}: Número total de invitados
  - {historia}: Historia de la pareja si está disponible

- [ ] **Contenido dinámico**
  - Información de ceremonia y celebración
  - Lista de eventos del cronograma
  - Galería de fotos subidas
  - Información de alojamiento para invitados
  - Detalles de transporte

- [ ] **Funcionalidades integradas**
  - Formulario RSVP conectado al sistema
  - Contador regresivo automático
  - Mapa de ubicación con direcciones
  - Enlaces a redes sociales de la pareja

## 8.3 Generación con IA y Publicación
**Objetivo:** Generar y publicar sitios web automáticamente usando inteligencia artificial

### Proceso de Generación IA
**Pasos detallados:**
- [ ] **Llamada a OpenAI API**
  - Componente: `AIWebGenerator.jsx`
  - Prompt procesado con variables reales
  - Generación de HTML, CSS y JavaScript
  - Estructura responsive automática
  - Optimización para móviles

- [ ] **Post-procesamiento**
  - Validación de HTML generado
  - Inyección de funcionalidades específicas (RSVP, contador)
  - Optimización de imágenes automática
  - Minificación de código

- [ ] **Configuración automática**
  - Subdominio automático: `{nombres-slug}-{año}.mywed360.com`
  - Certificado SSL automático
  - CDN para assets estáticos
  - Analytics básicos integrados

### Publicación Instantánea
**Pasos detallados:**
- [ ] **Publicación automática**
  - Despliegue inmediato tras generación
  - URL disponible instantáneamente
  - Notificación con enlace final
  - Compartir automático con colaboradores

- [ ] **Regeneración cuando sea necesario**
  - Botón "Regenerar Sitio" disponible
  - Mantiene URL existente
  - Actualización automática de datos
  - Historial de versiones generadas

## 8.4 Funcionalidades Automáticas Integradas
**Objetivo:** Características que se generan automáticamente con la IA

### Elementos Generados Automáticamente
**Pasos detallados:**
- [ ] **Formulario RSVP funcional**
  - Conectado directamente al sistema de confirmaciones
  - Validación automática de invitados
  - Gestión de acompañantes
  - Restricciones dietéticas

- [ ] **Contador regresivo**
  - Cálculo automático hasta la fecha de boda
  - Actualización en tiempo real
  - Múltiples formatos (días, horas, minutos)
  - Personalización visual según el estilo

- [ ] **Información dinámica**
  - Detalles de ceremonia y celebración
  - Información de alojamiento
  - Instrucciones de transporte
  - Cronograma del día

### Integraciones del Sistema
**Pasos detallados:**
- [ ] **Galería automática**
  - Fotos subidas al sistema de la boda
  - Organización automática por fecha
  - Slideshow responsive
  - Carga lazy para performance

- [ ] **Mapa de ubicación**
  - Integración automática con Google Maps
  - Marcadores para ceremonia y celebración
  - Direcciones desde ubicaciones comunes
  - Información de parking disponible

## 8.5 Optimización Automática por IA
**Objetivo:** La IA genera sitios optimizados automáticamente

### Optimización Integrada
**Pasos detallados:**
- [ ] **Performance automática**
  - Código optimizado generado por IA
  - Estructura HTML semántica
  - CSS minificado y eficiente
  - JavaScript mínimo necesario

- [ ] **Responsive por defecto**
  - Diseño mobile-first automático
  - Breakpoints optimizados
  - Touch-friendly por defecto
  - Carga adaptativa por dispositivo

- [ ] **SEO automático**
  - Meta tags generados automáticamente
  - Estructura semántica correcta
  - Alt text para imágenes
  - Schema markup para eventos

### Analytics Básicos
**Pasos detallados:**
- [ ] **Métricas simples**
  - Contador de visitas básico
  - Confirmaciones RSVP recibidas
  - Dispositivos más utilizados
  - Dashboard simple en MyWed360

## Estructura de Datos

```javascript
// /weddings/{weddingId}/website
{
  id: "website_001",
  generationMethod: "ai_prompt",
  domain: "ana-carlos-2024.mywed360.com",
  published: true,
  publishedAt: "2024-01-20T10:00:00Z",
  
  prompt: {
    basePrompt: "classic_elegant",
    customPrompt: "Crea un sitio web elegante y clásico para la boda de {nombres} el {fecha} en {ubicacion}. Incluye secciones de historia, ceremonia, celebración y RSVP con un diseño sofisticado en tonos dorados y blancos. Añade información sobre el dress code y detalles especiales de la ceremonia religiosa.",
    processedPrompt: "Crea un sitio web elegante y clásico para la boda de Ana & Carlos el 15 de junio de 2024 en Madrid, España. Incluye secciones de historia, ceremonia, celebración y RSVP con un diseño sofisticado en tonos dorados y blancos. Añade información sobre el dress code y detalles especiales de la ceremonia religiosa.",
    variables: {
      nombres: "Ana & Carlos",
      fecha: "15 de junio de 2024",
      ubicacion: "Madrid, España",
      invitados: 120
    }
  },
  
  generatedContent: {
    html: "<!DOCTYPE html><html>...",
    css: "body { font-family: 'Playfair Display'... }",
    javascript: "// Countdown timer and RSVP form...",
    generatedAt: "2024-01-20T10:00:00Z",
    aiModel: "gpt-4",
    tokensUsed: 2500
  },
  
  integrations: {
    rsvpConnected: true,
    photosConnected: true,
    mapIntegrated: true,
    countdownActive: true
  },
  
  analytics: {
    totalVisits: 245,
    uniqueVisitors: 189,
    rsvpSubmissions: 87,
    lastUpdated: "2024-01-25T15:30:00Z"
  },
  
  versions: [
    {
      version: 1,
      generatedAt: "2024-01-20T10:00:00Z",
      prompt: "Prompt original...",
      active: true
    }
  ]
}
```

## Estado de Implementación

### ✅ Completado
- Página de diseño web actual (DisenoWeb.jsx)
- Componentes de diseño básicos
- Sistema de publicación básico

### 🚧 En Desarrollo
- Integración con OpenAI API
- Sistema de prompts editables
- Generación automática con un botón

### ❌ Pendiente
- Editor de prompts avanzado (PromptEditor.jsx)
- Generador IA completo (AIWebGenerator.jsx)
- Sistema de variables dinámicas
- Historial de versiones generadas
- Analytics integrados en dashboard
