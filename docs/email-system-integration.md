# Sistema de Email Personalizado para Usuarios de Lovenda

Este documento describe la implementación y el uso del sistema de emails personalizados en Lovenda, donde cada usuario tiene su propia dirección de correo electrónico dentro del dominio de la aplicación.

## Arquitectura

El sistema está construido sobre cuatro componentes principales:

1. **EmailService.js**: Servicio principal para gestionar el envío y recepción de emails, con soporte para:
   - API de Mailgun (producción)
   - Backend propio (desarrollo/staging)
   - Almacenamiento local (fallback para desarrollo)

2. **EmailTrackingService.js**: Servicio para el seguimiento de comunicaciones con proveedores.

3. **EmailTemplateService.js**: Servicio para la generación de plantillas de correo personalizadas según la categoría del proveedor y el contexto de búsqueda.

4. **Hooks personalizados**: Facilitan la integración de estos servicios en componentes React.
   - `useProviderEmail.jsx`: Conecta el sistema de email con el flujo de proveedores
   - `useAIProviderEmail.jsx`: Extiende la funcionalidad para integrar con búsqueda AI

## Generación de Direcciones de Email

Cada usuario de Lovenda recibe automáticamente una dirección de email personalizada con el formato:

1. `[alias-elegido]@lovenda.com` (si el usuario ha definido un alias)
2. `[nombre].[apellido]@lovenda.com` (generado automáticamente)
3. `[nombre]@lovenda.com` (si no hay apellido disponible)
4. `user[id]@lovenda.com` (como último recurso)

Estas direcciones son gestionadas por el método `getUserEmailAddress` en `EmailService.js`.

## Flujo de Integración con Proveedores

### Flujo Estándar desde Perfil de Proveedor

1. El usuario visualiza el proveedor en la lista de proveedores
2. Al hacer clic en "Reservar", se abre el modal de reserva (ReservationModal)
3. Dentro del modal, el usuario puede:
   - Agendar una cita directamente
   - Enviar un email al proveedor usando su dirección personalizada
4. Al enviar el email:
   - Se crea un registro de seguimiento en EmailTrackingService
   - El usuario recibe notificaciones cuando el proveedor responde

### Flujo desde Búsqueda AI de Proveedores

1. El usuario realiza una búsqueda usando lenguaje natural en el buscador AI
2. El sistema muestra resultados de proveedores con análisis de AI
3. El usuario puede hacer clic en "Enviar email" directamente desde los resultados
4. Al hacerlo:
   - Se abre un modal de correo con asunto y cuerpo personalizados basados en la consulta
   - El sistema selecciona una plantilla según la categoría del proveedor usando `EmailTemplateService`
   - Se genera contenido personalizado usando la información del proveedor, el análisis AI y la consulta original
   - El usuario puede editar el contenido generado antes de enviarlo
   - El usuario puede editar el correo antes de enviarlo
5. Al enviar el email:
   - Se registra la interacción con AI para análisis
   - Se crea un registro de seguimiento en EmailTrackingService
   - El usuario recibe notificaciones cuando el proveedor responde

## Uso en Componentes React

### Integración Básica con Proveedores

Para integrar el sistema de emails en cualquier componente de la aplicación:

```jsx
import { useProviderEmail } from '../hooks/useProviderEmail';

const MiComponente = () => {
  const { 
    userEmail,                 // Email personalizado del usuario
    sendEmailToProvider,       // Función para enviar emails
    generateDefaultSubject,    // Genera asunto predeterminado según el proveedor
    generateDefaultEmailBody   // Genera cuerpo de email predeterminado
  } = useProviderEmail();
  
  // Uso:
  const handleSendEmail = async () => {
    const result = await sendEmailToProvider(
      proveedorActual, 
      "Asunto del correo", 
      "Contenido del correo"
    );
    
    if (result) {
      // Email enviado correctamente
    }
  };
  
  // ...
};
```

### Integración con Búsqueda AI de Proveedores

Para integrar el sistema de emails con la búsqueda AI de proveedores:

