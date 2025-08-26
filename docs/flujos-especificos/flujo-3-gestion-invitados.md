# 3. Flujo de Gestión de Invitados (Detallado)

## 3.1 Gestión de Invitados
**Objetivo:** Administrar la lista de invitados de forma manual y organizada

### Importar desde Contactos (Opcional)
**Pasos detallados:**
- [ ] **Selección de fuente**
  - Google Contacts (OAuth)
  - Apple Contacts (API)
  - Outlook Contacts (Microsoft Graph)
  - Archivo vCard (.vcf)

- [ ] **Autorización**
  - Flujo OAuth para servicios en la nube
  - Permisos mínimos requeridos (solo lectura)
  - Explicación de uso de datos
  - Opción de revocar acceso posteriormente

- [ ] **Selección de contactos**
  - Lista paginada de contactos
  - Búsqueda y filtrado
  - Selección múltiple con checkboxes
  - Previsualización de datos a importar

- [ ] **Mapeo de campos**
  - Contacto → Invitado
  - Detección automática de campos comunes
  - Opción de mapeo manual
  - Campos adicionales específicos de boda

- [ ] **Importación**
  - Proceso similar a CSV
  - Validación y limpieza de datos
  - Manejo de contactos duplicados
  - Sincronización opcional para actualizaciones

### Añadir Invitados Manualmente (Principal)
**Pasos detallados:**
- [ ] **Formulario individual**
  - Campos básicos: nombre, apellidos, email, teléfono
  - Campos opcionales: dirección, fecha nacimiento
  - Grupo/categoría (dropdown con opciones predefinidas)
  - Restricciones dietéticas (checkboxes múltiples)
  - Número de acompañantes
  - Notas personales

- [ ] **Validación en tiempo real**
  - Email único y formato válido
  - Teléfono con formato internacional
  - Nombres requeridos
  - Límite de caracteres en notas

- [ ] **Guardado**
  - Botón "Guardar y añadir otro"
  - Botón "Guardar y finalizar"
  - Auto-guardado cada 30 segundos
  - Confirmación visual de guardado

- [ ] **Formulario masivo**
  - Grid editable para múltiples invitados
  - Copiar/pegar desde Excel
  - Validación por filas
  - Guardado por lotes

## 3.2 Organización de Invitados
**Objetivo:** Categorizar y estructurar la lista de invitados

### Crear Grupos/Categorías
**Pasos detallados:**
- [ ] **Grupos predefinidos**
  - Familia novia, Familia novio
  - Amigos novia, Amigos novio
  - Trabajo novia, Trabajo novio
  - Universidad, Infancia
  - Otros

- [ ] **Grupos personalizados**
  - Crear nuevo grupo con nombre
  - Asignar color identificativo
  - Descripción opcional
  - Límite máximo de invitados por grupo

- [ ] **Gestión de grupos**
  - Editar nombre y propiedades
  - Fusionar grupos
  - Eliminar grupos (reasignar invitados)
  - Estadísticas por grupo

### Asignar Relaciones
**Pasos detallados:**
- [ ] **Tipos de relación**
  - Familiar directo (padres, hermanos)
  - Familiar extendido (tíos, primos)
  - Amigo íntimo, Amigo cercano, Conocido
  - Compañero trabajo, Ex-compañero
  - Pareja de familiar/amigo

- [ ] **Configuración de relaciones**
  - Dropdown con opciones predefinidas
  - Campo de texto libre para especificar
  - Relación con novia/novio/ambos
  - Importancia (1-5 estrellas)

- [ ] **Visualización**
  - Filtros por tipo de relación
  - Gráfico de distribución
  - Lista agrupada por relación
  - Búsqueda por relación

### Restricciones Dietéticas
**Pasos detallados:**
- [ ] **Tipos predefinidos**
  - Vegetariano, Vegano
  - Sin gluten, Sin lactosa
  - Halal, Kosher
  - Diabético
  - Alergias específicas

- [ ] **Gestión de restricciones**
  - Checkboxes múltiples por invitado
  - Campo libre para alergias específicas
  - Nivel de severidad (informativo, importante, crítico)
  - Notas adicionales para el catering

- [ ] **Reportes**
  - Resumen de restricciones por tipo
  - Lista para el catering
  - Estadísticas para planificación
  - Alertas para números críticos

