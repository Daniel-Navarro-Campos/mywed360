# Flujo 16: Asistente Virtual con IA

## Descripción General
Sistema de asistente virtual conversacional integrado en la interfaz mediante chat flotante, que ayuda a los usuarios con planificación automática, sugerencias inteligentes y resolución de dudas sobre su boda.

## Objetivos
- Proporcionar ayuda contextual inmediata a los usuarios
- Automatizar sugerencias basadas en datos de la boda
- Reducir la curva de aprendizaje de la plataforma
- Ofrecer planificación inteligente personalizada

---

## Flujo de Usuario

### 1. Acceso al Asistente
**Ubicación**: Chat flotante en esquina inferior derecha
**Disponibilidad**: Todas las páginas de la aplicación

#### Pasos:
1. Usuario ve icono de chat flotante con indicador de disponibilidad
2. Clic en icono abre ventana de chat
3. Mensaje de bienvenida personalizado según contexto de página
4. Sugerencias rápidas basadas en estado actual de la boda

### 2. Tipos de Interacción

#### **2.1 Consultas Generales**
- **Trigger**: Usuario escribe pregunta libre
- **Ejemplos**:
  - "¿Cuándo debo enviar las invitaciones?"
  - "¿Qué presupuesto necesito para 100 invitados?"
  - "¿Cómo funciona el seating plan?"

#### **2.2 Ayuda Contextual**
- **Trigger**: Usuario está en página específica
- **Comportamiento**: Asistente ofrece ayuda sobre funcionalidad actual
- **Ejemplos**:
  - En Presupuesto: "¿Te ayudo a categorizar tus gastos?"
  - En Invitados: "¿Quieres que importe invitados desde un archivo?"
  - En Seating Plan: "¿Necesitas ayuda con la distribución automática?"

#### **2.3 Planificación Automática**
- **Trigger**: "Ayúdame a planificar mi boda"
- **Proceso**:
  1. Recopila información básica (fecha, ubicación, invitados)
  2. Genera timeline personalizado
  3. Sugiere proveedores según presupuesto y ubicación
  4. Crea lista de tareas prioritarias

#### **2.4 Sugerencias Proactivas**
- **Trigger**: Análisis automático de datos
- **Ejemplos**:
  - "Veo que tu boda es en 3 meses, ¿ya tienes fotógrafo?"
  - "Tu presupuesto de flores parece alto, ¿quieres alternativas?"
  - "Hay 5 invitados sin asignar mesa, ¿los ubico automáticamente?"

### 3. Funcionalidades Específicas

#### **3.1 Generación de Timeline**
```
Usuario: "Crea un timeline para mi boda"
Asistente: 
- Analiza fecha de boda
- Genera cronograma de 12 meses
- Incluye hitos críticos
- Asigna fechas límite
- Crea tareas automáticamente
```

#### **3.2 Optimización de Presupuesto**
```
Usuario: "Mi presupuesto se está pasando"
Asistente:
- Analiza gastos actuales
- Identifica categorías más altas
- Sugiere alternativas más económicas
- Propone redistribución de fondos
```

#### **3.3 Búsqueda Inteligente de Proveedores**
```
Usuario: "Necesito un fotógrafo en Madrid por 1500€"
Asistente:
- Busca en base de datos de proveedores
- Filtra por ubicación y presupuesto
- Muestra opciones con valoraciones
- Facilita contacto directo
```

#### **3.4 Resolución de Problemas**
```
Usuario: "No puedo añadir más invitados"
Asistente:
- Identifica límite de plan actual
- Explica restricciones
- Sugiere upgrade de plan
- Ofrece alternativas (plan Plus, etc.)
```

---

## Especificación Técnica

### Componente Principal: `VirtualAssistant.jsx`

#### **Estados del Chat**
```javascript
const [isOpen, setIsOpen] = useState(false);
const [messages, setMessages] = useState([]);
const [isTyping, setIsTyping] = useState(false);
const [context, setContext] = useState(null);
const [suggestions, setSuggestions] = useState([]);
```

#### **Integración con OpenAI**
```javascript
const sendMessage = async (userMessage) => {
  const contextData = {
    currentPage: location.pathname,
    weddingData: activeWedding,
    userRole: userRole,
    completedTasks: completedTasks
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Eres un asistente especializado en bodas. 
        Contexto actual: ${JSON.stringify(contextData)}`
      },
      ...messages,
      { role: "user", content: userMessage }
    ]
  });
};
```

### **Estructura de Datos**

#### **Conversación**
```javascript
{
  id: "conv_123",
  userId: "user_456",
  weddingId: "wedding_789",
  messages: [
    {
      id: "msg_1",
      role: "user" | "assistant",
      content: "texto del mensaje",
      timestamp: Date,
      context: {
        page: "/presupuesto",
        action: "budget_help"
      }
    }
  ],
  createdAt: Date,
  lastActivity: Date
}
```

#### **Sugerencias Contextuales**
```javascript
{
  page: "/invitados",
  suggestions: [
    "¿Te ayudo a importar invitados desde Excel?",
    "¿Quieres que genere códigos QR para las invitaciones?",
    "¿Necesitas ayuda con las categorías de invitados?"
  ]
}
```

### **Integración con Módulos Existentes**

#### **Con Sistema de Tareas**
```javascript
// Crear tareas automáticamente desde el chat
const createTasksFromChat = async (tasks) => {
  for (const task of tasks) {
    await addDoc(collection(db, 'weddings', weddingId, 'tasks'), {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      category: task.category,
      createdBy: 'ai_assistant',
      createdAt: serverTimestamp()
    });
  }
};
```

#### **Con Sistema de Proveedores**
```javascript
// Buscar proveedores desde el chat
const searchProvidersFromChat = async (criteria) => {
  const providers = await searchProviders({
    location: criteria.location,
    category: criteria.category,
    budget: criteria.budget,
    rating: criteria.minRating
  });
  
  return providers.map(provider => ({
    name: provider.name,
    rating: provider.rating,
    price: provider.averagePrice,
    contact: provider.contact
  }));
};
```

---

## Casos de Uso Específicos

### **Caso 1: Usuario Nuevo**
```
Asistente: "¡Hola! Veo que es tu primera vez aquí. 
¿Te gustaría que te ayude a configurar tu boda paso a paso?"

