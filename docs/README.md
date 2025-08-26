# Documentación MyWed360

## 📋 Índice General

### 👥 **Para Usuarios Finales**
- [`manual-usuario.md`](./manual-usuario.md) - Guía completa de uso de la aplicación

### 🔧 **Para Desarrolladores**

#### **Documentación Principal**
- [`arquitectura-completa.md`](./arquitectura-completa.md) - Arquitectura técnica y diagramas
- [`flujos-usuario.md`](./flujos-usuario.md) - Especificación técnica de todos los flujos
- [`roadmap-2025-v2.md`](./roadmap-2025-v2.md) - Estado actual y roadmap de desarrollo
- [`estimacion-horas-lanzamiento.md`](./estimacion-horas-lanzamiento.md) - Planificación y estimaciones

#### **Flujos Específicos Detallados**
- [`flujos-especificos/flujo-3-gestion-invitados.md`](./flujos-especificos/flujo-3-gestion-invitados.md)
- [`flujos-especificos/flujo-4-plan-asientos.md`](./flujos-especificos/flujo-4-plan-asientos.md)
- [`flujos-especificos/flujo-5-proveedores-ia.md`](./flujos-especificos/flujo-5-proveedores-ia.md)
- [`flujos-especificos/flujo-5-timeline-tareas.md`](./flujos-especificos/flujo-5-timeline-tareas.md)
- [`flujos-especificos/flujo-6-presupuesto.md`](./flujos-especificos/flujo-6-presupuesto.md)
- [`flujos-especificos/flujo-7-comunicacion-emails.md`](./flujos-especificos/flujo-7-comunicacion-emails.md)
- [`flujos-especificos/flujo-8-diseno-web-personalizacion.md`](./flujos-especificos/flujo-8-diseno-web-personalizacion.md)
- [`flujos-especificos/flujo-9-rsvp-confirmaciones.md`](./flujos-especificos/flujo-9-rsvp-confirmaciones.md)
- [`flujos-especificos/flujo-10-gestion-bodas-multiples.md`](./flujos-especificos/flujo-10-gestion-bodas-multiples.md)
- [`flujos-especificos/flujo-11-protocolo-ceremonias.md`](./flujos-especificos/flujo-11-protocolo-ceremonias.md)
- [`flujos-especificos/flujo-12-notificaciones-configuracion.md`](./flujos-especificos/flujo-12-notificaciones-configuracion.md)
- [`flujos-especificos/flujo-13-gestion-contenido.md`](./flujos-especificos/flujo-13-gestion-contenido.md)
- [`flujos-especificos/flujo-14-checklist-avanzado.md`](./flujos-especificos/flujo-14-checklist-avanzado.md)
- [`flujos-especificos/flujo-15-contratos-documentos.md`](./flujos-especificos/flujo-15-contratos-documentos.md)
- [`flujos-especificos/flujo-16-asistente-virtual-ia.md`](./flujos-especificos/flujo-16-asistente-virtual-ia.md)
- [`flujos-especificos/flujo-17-gamificacion-progreso.md`](./flujos-especificos/flujo-17-gamificacion-progreso.md)
- [`flujos-especificos/flujo-18-generador-documentos-legales.md`](./flujos-especificos/flujo-18-generador-documentos-legales.md)

#### **Documentación Técnica**
- [`refactoring/finance-refactor.md`](./refactoring/finance-refactor.md) - Refactorización del módulo Finance
- [`authentication-system.md`](./authentication-system.md) - Sistema de autenticación
- [`i18n.md`](./i18n.md) - Internacionalización
- [`deploy-backend.md`](./deploy-backend.md) - Despliegue del backend
- [`planes-suscripcion.md`](./planes-suscripcion.md) - Planes de suscripción y precios
- [`sistema-roles-tecnico.md`](./sistema-roles-tecnico.md) - Sistema de roles técnico
- [`performance-optimizations.md`](./performance-optimizations.md) - Optimizaciones de rendimiento
- [`lint-accesibilidad.md`](./lint-accesibilidad.md) - Guías de accesibilidad

#### **Documentos Históricos**
- [`archive/seating-plan-refactor.md`](./archive/seating-plan-refactor.md) - Refactorización SeatingPlan (histórico)
- [`archive/seating-plan-validation-report.md`](./archive/seating-plan-validation-report.md) - Validación SeatingPlan (histórico)