```jsx
import { useAIProviderEmail } from '../hooks/useAIProviderEmail';

const MiComponenteAI = () => {
  const { 
    userEmail,                 // Email personalizado del usuario
    isSending,                 // Estado de envío
    error,                     // Error de envío si existe
    sendEmailFromAIResult,     // Función para enviar emails desde resultados AI
    generateAISubject,         // Genera asunto personalizado basado en resultado AI
    generateAIEmailBody        // Genera cuerpo personalizado basado en resultado y consulta
  } = useAIProviderEmail();
  
  // Uso con resultados de búsqueda AI:
  const handleSendEmailFromAI = async (aiResult, searchQuery) => {
    const result = await sendEmailFromAIResult(
      aiResult,
      searchQuery,
      { // Opcional: personalización adicional
        subject: "Asunto personalizado",
        body: "Contenido personalizado"
      }
    );
    
    if (result) {
      // Email enviado correctamente desde búsqueda AI
    }
  };
};
```

## Tracking y Seguimiento

El sistema registra y hace seguimiento de todas las comunicaciones con proveedores:

- **Estados de seguimiento**: waiting, responded, followup, completed, urgent
- **Etiquetas disponibles**: provider, important, budget, contract, question, offer, appointment

El componente `EmailTrackingList` permite visualizar y filtrar estos seguimientos.

## Configuración Necesaria

Para el funcionamiento correcto del sistema se requiere:

1. Variables de entorno:
   ```
   VITE_MAILGUN_API_KEY=key-xxxxxxxxxxxxx
   VITE_MAILGUN_DOMAIN=lovenda.com
   VITE_BACKEND_BASE_URL=https://api.lovenda.com (opcional)
   ```

2. Inicialización del servicio con perfil de usuario:
   ```js
   import { initEmailService } from './services/EmailService';
   
   // Al iniciar sesión:
   initEmailService(userProfile);
   ```

## Limitaciones Actuales

1. **Autenticación**: El sistema actual depende de Mailgun para la gestión real de emails. Es necesario mantener actualizadas las credenciales.

2. **Verificación de dominios**: Para entornos de producción, el dominio debe estar verificado en Mailgun.

3. **Sincronización**: La sincronización de emails recibidos se realiza bajo demanda. No hay sistema de notificaciones push implementado.

## Mejoras Pendientes

1. **Sistema de notificaciones en tiempo real** para avisar al usuario cuando recibe respuestas.

2. **Integración con calendario** para vincular las citas confirmadas directamente al calendario del usuario.

3. **Plantillas de email adicionales** adaptadas a diferentes tipos de proveedores y situaciones.

4. **Seguimiento automático de conversaciones** para detectar cuando un proveedor no ha respondido en cierto tiempo.

5. **Interfaz unificada de bandeja de entrada** que permita visualizar todas las comunicaciones en un solo lugar.

## Pruebas de Integración Email-Proveedores

Para asegurar el correcto funcionamiento de la integración entre el sistema de correo y el módulo de proveedores, se han implementado las siguientes pruebas:

### 1. Pruebas Unitarias

#### Pruebas del hook `useProviderEmail`

```jsx
// src/test/hooks/useProviderEmail.test.jsx
import { renderHook, act } from '@testing-library/react';
import { useProviderEmail } from '../../hooks/useProviderEmail';
import EmailService from '../../services/EmailService';

// Verificar que el hook proporciona las funciones esperadas
test('useProviderEmail devuelve las funciones requeridas', () => {
  const { result } = renderHook(() => useProviderEmail());
  
  expect(result.current.userEmail).toBeDefined();
  expect(typeof result.current.sendEmailToProvider).toBe('function');
  expect(typeof result.current.generateDefaultSubject).toBe('function');
  expect(typeof result.current.generateDefaultEmailBody).toBe('function');
});

// Verificar la generación de asunto predeterminado
test('generateDefaultSubject genera asunto apropiado', () => {
  const { result } = renderHook(() => useProviderEmail());
  const proveedor = { name: 'Florista Bella', category: 'Flores' };
  
  const subject = result.current.generateDefaultSubject(proveedor);
  expect(subject).toContain('Florista Bella');
});
```

#### Pruebas del componente `ReservationModal`

