// Test E2E para el flujo de recepción y lectura de correos electrónicos

describe('Flujo de recepción y lectura de correos', () => {
  
  // Datos de prueba
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123'
  };
  
  const testEmails = [
    {
      id: 'email1',
      from: 'proveedor1@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Presupuesto para catering',
      body: '<p>Adjunto encontrarás el presupuesto para el servicio de catering que solicitaste.</p>',
      date: '2025-07-14T15:30:00Z',
      read: false,
      folder: 'inbox',
      attachments: [
        {
          name: 'presupuesto_catering.pdf',
          type: 'application/pdf',
          size: 512000,
          url: 'https://lovenda.com/attachments/presupuesto_catering.pdf'
        }
      ]
    },
    {
      id: 'email2',
      from: 'proveedor2@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Disponibilidad para fotografía',
      body: '<p>Gracias por tu interés en nuestros servicios de fotografía. Te confirmo que tenemos disponibilidad para la fecha de tu boda.</p>',
      date: '2025-07-13T10:15:00Z',
      read: true,
      folder: 'inbox',
      attachments: []
    },
    {
      id: 'email3',
      from: 'proveedor3@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Catálogo de decoración',
      body: '<p>Te comparto nuestro catálogo de decoración para bodas.</p>',
      date: '2025-07-12T09:45:00Z',
      read: false,
      folder: 'inbox',
      attachments: [
        {
          name: 'catalogo_decoracion.pdf',
          type: 'application/pdf',
          size: 1048576,
          url: 'https://lovenda.com/attachments/catalogo_decoracion.pdf'
        }
      ]
    }
  ];

  beforeEach(() => {
    // Intercepción para simular la respuesta de autenticación
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        user: {
          id: 'user123',
          email: testUser.email,
          name: 'Usuario Test',
        },
        token: 'fake-jwt-token',
        profile: {
          id: 'profile123',
          userId: 'user123',
          brideFirstName: 'María',
          brideLastName: 'García',
          groomFirstName: 'Juan',
          groomLastName: 'Pérez',
          weddingDate: '2025-10-15',
          emailAlias: 'maria.juan'
        }
      }
    }).as('loginRequest');

    // Simular respuesta de la lista de correos
    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails
      }
    }).as('getInboxRequest');

    // Simular actualización de estado de lectura
    cy.intercept('PUT', '**/api/email/*/read', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('markAsReadRequest');

    // Iniciar sesión antes de cada test
    cy.loginToLovenda(testUser.email, testUser.password);
    cy.wait('@loginRequest');
  });

  it('muestra la lista de correos en la bandeja de entrada', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    
    // Verificar que se muestran los correos
    cy.get('[data-testid="email-list-item"]').should('have.length', 3);
    
    // Verificar que se muestran los correos no leídos correctamente
    cy.get('[data-testid="email-list-item"].unread').should('have.length', 2);
    
    // Verificar que se muestran los datos básicos de cada correo
    cy.get('[data-testid="email-list-item"]').first().within(() => {
      cy.contains('proveedor1@example.com');
      cy.contains('Presupuesto para catering');
      cy.get('[data-testid="attachment-indicator"]').should('exist');
    });
  });

  it('permite abrir y leer un correo electrónico', () => {
    // Interceptar la solicitud de un correo específico
    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails[0]
      }
    }).as('getEmailRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    
    // Abrir el primer correo (no leído)
    cy.get('[data-testid="email-list-item"].unread').first().click();
    
    // Verificar que se carga el correo
    cy.wait('@getEmailRequest');
    
    // Verificar que se actualiza el estado de lectura
    cy.wait('@markAsReadRequest');
    
    // Verificar que se muestran los detalles del correo
    cy.get('[data-testid="email-detail-from"]').should('contain', 'proveedor1@example.com');
    cy.get('[data-testid="email-detail-subject"]').should('contain', 'Presupuesto para catering');
    cy.get('[data-testid="email-detail-body"]').should('contain', 'Adjunto encontrarás el presupuesto');
    
    // Verificar que se muestra el adjunto
    cy.get('[data-testid="email-attachment"]').should('contain', 'presupuesto_catering.pdf');
  });

  it('permite descargar adjuntos de un correo', () => {
    // Interceptar la solicitud de un correo específico
    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails[0]
      }
    }).as('getEmailRequest');
    
    // Interceptar la descarga del adjunto
    cy.intercept('GET', '**/attachments/presupuesto_catering.pdf', {
      statusCode: 200,
      response: 'attachment-binary-data'
    }).as('downloadAttachmentRequest');
    
    // Navegar a la bandeja de entrada y abrir el correo
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.get('[data-testid="email-list-item"]').first().click();
    cy.wait('@getEmailRequest');
    
    // Hacer clic en el adjunto para descargarlo
    cy.get('[data-testid="email-attachment-download"]').click();
    
    // Verificar que se inicia la descarga
    cy.wait('@downloadAttachmentRequest');
  });

  it('muestra correctamente el estado de correos leídos/no leídos', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    
    // Verificar estado inicial
    cy.get('[data-testid="email-list-item"].unread').should('have.length', 2);
    cy.get('[data-testid="email-list-item"]:not(.unread)').should('have.length', 1);
    
    // Verificar el contador de no leídos
    cy.get('[data-testid="unread-counter"]').should('contain', '2');
    
    // Simular actualización de la bandeja después de marcar como leído
    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { ...testEmails[0], read: true },
          testEmails[1],
          testEmails[2]
        ]
      }
    }).as('getUpdatedInboxRequest');
    
    // Abrir el primer correo
    cy.get('[data-testid="email-list-item"].unread').first().click();
    
    // Volver a la bandeja de entrada
    cy.get('[data-testid="back-to-inbox-button"]').click();
    cy.wait('@getUpdatedInboxRequest');
    
    // Verificar que el estado de lectura se actualizó
    cy.get('[data-testid="email-list-item"].unread').should('have.length', 1);
    cy.get('[data-testid="unread-counter"]').should('contain', '1');
  });
});
