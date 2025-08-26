# 5. Flujo de Gestión de Proveedores con IA (Detallado)

## 5.1 Mini-Tutorial IA para Proveedores
**Objetivo:** Guiar al usuario en la selección de servicios necesarios

### Tutorial Conversacional Inicial
**Pasos detallados:**
- [ ] **Bienvenida contextual**
  - "¡Perfecto! Vamos a organizar los proveedores para tu boda"
  - Análisis de datos existentes (tipo de boda, presupuesto, fecha)
  - "Basándome en tu boda [tipo] del [fecha], estos son los servicios esenciales"

- [ ] **Identificación de servicios necesarios**
  - IA pregunta: "¿Qué servicios crees que vas a necesitar?"
  - Lista de servicios esenciales vs opcionales
  - Priorización según presupuesto disponible
  - Sugerencias basadas en tipo de boda

- [ ] **Servicios esenciales identificados**
  - **Obligatorios:** Lugar/venue, catering, fotografía
  - **Muy importantes:** Música/DJ, flores, transporte
  - **Opcionales:** Videografía, wedding planner, animación
  - **Específicos:** Según tipo (religiosa: música sacra, civil: oficiante)

- [ ] **Configuración de tarjetas de servicios**
  - Generación automática de tarjetas vacías
  - Una tarjeta por cada servicio identificado
  - Estado inicial: "Sin contratar" (transparente)
  - Información básica: presupuesto estimado, prioridad

## 5.2 Dashboard de Proveedores con Tarjetas Vacías
**Objetivo:** Visualizar servicios pendientes y contratados

### Sistema de Tarjetas Dinámicas
**Pasos detallados:**
- [ ] **Tarjetas vacías/transparentes**
  - Diseño semitransparente para servicios sin contratar
  - Icono del tipo de servicio
  - Título del servicio
  - "Buscar proveedor" como acción principal
  - Presupuesto estimado por IA

- [ ] **Estados de tarjetas**
  - **Vacía:** Sin proveedor asignado (transparente)
  - **En proceso:** Contactando proveedores (amarillo)
  - **Presupuestos recibidos:** Esperando decisión (azul)
  - **Contratado:** Proveedor confirmado (verde)
  - **Rechazado:** Servicio descartado (gris)

- [ ] **Información por tarjeta**
  - Nombre del servicio
  - Presupuesto asignado vs gastado
  - Fecha límite para contratar
  - Estado del proceso
  - Proveedor actual (si existe)
  - Próxima acción requerida

### Gestión Visual de Servicios
**Pasos detallados:**
- [ ] **Filtros y vistas**
  - Ver todos los servicios
  - Solo servicios pendientes
  - Solo servicios contratados
  - Filtrar por presupuesto
  - Ordenar por prioridad/fecha límite

- [ ] **Acciones rápidas**
  - "Buscar proveedor" → Búsqueda con IA
  - "No necesito este servicio" → Marcar como descartado
  - "Ya tengo proveedor" → Añadir proveedor externo
  - "Cambiar presupuesto" → Ajustar asignación

## 5.3 Búsqueda de Proveedores con IA
**Objetivo:** Encontrar proveedores adecuados según criterios específicos

### Búsqueda Inteligente
**Pasos detallados:**
- [ ] **Criterios de búsqueda**
  - Ubicación (radio desde venue)
  - Presupuesto disponible
  - Fecha de la boda (disponibilidad)
  - Estilo de boda (clásico, moderno, rústico)
  - Valoraciones mínimas
  - Servicios específicos requeridos

- [ ] **Base de datos de proveedores**
  - Directorio integrado de proveedores locales
  - Información verificada: precios, disponibilidad, portfolio
  - Sistema de valoraciones y reseñas
  - Integración con APIs de proveedores externos

- [ ] **Resultados personalizados**
  - Lista ordenada por compatibilidad
  - Puntuación IA basada en criterios
  - Comparativa rápida de precios
  - Disponibilidad en tiempo real
  - Recomendaciones especiales

### Análisis de Compatibilidad
**Pasos detallados:**
- [ ] **Algoritmo de matching**
  - Análisis de estilo vs portfolio del proveedor
  - Compatibilidad de presupuesto
  - Experiencia en tipo de boda similar
  - Proximidad geográfica
  - Disponibilidad confirmada

- [ ] **Puntuación compuesta**
  - Calidad del servicio (40%)
  - Ajuste al presupuesto (30%)
  - Disponibilidad (20%)
  - Proximidad (10%)
  - Bonificaciones por recomendaciones

## 5.4 Contacto Automático con IA
**Objetivo:** Automatizar el proceso de solicitud de presupuestos

