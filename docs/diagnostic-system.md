# Sistema de Diagnóstico y Logging de Errores - MyWed360

## Descripción General

Se ha implementado un sistema completo de diagnóstico y logging de errores para identificar y resolver problemas en el proyecto MyWed360. Este sistema captura automáticamente todos los errores del frontend y backend, proporciona diagnósticos detallados de servicios críticos, y ofrece herramientas fáciles de usar desde la consola del navegador.

## Características Principales

### 🔍 Diagnóstico Automático
- **Detección automática** de errores JavaScript, promesas rechazadas y errores de red
- **Verificación de conectividad** con Firebase, backend, OpenAI y Mailgun
- **Validación de variables de entorno** críticas
- **Monitor en tiempo real** del estado de todos los servicios

### 📊 Panel Visual
- **Botón flotante** que indica el estado general del sistema
- **Panel de diagnóstico completo** con información detallada
- **Estadísticas de errores** y tendencias
- **Resumen visual** del estado de cada servicio

### 💻 Comandos de Consola
- **Comandos fáciles de usar** desde la consola del navegador
- **Diagnósticos específicos** para cada servicio
- **Exportación de reportes** para debugging
- **Acceso directo** a todas las funcionalidades

## Uso Rápido

### Desde la Consola del Navegador

```javascript
// Diagnóstico completo del sistema
mywed.checkAll()

// Diagnosticar problemas específicos
mywed.checkEmails()    // Para problemas de carga de emails
mywed.checkAI()        // Para problemas del chat IA
mywed.checkFirebase()  // Para problemas de base de datos

// Ver errores recientes
mywed.errors()

// Copiar reporte para enviar al desarrollador
mywed.copyErrors()

// Ver todas las opciones disponibles
mywed.help()
```

### Panel Visual

1. **Botón flotante**: Aparece en la esquina inferior derecha
   - 🟢 Verde: Todo funcionando correctamente
   - 🟡 Amarillo: Advertencias detectadas
   - 🔴 Rojo: Errores críticos (parpadea para llamar la atención)

2. **Contador de errores**: Muestra el número total de errores detectados

3. **Panel completo**: Click en el botón para ver detalles completos

## Diagnósticos Específicos

### 📧 Sistema de Emails

**Problemas comunes detectados:**
- Variables de Mailgun no configuradas
- Backend no disponible
- Errores de autenticación con Mailgun
- Problemas de conectividad con la base de datos de emails
- Webhooks no funcionando

**Comando:** `mywed.checkEmails()`

### 🤖 Chat IA

**Problemas comunes detectados:**
- API Key de OpenAI no configurada o inválida
- Límites de cuota excedidos
- Backend no disponible para procesar requests de IA
- Errores de conectividad con la API de OpenAI

**Comando:** `mywed.checkAI()`

### 🔥 Firebase

**Problemas comunes detectados:**
- Configuración de Firebase incorrecta
- Problemas de autenticación
- Errores de permisos en Firestore
- Problemas de conectividad con la base de datos
- Reglas de seguridad bloqueando acceso

**Comando:** `mywed.checkFirebase()`

## Variables de Entorno Críticas

El sistema verifica automáticamente estas variables:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_STORAGE_BUCKET=

# Backend
VITE_BACKEND_BASE_URL=

# OpenAI
VITE_OPENAI_API_KEY=

# Mailgun
VITE_MAILGUN_API_KEY=
VITE_MAILGUN_DOMAIN=
VITE_MAILGUN_SENDING_DOMAIN=
```

## Interpretación de Resultados

### Estados de Servicios

- ✅ **Success**: Servicio funcionando correctamente
- ⚠️ **Warning**: Servicio parcialmente funcional o con advertencias
- ❌ **Error**: Servicio no disponible o con errores críticos
- ⏳ **Unknown**: Estado aún no determinado

### Tipos de Errores Comunes

1. **JavaScript Error**: Errores de código en el frontend
2. **Network Error**: Problemas de conectividad
3. **HTTP Error**: Respuestas de error del servidor
4. **Console Error**: Errores manuales registrados
5. **Unhandled Promise Rejection**: Promesas no manejadas

## Solución de Problemas Comunes

### Emails no cargan

1. Ejecutar: `mywed.checkEmails()`
2. Verificar variables de Mailgun en `.env`
3. Comprobar que el backend esté disponible
4. Revisar logs del backend en Render

### Chat IA no funciona

1. Ejecutar: `mywed.checkAI()`
2. Verificar `VITE_OPENAI_API_KEY` en `.env`
3. Comprobar cuota de OpenAI
4. Verificar rutas del backend

### Problemas de Firebase

1. Ejecutar: `mywed.checkFirebase()`
2. Verificar configuración en `firebaseConfig.js`
3. Comprobar reglas de Firestore
4. Verificar autenticación del usuario

### Backend no disponible

1. Verificar `VITE_BACKEND_BASE_URL` en `.env`
2. Comprobar estado del servicio en Render
3. Revisar logs del backend
4. Verificar variables de entorno del backend

## Exportar Reportes

Para enviar un reporte completo al desarrollador:

```javascript
// Copiar reporte al portapapeles
await mywed.copyErrors()

// O obtener el reporte como objeto
const report = mywed.logger.getFullReport()
console.log(JSON.stringify(report, null, 2))
```

El reporte incluye:
- Timestamp del reporte
- Estado de todos los servicios
- Lista completa de errores
- Información del entorno
- Detalles del navegador y sistema

## Integración en Desarrollo

### Para Desarrolladores

El sistema se integra automáticamente al cargar la aplicación. Los desarrolladores pueden:

1. **Acceder al logger**: `window.errorLogger`
2. **Usar el servicio de diagnóstico**: `window.mywed.diagnostic`
3. **Registrar errores manualmente**: `mywed.logger.logError('tipo', detalles)`
4. **Ejecutar diagnósticos programáticamente**: `await diagnosticService.runFullDiagnostic()`

### Personalización

El sistema es modular y puede extenderse fácilmente:

- `src/utils/errorLogger.js`: Logger principal
- `src/services/diagnosticService.js`: Servicios de diagnóstico
- `src/components/DiagnosticPanel.jsx`: Interfaz visual
- `src/hooks/useDiagnostic.js`: Hook para componentes React
- `src/utils/consoleCommands.js`: Comandos de consola

## Mejores Prácticas

1. **Revisar errores regularmente**: Usar `mywed.errors()` para monitorear
2. **Ejecutar diagnósticos después de cambios**: Usar `mywed.checkAll()`
3. **Exportar reportes para debugging**: Usar `mywed.copyErrors()`
4. **Monitorear el botón flotante**: Indica problemas en tiempo real
5. **Usar comandos específicos**: Para diagnosticar problemas puntuales

## Troubleshooting

### El sistema no aparece
- Verificar que la aplicación haya cargado completamente
- Comprobar errores en la consola del navegador
- Recargar la página: `mywed.reload()`

### Comandos no disponibles
- Verificar que `window.mywed` esté definido
- Comprobar que no haya errores de JavaScript bloqueando la inicialización
- Recargar la página si es necesario

### Diagnósticos no funcionan
- Verificar conectividad a internet
- Comprobar que las URLs de servicios sean correctas
- Revisar variables de entorno

## Soporte

Para problemas adicionales:
1. Ejecutar `mywed.checkAll()` y copiar el resultado
2. Ejecutar `mywed.copyErrors()` para obtener el reporte completo
3. Enviar ambos reportes al equipo de desarrollo

El sistema está diseñado para ser autosuficiente y proporcionar toda la información necesaria para diagnosticar y resolver problemas comunes en MyWed360.
