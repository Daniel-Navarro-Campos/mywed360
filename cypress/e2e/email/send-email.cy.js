// Test E2E para el flujo completo de envío de correo electrónico

describe('Flujo de envío de correo electrónico', () => {
  
  // Datos de prueba
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123'
  };
  
  const testEmail = {
    recipient: 'proveedor@example.com',
    subject: 'Consulta sobre servicios para boda',
    body: 'Hola, estoy interesada en los servicios que ofreces para mi boda. ¿Podrías proporcionarme más información sobre disponibilidad y precios? Gracias.'
  };

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

    // Simular respuesta exitosa de envío de correo
    cy.intercept('POST', '**/api/email/send', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'email123',
          from: 'maria.juan@lovenda.com',
          to: testEmail.recipient,
          subject: testEmail.subject,
          date: new Date().toISOString(),
          folder: 'sent'
        }
      }
    }).as('sendEmailRequest');

    // Iniciar sesión antes de cada test
    cy.loginToLovenda(testUser.email, testUser.password);

  });

  it('permite al usuario enviar un correo electrónico a un proveedor', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    
    // Comprobar que la página de correo se carga correctamente
    cy.get('[data-testid="email-title"]').should('contain', 'Bandeja de entrada');
    
    // Hacer clic en el botón de redactar correo
    cy.get('[data-testid="compose-button"]').click();
    
    // Verificar que se abre el formulario de composición
    cy.get('[data-testid="email-composer"]').should('be.visible');
    
    // Rellenar formulario
    cy.get('[data-testid="recipient-input"]').type(testEmail.recipient);
    cy.get('[data-testid="subject-input"]').type(testEmail.subject);
    cy.get('[data-testid="body-editor"]').type(testEmail.body);
    
    // Enviar el correo
    cy.get('[data-testid="send-button"]').click();
    
    // Esperar a que se complete la solicitud de envío
    cy.wait('@sendEmailRequest');
    
    // Verificar mensaje de éxito
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Correo enviado correctamente');
    
    // Comprobar que se redirige de vuelta a la bandeja de entrada
    cy.url().should('include', '/email/inbox');
    
    // Verificar que aparece en la carpeta de enviados
    cy.get('[data-testid="folder-sent"]').click();
    cy.get('[data-testid="email-list"]').should('contain', testEmail.subject);
  });

  it('muestra advertencia si intenta enviar un correo sin destinatario', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    
    // Hacer clic en el botón de redactar correo
    cy.get('[data-testid="compose-button"]').click();
    
    // Rellenar solo asunto y cuerpo, omitiendo destinatario
    cy.get('[data-testid="subject-input"]').type(testEmail.subject);
    cy.get('[data-testid="body-editor"]').type(testEmail.body);
    
    // Intentar enviar el correo
    cy.get('[data-testid="send-button"]').click();
    
    // Verificar mensaje de error
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'El destinatario es obligatorio');
    
    // Comprobar que no se redirige a otra página
    cy.get('[data-testid="email-composer"]').should('be.visible');
  });

  it('permite adjuntar archivos al correo electrónico', () => {
    // Configurar intercepción para simular carga de archivo
    cy.intercept('POST', '**/api/upload', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          url: 'https://lovenda.com/uploads/fake-file.pdf',
          name: 'presupuesto.pdf',
          size: 1024 * 1024, // 1MB
          type: 'application/pdf'
        }
      }
    }).as('fileUpload');

    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    
    // Hacer clic en el botón de redactar correo
    cy.get('[data-testid="compose-button"]').click();
    
    // Rellenar formulario
    cy.get('[data-testid="recipient-input"]').type(testEmail.recipient);
    cy.get('[data-testid="subject-input"]').type('Correo con adjunto');
    cy.get('[data-testid="body-editor"]').type('Por favor, revisa el archivo adjunto.');
    
    // Adjuntar archivo
    cy.get('[data-testid="attachment-input"]').attachFile({
      fileContent: 'test',
      fileName: 'presupuesto.pdf',
      mimeType: 'application/pdf'
    });
    
    // Esperar a que se complete la carga del archivo
    cy.wait('@fileUpload');
    
    // Verificar que el archivo se muestra en la lista de adjuntos
    cy.get('[data-testid="attachment-list"]').should('contain', 'presupuesto.pdf');
    
    // Enviar el correo
    cy.get('[data-testid="send-button"]').click();
    
    // Esperar a que se complete la solicitud de envío
    cy.wait('@sendEmailRequest');
    
    // Verificar mensaje de éxito
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