```jsx
// src/test/components/proveedores/ReservationModal.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationModal from '../../../components/proveedores/ReservationModal';

// Mock del hook useProviderEmail
vi.mock('../../../hooks/useProviderEmail', () => ({
  useProviderEmail: () => ({
    userEmail: 'usuario@lovenda.com',
    sendEmailToProvider: vi.fn().mockResolvedValue(true),
    generateDefaultSubject: () => 'Consulta para Proveedor',
    generateDefaultEmailBody: () => 'Cuerpo del email predeterminado'
  })
}));

// Verificar la apertura del compositor de email
test('muestra el compositor de email al hacer clic en el botón de contacto', async () => {
  const proveedor = { id: 'prov1', name: 'Florista Bella' };
  render(<ReservationModal proveedor={proveedor} isOpen={true} onClose={() => {}} />);
  
  // Hacer clic en botón de contacto
  fireEvent.click(screen.getByText('Contactar por email'));
  
  // Verificar que se muestra el formulario de email
  await waitFor(() => {
    expect(screen.getByTestId('email-composer')).toBeInTheDocument();
  });
});
```

### 2. Pruebas E2E

#### Flujo de Contacto con Proveedor

```js
// cypress/e2e/proveedores/contact-provider.cy.js
describe('Contacto con Proveedor vía Email', () => {
  beforeEach(() => {
    // Iniciar sesión y configurar mocks
    cy.login();
    cy.intercept('POST', '/api/email/send', { statusCode: 200 }).as('sendEmail');
    cy.intercept('GET', '/api/providers*', { fixture: 'providers-list.json' }).as('getProviders');
  });

  it('permite enviar un email a un proveedor desde la lista de proveedores', () => {
    // Visitar lista de proveedores
    cy.visit('/proveedores');
    cy.wait('@getProviders');
    
    // Abrir modal de reserva
    cy.get('[data-testid="provider-card"]').first().within(() => {
      cy.contains('Reservar').click();
    });
    
    // Seleccionar opción de email
    cy.contains('Contactar por email').click();
    
    // Completar y enviar email
    cy.get('[data-testid="email-subject"]').should('have.value', 'Consulta para');
    cy.get('[data-testid="email-body"]').type(' Mensaje de prueba adicional.');
    cy.contains('Enviar Email').click();
    
    // Verificar envío exitoso
    cy.wait('@sendEmail');
    cy.contains('Email enviado correctamente').should('be.visible');
  });
});
```

### 3. Pruebas de Integración

#### Integración Email-Proveedor

```js
// src/test/integration/email-provider-integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailService from '../../services/EmailService';
import EmailTrackingService from '../../services/EmailTrackingService';
import ProviderService from '../../services/ProviderService';

describe('Integración Email-Proveedor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crea un registro de tracking al enviar email a un proveedor', async () => {
    // Mocks
    const emailService = new EmailService();
    const trackingService = new EmailTrackingService();
    const providerService = new ProviderService();
    
    // Espiar métodos
    const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(true);
    const createTrackingSpy = vi.spyOn(trackingService, 'createTracking').mockResolvedValue({ id: 'track1' });
    
    // Ejecutar flujo de envío
    const proveedor = await providerService.getProvider('prov1');
    await emailService.sendEmailToProvider(
      proveedor,
      'usuario@lovenda.com',
      'Asunto prueba',
      'Contenido prueba'
    );
    
    // Verificar
    expect(sendEmailSpy).toHaveBeenCalled();
    expect(createTrackingSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        proveedorId: 'prov1',
        status: 'waiting'
      })
    );
  });
});
```

### 4. Matriz de Pruebas de Integración

| Caso de Prueba | Descripción | Estado |
|---------------|-------------|--------|
| CP-EP-01 | Envío de correo desde perfil de proveedor | ✅ Pasando |
| CP-EP-02 | Respuesta automática para disponibilidad | ✅ Pasando |
| CP-EP-03 | Recepción y notificación de respuesta de proveedor | ✅ Pasando |
| CP-EP-04 | Envío de correo con adjuntos al proveedor | ✅ Pasando |
| CP-EP-05 | Integración con historial de conversaciones | 🔄 En desarrollo |
| CP-EP-06 | Búsqueda avanzada en conversaciones con proveedores | 📝 Planificado |
| CP-EP-07 | Envío de correo desde AI de recomendación de proveedores | ✅ Pasando |

## Contribución

Para extender o modificar este sistema, consultar la documentación de los servicios:
- `EmailService.js`
- `EmailTrackingService.js`
- `useProviderEmail.jsx`
- `useAIProviderEmail.js`

### Componentes para Integración con AI

Para la integración específica con búsqueda AI, consultar:
- `AIEmailModal.jsx` - Modal para enviar correos desde resultados AI
- `AIResultList.jsx` - Lista de resultados con botón de envío de correo
