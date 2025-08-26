# 4. Flujo de Plan de Asientos (Detallado)

## 4.1 Configuración del Lienzo
**Objetivo:** Definir el tamaño del lienzo y crear el espacio con formas geométricas

### Definir Tamaño del Lienzo
**Pasos detallados:**
- [ ] **Configuración inicial del lienzo**
  - Ancho y alto del área de trabajo
  - Unidades: metros, pies, píxeles
  - Escalado automático al viewport
  - Grid de referencia opcional

- [ ] **Controles de navegación**
  - Zoom in/out con rueda del ratón
  - Pan arrastrando con botón medio
  - Fit to screen automático
  - Mini-mapa de navegación

### Dibujo Libre con Formas Geométricas
**Pasos detallados:**
- [ ] **Herramientas de dibujo disponibles**
  - **Rectángulo:** Para salones rectangulares
  - **Círculo/Elipse:** Para espacios circulares
  - **Polígono libre:** Para formas irregulares ✅ IMPLEMENTADO
  - **Línea:** Para divisiones y límites
  - **Texto:** Para etiquetas y notas

- [ ] **Propiedades de formas**
  - Color de relleno y borde
  - Grosor de línea
  - Transparencia/opacidad
  - Patrón de relleno (sólido, rayado, punteado)

- [ ] **Edición de formas**
  - Selección múltiple con Ctrl+click
  - Redimensionar arrastrando esquinas
  - Rotar con handle de rotación
  - Mover arrastrando el centro
  - Eliminar con tecla Delete

- [ ] **Capas y organización**
  - Enviar al frente/atrás
  - Agrupar/desagrupar elementos
  - Bloquear elementos para evitar edición accidental
  - Mostrar/ocultar capas

### Añadir Elementos del Espacio
**Pasos detallados:**
- [ ] **Elementos arquitectónicos**
  - **Columnas:** Círculo para redondas, rectángulo para cuadradas
  - **Escenario/Tarima:** Rectángulo elevado con color diferenciado
  - **Barras fijas:** Rectángulo largo y estrecho
  - **Puertas:** Líneas con símbolo de apertura
  - **Ventanas:** Rectángulos con patrón especial

- [ ] **Herramientas de creación**
  - Selección de herramienta geométrica
  - Click y arrastrar para definir tamaño
  - Doble click para propiedades avanzadas
  - Snap to grid para alineación precisa

- [ ] **Propiedades personalizables**
  - Etiqueta descriptiva
  - Color y estilo visual
  - Tamaño exacto (ancho x alto)
  - Ángulo de rotación
  - Tipo funcional (obstáculo, decorativo, funcional)

### Configurar Mesas Especiales
**Pasos detallados:**
- [ ] **Tipos de mesas especiales**
  - **Mesa presidencial:** Para novios y padrinos
  - **Mesas VIP:** Familia directa
  - **Mesa accesible:** Para sillas de ruedas
  - **Mesa niños:** Cerca de salidas y baños
  - **Mesa proveedores:** Fotógrafo, coordinadores

- [ ] **Marcado de mesas especiales**
  - Selección de mesa existente
  - Asignación de tipo especial
  - Color diferenciado automáticamente
  - Icono identificativo

- [ ] **Propiedades especiales**
  - Prioridad en asignación de invitados
  - Restricciones de grupo (solo familia, solo niños)
  - Ubicación preferente (cerca de escenario, salidas)
  - Servicios adicionales (micrófono, accesibilidad)

- [ ] **Validación automática**
  - Mesa presidencial debe tener vista al salón
  - Mesas accesibles cerca de accesos
  - Mesa niños lejos de elementos peligrosos
  - Distribución equilibrada de mesas especiales

## 4.2 Gestión de Mesas y Asignación
**Objetivo:** Las mesas se generan automáticamente según la asignación de invitados

**Nota importante:** En este sistema, las mesas NO se crean manualmente. Se generan automáticamente cuando se asignan invitados, y se pueden modificar desde el sidebar derecho.

### Asignación de Invitados (Genera Mesas Automáticamente)
**Pasos detallados:**
- [ ] **Proceso de asignación**
  - Usuario selecciona invitados del sidebar derecho
  - Arrastra invitados al lienzo
  - Sistema crea mesa automáticamente en esa posición
  - Mesa se dimensiona según número de invitados

