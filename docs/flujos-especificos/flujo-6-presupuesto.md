# 6. Flujo de Gestión de Presupuesto (Detallado)

## 6.1 Configuración Inicial del Presupuesto
**Objetivo:** Establecer el marco financiero completo para la boda

### Definición de Presupuesto Total
**Pasos detallados:**
- [ ] **Entrada de presupuesto total**
  - Campo numérico con validación
  - Selección de moneda (EUR, USD, etc.)
  - Opción "No estoy seguro" → IA sugiere rangos típicos
  - Guardado en `/weddings/{weddingId}/budget/total`

- [ ] **Sugerencias de IA basadas en contexto**
  - Análisis de: ubicación, número de invitados, tipo de boda
  - "Para una boda de 120 invitados en Madrid, el presupuesto típico es 20.000-35.000€"
  - Comparación con bodas similares en la plataforma
  - Factores que influyen en el costo

### División Automática por Categorías
**Pasos detallados:**
- [ ] **Categorías predefinidas con porcentajes típicos**
  ```javascript
  const defaultCategories = {
    venue: { name: "Lugar/Venue", percentage: 40, color: "#FF6B6B" },
    catering: { name: "Catering", percentage: 25, color: "#4ECDC4" },
    photography: { name: "Fotografía", percentage: 10, color: "#45B7D1" },
    flowers: { name: "Flores/Decoración", percentage: 8, color: "#96CEB4" },
    music: { name: "Música/DJ", percentage: 5, color: "#FFEAA7" },
    dress: { name: "Vestido/Traje", percentage: 5, color: "#DDA0DD" },
    transport: { name: "Transporte", percentage: 3, color: "#FFB347" },
    other: { name: "Otros/Imprevistos", percentage: 4, color: "#A8A8A8" }
  }
  ```

- [ ] **Personalización de categorías**
  - Ajuste manual de porcentajes con sliders
  - Añadir/eliminar categorías personalizadas
  - Validación: suma total = 100%
  - Vista previa en tiempo real

- [ ] **Cálculo automático de montos**
  - Monto por categoría = (presupuesto total × porcentaje) / 100
  - Actualización automática al cambiar porcentajes
  - Redondeo inteligente para evitar decimales

## 6.2 Gestión de Gastos y Transacciones
**Objetivo:** Registrar y controlar todos los gastos realizados

### Registro de Gastos
**Pasos detallados:**
- [ ] **Formulario de nuevo gasto**
  - Concepto/descripción del gasto
  - Monto gastado (validación numérica)
  - Categoría (dropdown con categorías definidas)
  - Fecha del gasto (date picker)
  - Proveedor asociado (opcional, autocomplete)
  - Método de pago (efectivo, tarjeta, transferencia)
  - Notas adicionales (opcional)
  - Adjuntar recibo/factura (imagen/PDF)

- [ ] **Validaciones y alertas**
  - Alerta si el gasto excede el presupuesto de la categoría
  - Confirmación para gastos grandes (>10% del presupuesto total)
  - Verificación de duplicados por monto y fecha
  - Formato correcto de moneda

- [ ] **Estados de transacciones**
  - **Planificado**: Gasto estimado, no realizado aún
  - **Pagado**: Gasto realizado y pagado completamente
  - **Pendiente**: Gasto realizado, pago pendiente
  - **Parcial**: Pago parcial realizado (señal, anticipo)

### Importación de Gastos
**Pasos detallados:**
- [ ] **Importación desde archivo CSV/Excel**
  - Template descargable con formato correcto
  - Mapeo de columnas automático
  - Validación de datos antes de importar
  - Vista previa de datos a importar
  - Opción de corregir errores antes de confirmar

- [ ] **Integración bancaria (futuro)**
  - Conexión con APIs bancarias (Open Banking)
  - Categorización automática con IA
  - Detección de gastos relacionados con la boda
  - Confirmación manual antes de añadir

## 6.3 Seguimiento y Control
**Objetivo:** Monitorear el estado financiero en tiempo real

### Dashboard de Presupuesto
**Pasos detallados:**
- [ ] **Indicadores principales**
  - Presupuesto total vs gastado (barra de progreso)
  - Porcentaje utilizado del presupuesto
  - Dinero restante disponible
  - Proyección de gasto final

- [ ] **Vista por categorías**
  - Tabla con: Categoría | Presupuestado | Gastado | Restante | %
  - Barras de progreso por categoría
  - Código de colores: verde (OK), amarillo (alerta), rojo (excedido)
  - Ordenación por diferentes criterios

- [ ] **Gráficos y visualizaciones**
  - Gráfico de pastel: distribución del presupuesto
  - Gráfico de barras: presupuestado vs gastado
  - Timeline de gastos por fecha
  - Evolución del gasto a lo largo del tiempo

