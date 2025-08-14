// Test E2E para el flujo de etiquetado y filtrado de correos

describe('Flujo de etiquetado y filtrado de correos', () => {
  
  // Datos de prueba
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123'
  };
  
  const testTags = [
    { id: 'tag1', name: 'Urgente', color: '#FF0000', systemTag: true },
    { id: 'tag2', name: 'Catering', color: '#00FF00', systemTag: false },
    { id: 'tag3', name: 'Decoración', color: '#0000FF', systemTag: false }
  ];
  
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
      tags: ['tag2'], // Tiene etiqueta "Catering"
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
      tags: ['tag1'], // Tiene etiqueta "Urgente"
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
      tags: ['tag3'], // Tiene etiqueta "Decoración"
      attachments: [
        {
          name: 'catalogo_decoracion.pdf',
          type: 'application/pdf',
          size: 1048576,
          url: 'https://lovenda.com/attachments/catalogo_decoracion.pdf'
        }
      ]
    },
    {
      id: 'email4',
      from: 'proveedor4@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Consulta sobre fecha',
      body: '<p>He recibido tu consulta sobre la fecha de disponibilidad.</p>',
      date: '2025-07-10T14:20:00Z',
      read: true,
      folder: 'inbox',
      tags: [], // Sin etiquetas
      attachments: []
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

    // Simular respuesta de la lista de etiquetas
    cy.intercept('GET', '**/api/tags', {
      statusCode: 200,
      body: {
        success: true,
        data: testTags
      }
    }).as('getTagsRequest');

    // Simular respuesta de filtrado por etiquetas
    cy.intercept('GET', '**/api/email/filter/tag/**', (req) => {
      const tagId = req.url.split('/').pop();
      const filteredEmails = testEmails.filter(email => email.tags.includes(tagId));
      
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: filteredEmails
        }
      });
    }).as('filterByTagRequest');

    // Simular respuesta de agregar etiqueta a un correo
    cy.intercept('POST', '**/api/email/*/tag', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('addTagRequest');

    // Simular respuesta de eliminar etiqueta de un correo
    cy.intercept('DELETE', '**/api/email/*/tag/*', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('removeTagRequest');

    // Iniciar sesión antes de cada test
    cy.loginToLovenda(testUser.email, testUser.password);

  });

  it('muestra correctamente las etiquetas disponibles', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.wait('@getTagsRequest');
    
    // Verificar que se muestran las etiquetas en el panel lateral
    cy.get('[data-testid="tags-sidebar"]').should('be.visible');
    cy.get('[data-testid="tag-item"]').should('have.length', 3);
    
    // Verificar que se muestran correctamente las etiquetas del sistema y personalizadas
    cy.get('[data-testid="tag-item"].system-tag').should('have.length', 1);
    cy.get('[data-testid="tag-item"]:not(.system-tag)').should('have.length', 2);
    
    // Verificar que se muestran los nombres y colores correctos
    cy.get('[data-testid="tag-item"]').first().should('contain', 'Urgente')
      .find('.tag-color').should('have.css', 'background-color', 'rgb(255, 0, 0)');
    
    cy.get('[data-testid="tag-item"]').eq(1).should('contain', 'Catering')
      .find('.tag-color').should('have.css', 'background-color', 'rgb(0, 255, 0)');
  });

  it('permite filtrar correos por etiqueta', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.wait('@getTagsRequest');
    
    // Verificar cantidad inicial de correos
    cy.get('[data-testid="email-list-item"]').should('have.length', 4);
    
    // Filtrar por etiqueta "Catering"
    cy.get('[data-testid="tag-item"]').contains('Catering').click();
    cy.wait('@filterByTagRequest');
    
    // Verificar que se filtran los correos correctamente
    cy.get('[data-testid="email-list-item"]').should('have.length', 1);
    cy.get('[data-testid="email-list-item"]').should('contain', 'Presupuesto para catering');
    
    // Verificar que se muestra el indicador de filtro activo
    cy.get('[data-testid="active-filter-indicator"]').should('contain', 'Catering');
    
    // Limpiar filtro
    cy.get('[data-testid="clear-filter-button"]').click();
    cy.wait('@getInboxRequest');
    
    // Verificar que se vuelven a mostrar todos los correos
    cy.get('[data-testid="email-list-item"]').should('have.length', 4);
  });

  it('permite agregar etiquetas a un correo', () => {
    // Interceptar la solicitud de un correo específico
    cy.intercept('GET', '**/api/email/email4', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails[3]
      }
    }).as('getEmailRequest');
    
    // Simular actualización exitosa de etiquetas
    const updatedEmail = {
      ...testEmails[3],
      tags: ['tag1'] // Ahora tiene la etiqueta "Urgente"
    };
    
    cy.intercept('GET', '**/api/email/email4', {
      statusCode: 200,
      body: {
        success: true,
        data: updatedEmail
      }
    }).as('getUpdatedEmailRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.wait('@getTagsRequest');
    
    // Abrir el correo sin etiquetas
    cy.get('[data-testid="email-list-item"]').contains('Consulta sobre fecha').click();
    cy.wait('@getEmailRequest');
    
    // Verificar que no tiene etiquetas inicialmente
    cy.get('[data-testid="email-tag"]').should('not.exist');
    
    // Abrir menú de etiquetas
    cy.get('[data-testid="tag-menu-button"]').click();
    
    // Seleccionar etiqueta "Urgente"
    cy.get('[data-testid="tag-option"]').contains('Urgente').click();
    cy.wait('@addTagRequest');
    
    // Verificar que se muestra la etiqueta en el correo
    cy.wait('@getUpdatedEmailRequest');
    cy.get('[data-testid="email-tag"]').should('contain', 'Urgente')
      .and('have.css', 'background-color', 'rgb(255, 0, 0)');
  });

  it('permite eliminar etiquetas de un correo', () => {
    // Interceptar la solicitud de un correo específico
    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails[0]
      }
    }).as('getEmailRequest');
    
    // Simular actualización exitosa de etiquetas (sin etiquetas)
    const updatedEmail = {
      ...testEmails[0],
      tags: [] // Ahora no tiene etiquetas
    };
    
    cy.intercept('GET', '**/api/email/email1', {
      statusCode: 200,
      body: {
        success: true,
        data: updatedEmail
      }
    }).as('getUpdatedEmailRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.wait('@getTagsRequest');
    
    // Abrir el correo con la etiqueta "Catering"
    cy.get('[data-testid="email-list-item"]').contains('Presupuesto para catering').click();
    cy.wait('@getEmailRequest');
    
    // Verificar que tiene la etiqueta inicialmente
    cy.get('[data-testid="email-tag"]').should('contain', 'Catering');
    
    // Eliminar la etiqueta
    cy.get('[data-testid="email-tag"] .remove-tag-button').click();
    cy.wait('@removeTagRequest');
    
    // Verificar que ya no se muestra la etiqueta
    cy.wait('@getUpdatedEmailRequest');
    cy.get('[data-testid="email-tag"]').should('not.exist');
  });

  it('permite crear y aplicar nuevas etiquetas personalizadas', () => {
    // Simular respuesta de creación de nueva etiqueta
    const newTag = {
      id: 'tag4',
      name: 'Presupuestos',
      color: '#FFA500',
      systemTag: false
    };
    
    cy.intercept('POST', '**/api/tags', {
      statusCode: 200,
      body: {
        success: true,
        data: newTag
      }
    }).as('createTagRequest');
    
    // Simular actualización de la lista de etiquetas
    cy.intercept('GET', '**/api/tags', {
      statusCode: 200,
      body: {
        success: true,
        data: [...testTags, newTag]
      }
    }).as('getUpdatedTagsRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getInboxRequest');
    cy.wait('@getTagsRequest');
    
    // Abrir el gestor de etiquetas
    cy.get('[data-testid="manage-tags-button"]').click();
    
    // Verificar que se abre el gestor de etiquetas
    cy.get('[data-testid="tags-manager-modal"]').should('be.visible');
    
    // Crear nueva etiqueta
    cy.get('[data-testid="new-tag-button"]').click();
    cy.get('[data-testid="tag-name-input"]').type('Presupuestos');
    
    // Seleccionar color naranja
    cy.get('[data-testid="color-option"]').eq(3).click(); // Suponiendo que el naranja es la 4ª opción
    
    // Guardar la nueva etiqueta
    cy.get('[data-testid="save-tag-button"]').click();
    cy.wait('@createTagRequest');
    
    // Cerrar el gestor de etiquetas
    cy.get('[data-testid="close-modal-button"]').click();
    
    // Verificar que la nueva etiqueta aparece en el panel lateral
    cy.wait('@getUpdatedTagsRequest');
    cy.get('[data-testid="tag-item"]').should('have.length', 4);
    cy.get('[data-testid="tag-item"]').contains('Presupuestos').should('be.visible');
  });
});