- [ ] **Generación automática de mesas**
  - 1-4 invitados → Mesa redonda pequeña
  - 5-8 invitados → Mesa redonda mediana
  - 9-12 invitados → Mesa redonda grande
  - >12 invitados → Mesa rectangular

- [ ] **Numeración automática**
  - Mesas se numeran según orden de creación
  - Renumeración automática al eliminar mesas
  - Opción de numeración personalizada

### Sidebar Derecho - Gestión de Invitados
**Pasos detallados:**
- [ ] **Lista de invitados disponibles**
  - Todos los invitados sin asignar
  - Filtros por grupo (familia, amigos, trabajo)
  - Búsqueda por nombre
  - Contador de invitados sin asignar

- [ ] **Drag & Drop de invitados**
  - Arrastrar invitado individual al lienzo
  - Arrastrar grupo completo
  - Arrastrar a mesa existente (añade a esa mesa)
  - Arrastrar a espacio vacío (crea nueva mesa)

- [ ] **Información de invitado**
  - Nombre completo
  - Grupo/categoría
  - Restricciones dietéticas (icono)
  - Número de acompañantes
  - Notas especiales

- [ ] **Acciones rápidas**
  - Botón "Eliminar de mesa" (vuelve a lista)
  - "Intercambiar con..." (swap entre mesas)
  - "Ver detalles" (modal con info completa)

### Zona Inferior Derecha - Configuración de Mesas
**Pasos detallados:**
- [ ] **Cambio de forma de mesa**
  - Selector: Redonda, Rectangular, Cuadrada, Oval
  - Aplicar a mesa seleccionada
  - Preview en tiempo real del cambio
  - Validación de espacio disponible

- [ ] **Ajustes de tamaño**
  - Slider para diámetro (mesas redondas)
  - Campos ancho x largo (mesas rectangulares)
  - Tamaños predefinidos por capacidad
  - Cálculo automático de espacio por persona

- [ ] **Propiedades visuales**
  - Color de la mesa
  - Estilo de borde
  - Transparencia
  - Mostrar/ocultar número de mesa

- [ ] **Botón de Plantillas**
  - **Filas paralelas:** Mesas en líneas rectas
  - **Disposición en U:** Alrededor del perímetro
  - **Circular:** Alrededor de pista de baile central
  - **Mixta:** Combinación de formas y disposiciones
  - **Personalizada:** Guardar disposición actual como plantilla

### Aplicación de Plantillas de Disposición
**Pasos detallados:**
- [ ] **Selección de plantilla**
  - Galería visual de disposiciones
  - Preview de cómo quedaría con las mesas actuales
  - Información de capacidad y flujo
  - Compatibilidad con forma del salón

- [ ] **Aplicación inteligente**
  - Mantener asignaciones de invitados existentes
  - Reposicionar mesas según plantilla
  - Ajustar tamaños si es necesario
  - Validar que no hay solapamientos

- [ ] **Personalización post-plantilla**
  - Ajustes manuales permitidos
  - Mover mesas individuales
  - Cambiar formas específicas
  - Guardar como nueva plantilla personalizada

- [ ] **Validaciones automáticas**
  - Distancia mínima entre mesas (1.5m)
  - Acceso a pasillos principales
  - Visibilidad hacia puntos de interés
  - Cumplimiento de normativas de seguridad

## 4.3 Mini-Tutorial IA para Plan de Asientos
**Objetivo:** Guiar al usuario en su primera visita a la sección

### Tutorial Conversacional
**Pasos detallados:**
- [ ] **Detección de prerequisitos**
  - Verificar si existen invitados añadidos
  - Si no hay invitados: "Veo que aún no has añadido invitados a tu boda"
  - "Para crear un plan de asientos necesitas tener tu lista de invitados lista"
  - Botón: "Añadir invitados primero" → redirecciona a gestión de invitados

- [ ] **Bienvenida con invitados existentes**
  - "Perfecto! Veo que tienes [X] invitados confirmados"
  - "Ahora vamos a crear el plan de asientos perfecto para tu boda"
  - "Primero necesito conocer el espacio donde será el banquete"