### Alertas y Notificaciones
**Pasos detallados:**
- [ ] **Configuración de alertas**
  - Alerta al 75% del presupuesto de una categoría
  - Alerta al 90% del presupuesto total
  - Alerta cuando se excede cualquier categoría
  - Notificación de gastos grandes (configurable)

- [ ] **Tipos de notificaciones**
  - **En la aplicación**: Badge en el menú de presupuesto
  - **Email**: Resumen semanal de gastos
  - **Push**: Alertas críticas inmediatas
  - **Dashboard**: Widget de alertas activas

## 6.4 Reportes y Análisis
**Objetivo:** Generar informes detallados para toma de decisiones

### Reportes Automáticos
**Pasos detallados:**
- [ ] **Reporte de estado actual**
  - Resumen ejecutivo del presupuesto
  - Desglose detallado por categorías
  - Lista de gastos más significativos
  - Proyección de gastos futuros
  - Recomendaciones de IA

- [ ] **Reporte de proveedores**
  - Gastos agrupados por proveedor
  - Análisis de pagos pendientes
  - Historial de transacciones por proveedor
  - Evaluación de costos vs presupuesto inicial

- [ ] **Exportación de datos**
  - PDF para compartir con pareja/familia
  - Excel para análisis detallado
  - CSV para importar en otras herramientas
  - Integración con herramientas contables

### Análisis Predictivo con IA
**Pasos detallados:**
- [ ] **Predicción de gastos futuros**
  - Análisis de patrones de gasto actuales
  - Comparación con bodas similares
  - Identificación de gastos típicos faltantes
  - Proyección de costo final

- [ ] **Recomendaciones de optimización**
  - Categorías donde se puede ahorrar
  - Sugerencias de proveedores más económicos
  - Momentos óptimos para realizar compras
  - Alertas de gastos innecesarios

## 6.5 Gestión de Aportaciones
**Objetivo:** Gestionar contribuciones de familiares y amigos

### Configuración de Aportaciones
**Pasos detallados:**
- [ ] **Definir contribuyentes**
  - Lista de personas que van a aportar dinero
  - Monto comprometido por cada persona
  - Fecha esperada de aportación
  - Estado: comprometido, recibido, pendiente

- [ ] **Métodos de aportación**
  - Transferencia bancaria
  - Efectivo
  - Cheque
  - Plataformas de pago (PayPal, Bizum, etc.)

- [ ] **Seguimiento de aportaciones**
  - Registro de aportes recibidos
  - Notificaciones de agradecimiento automáticas
  - Recordatorios suaves para aportes pendientes
  - Reporte de aportaciones para transparencia

### Gestión de Pagos a Proveedores
**Pasos detallados:**
- [ ] **Calendario de pagos**
  - Fechas de pago acordadas con proveedores
  - Montos y conceptos de cada pago
  - Recordatorios automáticos
  - Estado de cada pago

- [ ] **Integración con contratos**
  - Vinculación con documentos de proveedores
  - Seguimiento de términos de pago
  - Alertas de penalizaciones por retraso
  - Historial de comunicaciones sobre pagos

## Estructura de Datos

```javascript
// /weddings/{weddingId}/budget
{
  total: 25000,
  currency: "EUR",
  categories: {
    venue: { 
      budgeted: 10000, 
      spent: 8500, 
      percentage: 40,
      color: "#FF6B6B"
    },
    catering: { 
      budgeted: 6250, 
      spent: 0, 
      percentage: 25,
      color: "#4ECDC4"
    }
    // ... más categorías
  },
  transactions: [
    {
      id: "tx_001",
      concept: "Señal venue Hotel Majestic",
      amount: 2000,
      category: "venue",
      date: "2024-01-15",
      provider: "hotel_majestic",
      paymentMethod: "transfer",
      status: "paid",
      receipt: "receipt_001.pdf",
      notes: "Señal 20% del total"
    }
  ],
  contributions: [
    {
      contributor: "Padres Ana",
      committed: 5000,
      received: 5000,
      date: "2024-01-10",
      status: "received"
    }
  ],
  alerts: {
    enabled: true,
    categoryThreshold: 75, // %
    totalThreshold: 90, // %
    largeExpenseAmount: 1000
  }
}
```

## Estado de Implementación

### ✅ Completado
- Estructura básica de datos de presupuesto
- Formulario básico de gastos

### 🚧 En Desarrollo
- Dashboard de visualización
- Sistema de alertas
- Categorización automática

### ❌ Pendiente
- Reportes automáticos
- Integración bancaria
- Análisis predictivo con IA
- Gestión de aportaciones
- Exportación de datos