### Gestionar Acompañantes
**Pasos detallados:**
- [ ] **Configuración por invitado**
  - Número de acompañantes permitidos
  - Tipo de acompañante (pareja, hijos, +1)
  - Restricciones de edad (solo adultos)
  - Costo adicional por acompañante

- [ ] **Datos de acompañantes**
  - Nombre completo opcional
  - Relación con invitado principal
  - Restricciones dietéticas propias
  - Edad (para menús infantiles)

- [ ] **Validación**
  - No exceder capacidad total del evento
  - Coherencia con tipo de invitación
  - Confirmación de acompañantes en RSVP
  - Seguimiento de cambios de última hora

## 3.3 Envío de Invitaciones
**Objetivo:** Enviar invitaciones ya diseñadas a los invitados

**Nota:** El diseño de las invitaciones se realiza en la página de "Diseños". Esta sección solo gestiona el envío.

### Configurar RSVP
**Pasos detallados:**
- [ ] **Opciones de respuesta**
  - Asistirá / No asistirá
  - Asistencia por evento (ceremonia/banquete)
  - Número de acompañantes confirmados
  - Restricciones dietéticas

- [ ] **Formulario RSVP**
  - Campos obligatorios y opcionales
  - Validación de datos
  - Fecha límite de respuesta
  - Mensaje de confirmación personalizado

- [ ] **Seguimiento**
  - Dashboard de respuestas
  - Recordatorios automáticos
  - Gestión de cambios de respuesta
  - Exportación de datos para proveedores

### Selección de Invitación Diseñada
**Pasos detallados:**
- [ ] **Importar desde Diseños**
  - Lista de invitaciones ya diseñadas
  - Preview de la invitación seleccionada
  - Verificación de que todos los datos están completos
  - Opción de editar datos de último momento

### Envío por WhatsApp
**Pasos detallados:**
- [ ] **Configuración WhatsApp**
  - Integración con WhatsApp Business API
  - Verificación de números de teléfono
  - Mensaje personalizado de acompañamiento
  - Envío de imagen de invitación

- [ ] **Envío masivo WhatsApp**
  - Selección de invitados con teléfono
  - Preview del mensaje y imagen
  - Envío escalonado para evitar spam
  - Seguimiento de entrega y lectura

### Envío por Correo Ordinario
**Pasos detallados:**
- [ ] **Preparación para impresión**
  - Generación de PDF de alta calidad
  - Configuración de tamaño y orientación
  - Inclusión de datos de envío (direcciones)
  - Verificación de calidad de impresión

- [ ] **Envío a proveedor de impresión**
  - Selección del proveedor asignado
  - Envío automático del archivo PDF
  - Especificaciones técnicas incluidas
  - Confirmación de recepción del proveedor

- [ ] **Seguimiento del pedido**
  - Estado del pedido con el proveedor
  - Fecha estimada de entrega
  - Notificaciones de progreso
  - Confirmación de envío completado

### Seguimiento de Respuestas
**Pasos detallados:**
- [ ] **Dashboard de respuestas**
  - Porcentaje de respuestas recibidas
  - Gráficos de asistencia confirmada
  - Lista de pendientes de responder
  - Estadísticas por grupo

- [ ] **Gestión de seguimiento**
  - Recordatorios automáticos programados
  - Mensajes personalizados de seguimiento
  - Llamadas telefónicas para casos especiales
  - Gestión de respuestas tardías

- [ ] **Reportes finales**
  - Lista definitiva de asistentes
  - Número total por evento
  - Restricciones dietéticas consolidadas
  - Datos para proveedores (catering, asientos)

**Componentes necesarios:**
- `ContactsImporter.jsx` (opcional)
- `GuestForm.jsx`
- `GuestList.jsx`
- `GroupManager.jsx`
- `InvitationSender.jsx`
- `WhatsAppSender.jsx`
- `PrintOrderManager.jsx`
- `RSVPForm.jsx`
- `ResponseDashboard.jsx`

**APIs/Servicios:**
- Google Contacts API (opcional)
- Microsoft Graph API (opcional)
- WhatsApp Business API
- Print provider API
- PDF generation service
- RSVP tracking service