- [ ] **Guía de configuración del espacio**
  - "Empecemos definiendo las dimensiones del salón"
  - "Luego dibujaremos el perímetro del espacio"
  - "Y finalmente añadiremos las mesas"
  - Tutorial paso a paso con highlights visuales

- [ ] **Validación continua**
  - Verificar que hay suficientes asientos para todos los invitados
  - Alertar si faltan mesas o sobran asientos
  - Sugerir distribución óptima según número de invitados

## 4.4 Asignación de Invitados
**Objetivo:** Asignar cada invitado a una mesa específica

### Prerequisito: Validación de Invitados
**Pasos detallados:**
- [ ] **Verificación antes de asignación**
  - Comprobar que existen invitados en la base de datos
  - Mostrar contador: "X invitados confirmados, Y asientos disponibles"
  - Si no hay invitados: mostrar mensaje y botón para añadir
  - Si hay desbalance: alertar y sugerir ajustes

### Asignación Manual
**Pasos detallados:**
- [ ] **Interface de asignación**
  - Lista de invitados sin asignar (sidebar)
  - Drag & drop desde lista a mesa
  - Información de invitado al hacer hover
  - Estado visual de mesas (vacía, parcial, llena)

- [ ] **Información por mesa**
  - Lista de invitados asignados
  - Capacidad actual vs máxima
  - Grupos representados en la mesa
  - Conflictos potenciales detectados

- [ ] **Herramientas de gestión**
  - Mover invitado entre mesas
  - Intercambiar posiciones
  - Desasignar invitado
  - Copiar configuración entre mesas similares

- [ ] **Validaciones en tiempo real**
  - No exceder capacidad de mesa
  - Alertas de conflictos conocidos
  - Sugerencias de mejores ubicaciones
  - Balance de grupos por mesa

### Asignación Automática con IA
**Pasos detallados:**
- [ ] **Configuración de algoritmo**
  - Prioridades de asignación (familia > amigos > trabajo)
  - Reglas de compatibilidad entre grupos
  - Restricciones especiales (separar ex-parejas)
  - Preferencias de proximidad (juntar amigos íntimos)

- [ ] **Parámetros de optimización**
  - Maximizar satisfacción general
  - Minimizar conflictos conocidos
  - Balancear edades en cada mesa
  - Considerar personalidades (extrovertidos/introvertidos)

- [ ] **Proceso de asignación**
  - Análisis de datos de invitados
  - Cálculo de compatibilidades
  - Generación de múltiples opciones
  - Selección de mejor solución

- [ ] **Review y ajustes**
  - Presentación de resultado con explicaciones
  - Posibilidad de ajustes manuales
  - Re-ejecutar algoritmo con nuevas restricciones
  - Comparación entre diferentes soluciones

### Resolver Conflictos
**Pasos detallados:**
- [ ] **Detección de conflictos**
  - Relaciones problemáticas conocidas
  - Grupos incompatibles
  - Restricciones de protocolo
  - Limitaciones físicas (accesibilidad)

- [ ] **Tipos de conflictos**
  - Personales (ex-parejas, disputas familiares)
  - Profesionales (competencia, jerarquías)
  - Culturales (idioma, costumbres)
  - Físicos (movilidad, alergias)

- [ ] **Herramientas de resolución**
  - Alertas visuales en mesas problemáticas
  - Sugerencias automáticas de reubicación
  - Simulador de "qué pasaría si..."
  - Consulta con organizadores

- [ ] **Documentación de decisiones**
  - Registro de conflictos identificados
  - Soluciones aplicadas
  - Justificación de decisiones difíciles
  - Plan B para problemas del día de la boda

### Generar Reportes
**Pasos detallados:**
- [ ] **Reporte de asignación**
  - Lista completa por mesa
  - Información de contacto por invitado
  - Restricciones dietéticas por mesa
  - Estadísticas generales

- [ ] **Reporte para catering**
  - Número total de comensales
  - Menús especiales por mesa
  - Restricciones dietéticas consolidadas
  - Distribución de edades (menús infantiles)

- [ ] **Reporte para coordinación**
  - Mesas VIP y protocolo especial
  - Invitados con necesidades especiales
  - Contactos de emergencia
  - Timeline de llegadas esperadas

- [ ] **Formatos de exportación**
  - PDF imprimible
  - Excel para edición
  - CSV para sistemas externos
  - Imagen del plano con nombres