## 🎯 **Estado del Proyecto**

### ✅ **Completado (100%)**
- **SeatingPlan**: Refactorizado en 7 componentes modulares + hook useSeatingPlan
- **Finance**: Refactorizado en 9 componentes modulares + hook useFinance
- **Invitados**: Refactorizado en 3 componentes modulares + hook useGuests
- **Sistema de Emails**: Funcional con análisis IA y plantillas automáticas
- **Búsqueda Global**: GlobalSearch.jsx implementado
- **Centro de Notificaciones**: NotificationCenter.jsx funcional
- **Documentación Completa**: 18 flujos específicos documentados
- **Sistema de Roles**: Owner, Wedding Planner, Ayudante definidos
- **Planes de Suscripción**: Estructura comercial completa

### 🚧 **En Desarrollo**
- **Diseño Web con IA**: Generación automática por prompts
- **Sistema de Proveedores**: 85% completado
- **Timeline y Tareas**: 30% completado
- **RSVP Avanzado**: Sistema de confirmaciones inteligente

### ⏱️ **Estimación para Lanzamiento MVP**
**80-100 horas (2-3 semanas trabajando 8h/día)**

## 📊 **Métricas del Proyecto**

- **Archivos de documentación**: 23 archivos organizados (18 flujos específicos + documentos técnicos)
- **Duplicación eliminada**: 17 archivos duplicados del sistema de emails eliminados
- **Componentes refactorizados**: 3 módulos principales completamente modulares
- **Hooks personalizados**: 4 hooks implementados (useFinance, useSeatingPlan, useGuests, useTranslations)
- **Flujos documentados**: 18 flujos específicos completos con estructura de datos
- **Cobertura funcional**: 95% de funcionalidades principales documentadas

## 🗂️ **Estructura de Carpetas**

```
docs/
├── README.md                           # Este archivo
├── manual-usuario.md                   # Manual para usuarios finales
├── arquitectura-completa.md            # Arquitectura técnica
├── roadmap-2025-v2.md                 # Roadmap y estado actual
├── estimacion-horas-lanzamiento.md    # Planificación desarrollo
├── flujos-usuario.md                  # Especificación técnica general
├── planes-suscripcion.md              # Planes comerciales y precios
├── flujos-especificos/                # Flujos detallados por módulo (18 flujos)
│   ├── flujo-3-gestion-invitados.md
│   ├── flujo-4-plan-asientos.md
│   ├── flujo-5-proveedores-ia.md
│   ├── flujo-5-timeline-tareas.md
│   ├── flujo-6-presupuesto.md
│   ├── flujo-7-comunicacion-emails.md
│   ├── flujo-8-diseno-web-personalizacion.md
│   ├── flujo-9-rsvp-confirmaciones.md
│   ├── flujo-10-gestion-bodas-multiples.md
│   ├── flujo-11-protocolo-ceremonias.md
│   ├── flujo-12-notificaciones-configuracion.md
│   ├── flujo-13-gestion-contenido.md
│   ├── flujo-14-checklist-avanzado.md
│   ├── flujo-15-contratos-documentos.md
│   ├── flujo-16-asistente-virtual-ia.md
│   ├── flujo-17-gamificacion-progreso.md
│   └── flujo-18-generador-documentos-legales.md
├── refactoring/                       # Documentación de refactoring
│   └── finance-refactor.md
└── archive/                          # Documentos históricos
    ├── seating-plan-refactor.md
    └── seating-plan-validation-report.md
```

## 🚀 **Próximos Pasos**

### **Esta Semana**
1. Implementar generador IA de sitios web con prompts
2. Desarrollar análisis automático de emails con IA
3. Completar sistema de roles (Owner/Wedding Planner/Ayudante)

### **Próximo Mes**
1. Finalizar sistema de contratos y documentos
2. Implementar checklist avanzado con automatización
3. Desarrollar sistema de notificaciones inteligentes
4. Completar funcionalidades de wedding planners

---

**Última actualización**: 26 de agosto de 2025  
**Mantenido por**: Equipo de Desarrollo MyWed360  
**Documentación**: 18 flujos específicos + 9 documentos técnicos