Usuario: "Sí, por favor"

Asistente: "Perfecto. Empecemos con lo básico:
1. ¿Cuál es la fecha de tu boda?
2. ¿Dónde será la celebración?
3. ¿Cuántos invitados aproximadamente?"

[Proceso de onboarding guiado]
```

### **Caso 2: Optimización de Presupuesto**
```
Usuario: "Mi presupuesto se está yendo de las manos"

Asistente: "Entiendo tu preocupación. He revisado tu presupuesto actual:
- Total gastado: 18,500€ de 20,000€ presupuestados
- Categoría más alta: Catering (45% del total)

¿Te gustaría que busque alternativas más económicas para el catering 
o prefieres ajustar otras categorías?"
```

### **Caso 3: Planificación de Timeline**
```
Usuario: "No sé por dónde empezar con la planificación"

Asistente: "Te ayudo a crear un plan personalizado. 
Veo que tu boda es el 15 de junio de 2025 (en 8 meses).

He creado un timeline optimizado:
📅 Octubre 2024: Reservar venue y fotógrafo
📅 Noviembre 2024: Elegir catering y música
📅 Enero 2025: Enviar save-the-dates
📅 Marzo 2025: Enviar invitaciones
📅 Mayo 2025: Confirmaciones finales

¿Quieres que cree estas tareas en tu calendario?"
```

### **Caso 4: Resolución de Problemas Técnicos**
```
Usuario: "No puedo subir fotos a la galería"

Asistente: "Veo el problema. Las fotos deben ser menores a 10MB 
y en formato JPG, PNG o WEBP.

¿Te gustaría que:
1. Te muestre cómo comprimir las imágenes?
2. Te ayude a subirlas una por una?
3. Te enseñe a usar la subida masiva?"
```

---

## Configuración y Personalización

### **Configuración por Rol**

#### **Para Parejas (Owner)**
- Enfoque en planificación personal
- Sugerencias de presupuesto familiar
- Ayuda con decisiones emocionales
- Recordatorios de hitos importantes

#### **Para Wedding Planners**
- Enfoque en eficiencia y productividad
- Sugerencias de optimización de tiempo
- Herramientas de gestión de múltiples bodas
- Análisis de rentabilidad

#### **Para Ayudantes**
- Enfoque en tareas específicas asignadas
- Guías paso a paso
- Limitaciones según permisos
- Coordinación con el owner

### **Personalización de Respuestas**
```javascript
const personalizeResponse = (response, userProfile) => {
  const personality = {
    formal: userProfile.prefersFormalTone,
    enthusiastic: userProfile.weddingStyle === 'fun',
    practical: userProfile.role === 'wedding_planner'
  };
  
  return adaptTone(response, personality);
};
```

---

## Métricas y Analytics

### **Métricas de Uso**
- Número de conversaciones por usuario
- Tiempo promedio de sesión de chat
- Tipos de consultas más frecuentes
- Tasa de resolución de problemas
- Satisfacción del usuario (thumbs up/down)

### **Métricas de Efectividad**
- Tareas creadas desde el chat vs completadas
- Proveedores contactados desde sugerencias
- Mejoras en progreso de boda tras uso del asistente
- Reducción en tickets de soporte

### **Optimización Continua**
```javascript
const trackChatMetrics = async (interaction) => {
  await addDoc(collection(db, 'chat_analytics'), {
    userId: user.uid,
    weddingId: activeWedding.id,
    query: interaction.userMessage,
    response: interaction.assistantResponse,
    context: interaction.context,
    satisfaction: interaction.rating,
    timestamp: serverTimestamp()
  });
};
```

---

## Implementación por Fases

### **Fase 1: Chat Básico (2 semanas)**
- Interfaz de chat flotante
- Integración con OpenAI
- Respuestas contextuales básicas
- Historial de conversaciones

### **Fase 2: Funcionalidades Avanzadas (3 semanas)**
- Generación automática de tareas
- Búsqueda de proveedores
- Análisis de presupuesto
- Sugerencias proactivas

### **Fase 3: Personalización (2 semanas)**
- Adaptación por rol de usuario
- Aprendizaje de preferencias
- Integración completa con todos los módulos
- Analytics y métricas

### **Fase 4: Optimización (1 semana)**
- Mejora de respuestas basada en feedback
- Optimización de rendimiento
- A/B testing de personalidad del asistente
- Documentación final

---

## Consideraciones de Seguridad

### **Privacidad de Datos**
- No almacenar información sensible en logs
- Encriptación de conversaciones
- Cumplimiento GDPR
- Opción de eliminar historial

### **Limitaciones del Asistente**
- No puede realizar acciones críticas sin confirmación
- No accede a datos de facturación
- No puede eliminar datos importantes
- Siempre sugiere confirmar cambios importantes

### **Fallbacks**
- Escalado a soporte humano cuando sea necesario
- Mensajes de error claros
- Opciones alternativas cuando no puede ayudar
- Detección de frustración del usuario

Este flujo convierte el ChatWidget existente en un asistente virtual completo y contextual que mejora significativamente la experiencia del usuario en MyWed360.