## 4.5 Validación y Exportación
**Objetivo:** Verificar la configuración final y generar materiales

### Verificar Capacidades
**Pasos detallados:**
- [ ] **Validación numérica**
  - Total de asientos vs invitados confirmados
  - Capacidad por evento (ceremonia/banquete)
  - Margen de seguridad para invitados de última hora
  - Distribución por grupos/categorías

- [ ] **Validación espacial**
  - Cumplimiento de normativas de seguridad
  - Accesos y salidas de emergencia
  - Espacio para circulación de personal
  - Ubicación de elementos de servicio

- [ ] **Validación de protocolo**
  - Ubicación correcta de mesas principales
  - Visibilidad hacia puntos de interés
  - Separación adecuada de grupos conflictivos
  - Consideraciones culturales y religiosas

### Revisar Restricciones
**Pasos detallados:**
- [ ] **Restricciones físicas**
  - Accesibilidad para sillas de ruedas
  - Proximidad a baños para personas mayores
  - Salidas rápidas para familias con niños pequeños
  - Ubicación de mesas para personas con movilidad reducida

- [ ] **Restricciones dietéticas**
  - Agrupación por tipo de menú especial
  - Separación de alérgenos severos
  - Identificación clara para el servicio
  - Coordinación con cocina

- [ ] **Restricciones sociales**
  - Protocolo familiar respetado
  - Jerarquías profesionales consideradas
  - Grupos de edad balanceados
  - Personalidades compatibles

### Exportar a PDF/Imagen
**Pasos detallados:**
- [ ] **Configuración de exportación**
  - Tamaño de página (A4, A3, personalizado)
  - Orientación (horizontal/vertical)
  - Resolución para impresión
  - Incluir/excluir elementos (grid, medidas, etc.)

- [ ] **Elementos del plano**
  - Perímetro del salón
  - Mesas con números/nombres
  - Obstáculos y elementos fijos
  - Zonas especiales marcadas
  - Leyenda explicativa

- [ ] **Información adicional**
  - Título del evento y fecha
  - Escala del plano
  - Lista de mesas con capacidades
  - Notas importantes
  - Información de contacto

- [ ] **Formatos disponibles**
  - PDF de alta resolución
  - PNG/JPG para presentaciones
  - SVG vectorial para edición
  - Plano técnico con medidas exactas

### Compartir con Proveedores
**Pasos detallados:**
- [ ] **Paquete para catering**
  - Plano con numeración de mesas
  - Lista de invitados por mesa
  - Restricciones dietéticas detalladas
  - Timeline de servicio sugerido

- [ ] **Paquete para decoración**
  - Plano base sin nombres
  - Especificaciones de mesas
  - Zonas para elementos decorativos
  - Consideraciones de montaje

- [ ] **Paquete para coordinación**
  - Plano completo con todos los detalles
  - Lista de contactos por mesa
  - Protocolo de ubicación
  - Plan de contingencia

- [ ] **Métodos de compartición**
  - Email directo a proveedores
  - Link de descarga con contraseña
  - Integración con plataformas de proveedores
  - Versiones actualizadas automáticas

**Componentes necesarios:**
- `SeatingCanvas.jsx` ✅ IMPLEMENTADO
- `FreeDrawCanvas.jsx` ✅ IMPLEMENTADO (actualizar para formas geométricas)  
- `GeometricShapeTools.jsx` (nuevo)
- `GuestSidebar.jsx` (nuevo)
- `TableConfigPanel.jsx` (nuevo)
- `LayoutTemplates.jsx` (nuevo)
- `AutoTableGenerator.jsx` (nuevo)
- `SeatingReports.jsx`
- `ExportTools.jsx`

**APIs/Servicios:**
- Canvas/SVG rendering
- PDF generation (jsPDF) ✅ DISPONIBLE
- Image export (html2canvas) ✅ DISPONIBLE
- AI/ML service para asignación automática
- File sharing service
- Print service integration

**Estado actual:**
- ✅ Herramienta de perímetro funcional
- ✅ Persistencia en Firebase
- ✅ Cambio de herramientas sin pérdida de datos
- 🚧 Herramientas de mesas en desarrollo
- ❌ Asignación automática pendiente
- ❌ Sistema de reportes pendiente