### Generación Automática de Emails
**Pasos detallados:**
- [ ] **Plantilla personalizada por IA**
  - Análisis del proveedor y su estilo de comunicación
  - Personalización según información de la boda
  - Tono apropiado (formal/informal según proveedor)
  - Información relevante incluida automáticamente

- [ ] **Contenido del email generado**
  - Saludo personalizado
  - Presentación de los novios
  - Detalles de la boda (fecha, lugar, tipo)
  - Servicios específicos requeridos
  - Presupuesto aproximado (opcional)
  - Solicitud de disponibilidad y presupuesto
  - Información de contacto

- [ ] **Ejemplo de email generado:**
```
Asunto: Consulta para fotografía de boda - Ana & Carlos - 15 Junio 2024

Estimado/a [Nombre Fotógrafo],

Mi nombre es Ana y junto con mi pareja Carlos estamos organizando nuestra boda 
para el 15 de junio de 2024 en el Hotel Majestic de Madrid.

Hemos visto su trabajo y nos encanta su estilo [natural/clásico/artístico]. 
Estamos buscando un fotógrafo para cubrir tanto la ceremonia (17:00h) como 
el banquete posterior.

Detalles de nuestra boda:
- Fecha: 15 de junio de 2024
- Ceremonia: 17:00h en Iglesia San Miguel
- Banquete: 20:00h en Hotel Majestic
- Invitados aproximados: 120 personas
- Estilo: clásico elegante

¿Estaría disponible para esa fecha? Nos gustaría conocer sus paquetes y 
precios para poder tomar una decisión informada.

Quedamos a la espera de su respuesta.

Un saludo cordial,
Ana García y Carlos López
Teléfono: [teléfono]
Email: [email]
```

### Envío y Seguimiento
**Pasos detallados:**
- [ ] **Envío automático**
  - Revisión previa del email por el usuario
  - Opción de editar antes del envío
  - Envío desde email personal del usuario
  - Copia oculta al sistema para seguimiento

- [ ] **Seguimiento automático**
  - Detección de respuestas recibidas
  - Análisis del contenido de la respuesta
  - Extracción de información clave (precios, disponibilidad)
  - Notificación al usuario de respuestas recibidas

- [ ] **Recordatorios automáticos**
  - Si no hay respuesta en 3 días → recordatorio suave
  - Si no hay respuesta en 7 días → segundo recordatorio
  - Si no hay respuesta en 14 días → marcar como no disponible

## 5.5 Análisis Automático de Respuestas
**Objetivo:** Procesar y analizar automáticamente las respuestas de proveedores

### Procesamiento con IA
**Pasos detallados:**
- [ ] **Análisis de contenido**
  - Extracción de precios mencionados
  - Identificación de disponibilidad
  - Servicios incluidos/excluidos
  - Condiciones especiales
  - Tono y profesionalidad de la respuesta

- [ ] **Estructuración de datos**
  - Conversión de texto libre a datos estructurados
  - Normalización de precios (por hora, por evento, etc.)
  - Identificación de paquetes ofrecidos
  - Extracción de fechas y horarios

- [ ] **Ejemplo de análisis:**
```javascript
// Respuesta original del proveedor
"Hola Ana y Carlos, gracias por contactarnos. Sí tenemos disponibilidad 
para el 15 de junio. Nuestro paquete completo incluye 8 horas de cobertura, 
300 fotos editadas y álbum digital por 1.800€. También ofrecemos álbum 
físico por 300€ adicionales..."

// Datos extraídos por IA
{
  availability: true,
  packages: [
    {
      name: "Paquete completo",
      price: 1800,
      currency: "EUR",
      includes: [
        "8 horas de cobertura",
        "300 fotos editadas", 
        "álbum digital"
      ],
      duration: 8
    }
  ],
  addOns: [
    {
      name: "Álbum físico",
      price: 300,
      currency: "EUR"
    }
  ],
  responseTime: "2 horas",
  professionalismScore: 8.5,
  nextSteps: ["Solicitar portfolio", "Programar reunión"]
}
```

### Presentación al Usuario
**Pasos detallados:**
- [ ] **Dashboard de respuestas**
  - Resumen ejecutivo de cada respuesta
  - Comparativa automática de precios
  - Puntuación de cada propuesta
  - Recomendación de IA
  - Acciones sugeridas

- [ ] **Notificación inteligente**
  - "Has recibido 3 respuestas para fotografía"
  - "El presupuesto promedio es 1.650€"
  - "Te recomiendo contactar con [Proveedor X] por su excelente relación calidad-precio"
  - Botones de acción rápida

## 5.6 Proceso de Decisión Asistido
**Objetivo:** Ayudar al usuario a tomar la mejor decisión

### Comparativa Automática
**Pasos detallados:**
- [ ] **Tabla comparativa**
  - Precios normalizados
  - Servicios incluidos (checkmarks)
  - Valoraciones y reseñas
  - Tiempo de respuesta
  - Profesionalismo percibido

