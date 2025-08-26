# Plan de Consolidación de Documentación - MyWed360

## 🎯 Objetivo
Eliminar duplicación y crear estructura documental clara y mantenible.

## 📋 Estructura Propuesta

### **MANTENER (Documentos únicos y valiosos)**

#### **Para Desarrolladores:**
- ✅ `flujos-usuario.md` - Especificación técnica completa
- ✅ `arquitectura-completa.md` - Diagrama y contextos
- ✅ `roadmap-2025-v2.md` - Estado actual y prioridades
- ✅ `estimacion-horas-lanzamiento.md` - Planificación desarrollo
- ✅ `finance-refactor.md` - Documentación refactoring

#### **Para Usuarios Finales:**
- ✅ `guia-usuario.md` - Manual de usuario (renombrar a `manual-usuario.md`)

#### **Flujos Específicos Detallados:**
- ✅ `flujo-3-gestion-invitados.md`
- ✅ `flujo-4-plan-asientos.md` 
- ✅ `flujo-5-proveedores-ia.md`
- ✅ `flujo-5-timeline-tareas.md`
- ✅ `flujo-6-presupuesto.md`
- ✅ `flujo-7-comunicacion-emails.md`

### **ELIMINAR (Documentos duplicados/obsoletos)**

#### **Sistema de Emails - Consolidar en flujo-7-comunicacion-emails.md:**
- ❌ `email-system-integration.md`
- ❌ `testing-email-system.md`
- ❌ `tracking-emails.md`
- ❌ `unified-inbox-testing.md`
- ❌ `sistema-plantillas-email.md`
- ❌ `email-recommendations-guide.md`
- ❌ `validacion-integracion.md`
- ❌ `limitaciones-mejoras-emails.md`
- ❌ `analisis-metricas-email.md`
- ❌ `email-system-next-steps.md`
- ❌ `email-templates-guide.md`

#### **Otros Duplicados:**
- ❌ `optimizacion-detector-eventos.md`
- ❌ `cache-sistema-emails.md`
- ❌ `optimizacion-movil-plantillas-email.md`

## 🗂️ Estructura Final Propuesta

```
docs/
├── README.md                           # Índice general
├── manual-usuario.md                   # Guía para usuarios finales
├── arquitectura-completa.md            # Arquitectura técnica
├── roadmap-2025-v2.md                 # Estado y roadmap
├── estimacion-horas-lanzamiento.md    # Planificación
├── flujos-usuario.md                  # Especificación técnica general
├── flujos-especificos/                # Flujos detallados
│   ├── flujo-3-gestion-invitados.md
│   ├── flujo-4-plan-asientos.md
│   ├── flujo-5-proveedores-ia.md
│   ├── flujo-5-timeline-tareas.md
│   ├── flujo-6-presupuesto.md
│   └── flujo-7-comunicacion-emails.md
├── refactoring/                       # Documentación técnica
│   ├── finance-refactor.md
│   └── seating-plan-refactor.md
└── archive/                          # Documentos históricos
    ├── seating-plan-refactor.md
    └── seating-plan-validation-report.md
```

## 📊 Impacto de la Consolidación

### **Antes:**
- 29+ archivos relacionados con emails
- Información duplicada y desactualizada
- Difícil mantenimiento
- Confusión para desarrolladores

### **Después:**
- 12 archivos principales bien organizados
- Información única y actualizada
- Fácil navegación y mantenimiento
- Estructura clara por audiencia

## ⚡ Beneficios

1. **Reducción 60%** en número de archivos
2. **Eliminación** de información duplicada
3. **Claridad** en propósito de cada documento
4. **Mantenimiento** simplificado
5. **Onboarding** más rápido para nuevos desarrolladores

## 🎯 Conclusión

La diferencia clave es:
- **`guia-usuario.md`** = Manual para usuarios finales
- **`flujos-usuario.md`** = Especificación técnica para desarrolladores

Ambos son necesarios pero sirven audiencias diferentes.
