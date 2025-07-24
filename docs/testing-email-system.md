# Guía de Pruebas para el Sistema de Correo de Lovenda

Este documento proporciona una guía completa sobre cómo ejecutar, mantener y ampliar las pruebas para el sistema de correo electrónico de Lovenda.

## Índice

1. [Visión General](#visión-general)
2. [Estructura de Pruebas](#estructura-de-pruebas)
3. [Pruebas Unitarias](#pruebas-unitarias)
4. [Pruebas E2E](#pruebas-e2e)
5. [Pruebas de Accesibilidad](#pruebas-de-accesibilidad)
6. [Pruebas de Rendimiento](#pruebas-de-rendimiento)
7. [Integración Continua](#integración-continua)
8. [Guía de Mantenimiento](#guía-de-mantenimiento)
9. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

## Visión General

El sistema de pruebas de Lovenda está diseñado para asegurar la calidad y fiabilidad del sistema de correo electrónico integrado en la aplicación. Este sistema permite que cada usuario tenga su propio correo electrónico dentro del dominio de Lovenda para comunicarse directamente con proveedores y otros contactos relacionados con la planificación de bodas.

Las pruebas cubren:
- Servicios principales (EmailService, TagService)
- Componentes de UI (EmailComposer, EmailTagsManager, etc.)
- Flujos de usuario completos (envío, recepción, etiquetado, gestión de carpetas)
- Accesibilidad y rendimiento

## Estructura de Pruebas

```
src/
├── test/
│   ├── services/
│   │   ├── EmailService.test.js
│   │   ├── EmailService.edge-cases.test.js
│   │   └── TagService.test.js
│   ├── components/
│   │   ├── EmailComposer.test.jsx
│   │   ├── EmailSettings.test.jsx
│   │   ├── EmailNotificationBadge.test.jsx
│   │   ├── EmailTagsManager.test.jsx
│   │   └── TagsManager.test.jsx
│   ├── accessibility/
│   │   ├── email-components.a11y.test.jsx
│   │   └── email-viewer.a11y.test.jsx
│   └── performance/
│       └── email-system.perf.test.js
cypress/
├── e2e/
│   ├── email/
│   │   ├── send-email.cy.js
│   │   ├── read-email.cy.js
│   │   ├── tag-filter-email.cy.js
│   │   └── folder-management.cy.js
│   └── performance/
│       └── email-performance.cy.js
├── fixtures/
│   ├── emails-large-list.json
│   ├── emails-search-results.json
│   ├── emails-sent-folder.json
│   ├── email-attachments.json
│   ├── tags-list.json
│   └── folders-list.json
└── support/
    ├── commands.js
    └── e2e.js
.github/
└── workflows/
    └── e2e-tests.yml
```

## Pruebas Unitarias

### Ejecutar Pruebas Unitarias

Para ejecutar todas las pruebas unitarias:

```bash
npm run test
```

Para ejecutar un archivo de prueba específico:

```bash
npm run test -- src/test/services/EmailService.test.js
```

Para ejecutar con cobertura:

```bash
npm run test:coverage
```

### Estructura de una Prueba Unitaria

Las pruebas unitarias siguen la estructura básica de Vitest:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponenteAPrueba from './ruta/al/componente';

describe('Nombre del Componente', () => {
  it('debería hacer algo específico', () => {
    // Configuración
    render(<ComponenteAPrueba />);
    
    // Acción
    fireEvent.click(screen.getByText('Botón'));
    
    // Aserción
    expect(screen.getByText('Resultado')).toBeInTheDocument();
  });
});
```

## Pruebas E2E

### Ejecutar Pruebas E2E

Para ejecutar todas las pruebas E2E de forma headless:

```bash
npm run cy:run
```

Para ejecutar un archivo específico:

```bash
npx cypress run --spec "cypress/e2e/email/send-email.cy.js"
```

Para abrir Cypress en modo interactivo:

```bash
npm run cy:open
```

Para ejecutar las pruebas E2E con el servidor de desarrollo:

```bash
npm run test:e2e
```

### Estructura de una Prueba E2E

Las pruebas E2E siguen la estructura de Cypress:

```javascript
describe('Flujo de Usuario', () => {
  beforeEach(() => {
    // Configuración inicial, como visitar la página o interceptar peticiones
    cy.visit('/email');
  });

  it('debería completar un flujo específico', () => {
    // Acciones y aserciones
    cy.get('[data-testid="compose-button"]').click();
    cy.get('[data-testid="to-field"]').type('destinatario@ejemplo.com');
    // ...más acciones...
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
```

## Pruebas de Accesibilidad

### Ejecutar Pruebas de Accesibilidad

```bash
npm run test -- src/test/accessibility/email-components.a11y.test.jsx
```

### Mejores Prácticas

- Usar axe-core para verificar problemas de accesibilidad
- Incluir pruebas para elementos como:
  - Contraste de color
  - Texto alternativo para imágenes
  - Navegación por teclado
  - Roles ARIA apropiados

### Ejemplo:

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

// Extender expect con matcher para axe
expect.extend(toHaveNoViolations);

it('no debe tener violaciones de accesibilidad', async () => {
  const { container } = render(<MiComponente />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Pruebas de Rendimiento

### Ejecutar Pruebas de Rendimiento

```bash
npx cypress run --spec "cypress/e2e/performance/email-performance.cy.js"
```

### Métricas Clave

- Tiempo de carga de la lista de correos: < 1000ms
- Tiempo de filtrado: < 500ms
- Tiempo de apertura de correos con adjuntos: < 300ms
- Tiempo de cambio entre carpetas: < 400ms

### Ejemplos:

```javascript
it('debe cargar la lista de correos en menos de 1 segundo', () => {
  // Iniciar temporizador
  const startTime = performance.now();
  
  // Acción
  cy.visit('/email');
  cy.get('[data-testid="email-list-item"]').should('have.length.greaterThan', 0);
  
  // Verificar tiempo
  cy.window().then(() => {
    const loadTime = performance.now() - startTime;
    expect(loadTime).to.be.lessThan(1000);
  });
});
```

## Integración Continua

Lovenda utiliza GitHub Actions para ejecutar pruebas automáticamente en cada push y pull request.

### Configuración

El archivo de configuración principal se encuentra en `.github/workflows/e2e-tests.yml`.

### Eventos Desencadenantes

- Push a las ramas `main`, `master`, y `desarrollo`
- Pull requests hacia las mismas ramas

### Jobs Ejecutados

- Cypress Run: Ejecuta las pruebas E2E en un entorno de CI

## Guía de Mantenimiento

### Añadir Nuevas Pruebas

1. **Pruebas Unitarias**:
   - Crear archivo en la carpeta apropiada bajo `src/test/`
   - Seguir el patrón `[NombreComponente].test.jsx`
   - Incluir pruebas para todas las funcionalidades principales

2. **Pruebas E2E**:
   - Crear archivo en la carpeta apropiada bajo `cypress/e2e/`
   - Seguir el patrón `[flujo-funcional].cy.js`
   - Utilizar fixtures para datos de prueba

3. **Pruebas de Accesibilidad**:
   - Extender los archivos existentes o crear nuevos en `src/test/accessibility/`
   - Utilizar axe para validaciones automáticas

4. **Pruebas de Rendimiento**:
   - Extender los archivos existentes o crear nuevos en `cypress/e2e/performance/`
   - Definir umbrales claros para cada métrica

### Actualizar Mocks y Fixtures

- Los mocks se definen en los archivos de prueba unitaria usando `vi.mock()`
- Los fixtures se encuentran en `cypress/fixtures/` y deben actualizarse cuando la estructura de datos cambie

### Buenas Prácticas

1. Mantener pruebas independientes entre sí
2. Evitar dependencias externas en pruebas unitarias
3. Usar selectores estables (`data-testid`) en pruebas E2E
4. Documentar las pruebas con comentarios claros
5. Mantener actualizados los umbrales de rendimiento

## Solución de Problemas Comunes

### Pruebas Fallando en CI pero Pasando Localmente

- Verificar diferencias de timezone
- Comprobar dependencias de red (usar mocks)
- Revisar problemas de concurrencia

### Pruebas de Rendimiento Inconsistentes

- Aumentar los umbrales para entornos de CI
- Usar promedios de múltiples ejecuciones
- Normalizar datos de prueba

### Pruebas E2E Lentas

- Reducir el número de fixtures o su tamaño
- Agrupar pruebas relacionadas
- Optimizar selectores y esperas

### Problemas con Mocks

- Verificar que los mocks replican correctamente el comportamiento esperado
- Restaurar mocks después de cada prueba
- Evitar mocks parciales cuando sea posible