- [ ] **Análisis de valor**
  - Relación calidad-precio
  - Servicios únicos ofrecidos
  - Flexibilidad en condiciones
  - Experiencia en bodas similares

### Recomendación Final de IA
**Pasos detallados:**
- [ ] **Conversación de decisión**
  - "He analizado las 4 respuestas que recibiste para fotografía"
  - "Basándome en tu presupuesto de 2.000€ y estilo clásico, te recomiendo..."
  - Explicación de la recomendación
  - Pros y contras de cada opción

- [ ] **Confirmación de elección**
  - Usuario selecciona proveedor preferido
  - IA genera email de confirmación
  - Programación automática de reunión
  - Actualización de tarjeta de servicio

- [ ] **Seguimiento post-decisión**
  - Actualización automática de presupuesto
  - Creación de tareas relacionadas
  - Programación de recordatorios
  - Integración con timeline general

## 5.7 Oferta de Wedding Planner
**Objetivo:** Ofrecer servicios de wedding planner en el momento apropiado

### Detección del Momento Óptimo
**Pasos detallados:**
- [ ] **Triggers para ofrecer servicio**
  - Usuario ha contactado con 3+ proveedores
  - Presupuesto total > 15.000€
  - Fecha de boda < 6 meses
  - Usuario muestra signos de estrés/agobio
  - Múltiples servicios sin contratar

- [ ] **Mensaje contextual de IA**
  - "Veo que estás gestionando muchos proveedores..."
  - "¿Te gustaría que un wedding planner profesional te ayude?"
  - "Puedo conectarte con planners especializados en tu zona"
  - Explicación de beneficios específicos

### Integración de Wedding Planners
**Pasos detallados:**
- [ ] **Base de datos de planners**
  - Planners verificados por zona
  - Especialidades y estilos
  - Tarifas y paquetes de servicio
  - Valoraciones de clientes anteriores

- [ ] **Matching inteligente**
  - Análisis de necesidades específicas
  - Compatibilidad de estilo
  - Presupuesto disponible para planner
  - Disponibilidad para la fecha

- [ ] **Proceso de contratación**
  - Presentación de 2-3 planners recomendados
  - Contacto automático similar a otros proveedores
  - Reunión de presentación gratuita
  - Integración completa si se contrata

**Estructura de datos:**
```javascript
// /weddings/{weddingId}/vendors/{vendorId}
{
  id: "vendor_photographer_001",
  serviceType: "photography",
  status: "contacted", // empty, contacted, quoted, contracted, rejected
  name: "María García Fotografía",
  contact: {
    email: "maria@fotografiabodas.com",
    phone: "+34600123456",
    website: "www.mariafotografia.com"
  },
  location: {
    city: "Madrid",
    distance: 5.2 // km from venue
  },
  communication: [
    {
      id: "comm_001",
      type: "outbound_email",
      date: "2024-01-15T10:00:00Z",
      subject: "Consulta para fotografía de boda",
      content: "...",
      aiGenerated: true
    },
    {
      id: "comm_002", 
      type: "inbound_email",
      date: "2024-01-15T12:30:00Z",
      subject: "Re: Consulta para fotografía de boda",
      content: "...",
      aiAnalyzed: {
        availability: true,
        pricing: [
          { package: "Básico", price: 1200, currency: "EUR" },
          { package: "Completo", price: 1800, currency: "EUR" }
        ],
        responseTime: 2.5, // hours
        professionalismScore: 8.5,
        nextSteps: ["schedule_meeting", "request_portfolio"]
      }
    }
  ],
  quotes: [
    {
      id: "quote_001",
      package: "Paquete Completo",
      price: 1800,
      currency: "EUR",
      includes: ["8 horas cobertura", "300 fotos editadas", "álbum digital"],
      validUntil: "2024-02-15",
      aiScore: 8.2
    }
  ],
  aiRecommendation: {
    score: 8.2,
    reasons: ["Excelente relación calidad-precio", "Estilo compatible", "Respuesta rápida"],
    concerns: ["Portfolio limitado en bodas clásicas"]
  },
  contracted: false,
  contractDate: null,
  finalPrice: null,
  createdAt: "2024-01-15T10:00:00Z"
}
```

**Componentes necesarios:**
- `VendorDashboard.jsx`
- `ServiceCards.jsx`
- `VendorSearch.jsx`
- `AIEmailGenerator.jsx`
- `ResponseAnalyzer.jsx`
- `VendorComparison.jsx`
- `WeddingPlannerOffer.jsx`

**APIs/Servicios:**
- OpenAI para generación y análisis de emails
- Email service para envío automático
- Vendor database/API
- Calendar integration para reuniones
- Payment processing para contrataciones
