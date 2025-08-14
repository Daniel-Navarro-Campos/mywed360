// Test E2E para el flujo de gestión de carpetas de correo electrónico

describe('Flujo de gestión de carpetas de correo', () => {
  
  // Datos de prueba
  const testUser = {
    email: 'usuario.test@lovenda.com',
    password: 'contraseña123'
  };
  
  // Carpetas de sistema predefinidas
  const systemFolders = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'drafts', name: 'Borradores', system: true },
    { id: 'trash', name: 'Papelera', system: true }
  ];
  
  // Carpetas personalizadas
  const customFolders = [
    { id: 'folder1', name: 'Proveedores', system: false },
    { id: 'folder2', name: 'Ideas', system: false }
  ];
  
  // Lista completa de carpetas
  const allFolders = [...systemFolders, ...customFolders];
  
  // Correos de prueba
  const testEmails = [
    {
      id: 'email1',
      from: 'proveedor1@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Presupuesto para catering',
      body: '<p>Contenido del correo 1</p>',
      date: '2025-07-14T15:30:00Z',
      read: false,
      folder: 'inbox',
      tags: []
    },
    {
      id: 'email2',
      from: 'proveedor2@example.com',
      to: 'usuario.test@lovenda.com',
      subject: 'Disponibilidad para fotografía',
      body: '<p>Contenido del correo 2</p>',
      date: '2025-07-13T10:15:00Z',
      read: true,
      folder: 'inbox',
      tags: []
    },
    {
      id: 'email3',
      from: 'usuario.test@lovenda.com',
      to: 'proveedor3@example.com',
      subject: 'Consulta sobre flores',
      body: '<p>Contenido del correo 3</p>',
      date: '2025-07-12T09:45:00Z',
      read: true,
      folder: 'sent',
      tags: []
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

    // Simular respuesta de la lista de carpetas
    cy.intercept('GET', '**/api/email/folders', {
      statusCode: 200,
      body: {
        success: true,
        data: allFolders
      }
    }).as('getFoldersRequest');

    // Simular respuesta de la lista de correos para bandeja de entrada
    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails.filter(email => email.folder === 'inbox')
      }
    }).as('getInboxRequest');

    // Simular respuesta de la lista de correos para carpeta Enviados
    cy.intercept('GET', '**/api/email/sent', {
      statusCode: 200,
      body: {
        success: true,
        data: testEmails.filter(email => email.folder === 'sent')
      }
    }).as('getSentRequest');

    // Simular respuesta para crear carpeta personalizada
    cy.intercept('POST', '**/api/email/folders', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'folder3',
          name: 'Nueva Carpeta',
          system: false
        }
      }
    }).as('createFolderRequest');

    // Simular respuesta para mover correo a otra carpeta
    cy.intercept('PUT', '**/api/email/*/folder/**', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('moveEmailRequest');

    // Simular respuesta para eliminar carpeta personalizada
    cy.intercept('DELETE', '**/api/email/folders/**', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('deleteFolderRequest');

    // Iniciar sesión antes de cada test
    cy.loginToLovenda(testUser.email, testUser.password);
  });

  it('muestra correctamente las carpetas en el panel lateral', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Verificar que se muestran todas las carpetas en el panel lateral
    cy.get('[data-testid="folders-sidebar"]').should('be.visible');
    cy.get('[data-testid="folder-item"]').should('have.length', allFolders.length);
    
    // Verificar que se muestran correctamente las carpetas del sistema
    cy.get('[data-testid="folder-item"].system-folder').should('have.length', systemFolders.length);
    
    // Verificar que se muestran correctamente las carpetas personalizadas
    cy.get('[data-testid="folder-item"]:not(.system-folder)').should('have.length', customFolders.length);
    
    // Verificar que la carpeta actualmente seleccionada tiene la clase adecuada
    cy.get('[data-testid="folder-item"].active').should('contain', 'Bandeja de entrada');
  });

  it('permite cambiar entre carpetas y muestra los correos correspondientes', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Verificar que se muestran los correos de la bandeja de entrada
    cy.get('[data-testid="email-list-item"]').should('have.length', 2);
    
    // Cambiar a la carpeta "Enviados"
    cy.get('[data-testid="folder-item"]').contains('Enviados').click();
    cy.wait('@getSentRequest');
    
    // Verificar que se muestran los correos de la carpeta "Enviados"
    cy.get('[data-testid="email-list-item"]').should('have.length', 1);
    cy.get('[data-testid="email-list-item"]').should('contain', 'Consulta sobre flores');
    
    // Verificar que la carpeta "Enviados" ahora tiene la clase activa
    cy.get('[data-testid="folder-item"].active').should('contain', 'Enviados');
  });

  it('permite crear carpetas personalizadas', () => {
    // Simular actualización de la lista de carpetas tras crear una nueva
    const updatedFolders = [
      ...allFolders,
      { id: 'folder3', name: 'Nueva Carpeta', system: false }
    ];
    
    cy.intercept('GET', '**/api/email/folders', {
      statusCode: 200,
      body: {
        success: true,
        data: updatedFolders
      }
    }).as('getUpdatedFoldersRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Abrir modal para crear una carpeta
    cy.get('[data-testid="new-folder-button"]').click();
    
    // Verificar que se abre el modal
    cy.get('[data-testid="create-folder-modal"]').should('be.visible');
    
    // Ingresar nombre de la carpeta
    cy.get('[data-testid="folder-name-input"]').type('Nueva Carpeta');
    
    // Guardar la nueva carpeta
    cy.get('[data-testid="save-folder-button"]').click();
    cy.wait('@createFolderRequest');
    
    // Verificar que se actualiza la lista de carpetas
    cy.wait('@getUpdatedFoldersRequest');
    cy.get('[data-testid="folder-item"]').should('have.length', updatedFolders.length);
    cy.get('[data-testid="folder-item"]:not(.system-folder)').should('have.length', customFolders.length + 1);
    cy.get('[data-testid="folder-item"]').contains('Nueva Carpeta').should('be.visible');
  });

  it('permite mover correos entre carpetas', () => {
    // Simular respuesta actualizada para la bandeja de entrada después de mover un correo
    cy.intercept('GET', '**/api/email/inbox', {
      statusCode: 200,
      body: {
        success: true,
        data: [testEmails[1]] // Solo queda el segundo correo en la bandeja
      }
    }).as('getUpdatedInboxRequest');
    
    // Simular respuesta para la carpeta personalizada "Proveedores"
    cy.intercept('GET', '**/api/email/folder/folder1', {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          ...testEmails[0],
          folder: 'folder1' // El primer correo ahora está en esta carpeta
        }]
      }
    }).as('getProveedoresFolderRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Seleccionar el primer correo
    cy.get('[data-testid="email-list-item"]').first().click();
    
    // Abrir menú de carpetas
    cy.get('[data-testid="move-to-folder-button"]').click();
    
    // Verificar que se abre el menú de carpetas
    cy.get('[data-testid="folder-menu"]').should('be.visible');
    
    // Seleccionar carpeta "Proveedores"
    cy.get('[data-testid="folder-menu-item"]').contains('Proveedores').click();
    cy.wait('@moveEmailRequest');
    
    // Verificar que el correo desaparece de la bandeja de entrada
    cy.wait('@getUpdatedInboxRequest');
    cy.get('[data-testid="email-list-item"]').should('have.length', 1);
    cy.get('[data-testid="email-list-item"]').should('not.contain', 'Presupuesto para catering');
    
    // Navegar a la carpeta "Proveedores"
    cy.get('[data-testid="folder-item"]').contains('Proveedores').click();
    cy.wait('@getProveedoresFolderRequest');
    
    // Verificar que el correo aparece en la carpeta "Proveedores"
    cy.get('[data-testid="email-list-item"]').should('have.length', 1);
    cy.get('[data-testid="email-list-item"]').should('contain', 'Presupuesto para catering');
  });

  it('permite eliminar carpetas personalizadas', () => {
    // Simular actualización de la lista de carpetas tras eliminar una
    const reducedFolders = [
      ...systemFolders,
      customFolders[1] // Solo queda la segunda carpeta personalizada
    ];
    
    cy.intercept('GET', '**/api/email/folders', {
      statusCode: 200,
      body: {
        success: true,
        data: reducedFolders
      }
    }).as('getUpdatedFoldersRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Abrir el gestor de carpetas
    cy.get('[data-testid="manage-folders-button"]').click();
    
    // Verificar que se abre el gestor de carpetas
    cy.get('[data-testid="folders-manager-modal"]').should('be.visible');
    
    // Seleccionar la carpeta "Proveedores" para eliminar
    cy.get('[data-testid="folder-row"]').contains('Proveedores')
      .find('[data-testid="delete-folder-button"]').click();
    
    // Confirmar la eliminación
    cy.get('[data-testid="confirm-delete-button"]').click();
    cy.wait('@deleteFolderRequest');
    
    // Cerrar el gestor de carpetas
    cy.get('[data-testid="close-modal-button"]').click();
    
    // Verificar que se actualiza la lista de carpetas
    cy.wait('@getUpdatedFoldersRequest');
    cy.get('[data-testid="folder-item"]').should('have.length', reducedFolders.length);
    cy.get('[data-testid="folder-item"]:not(.system-folder)').should('have.length', 1);
    cy.get('[data-testid="folder-item"]').contains('Proveedores').should('not.exist');
  });

  it('no permite eliminar carpetas del sistema', () => {
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Abrir el gestor de carpetas
    cy.get('[data-testid="manage-folders-button"]').click();
    
    // Verificar que se abre el gestor de carpetas
    cy.get('[data-testid="folders-manager-modal"]').should('be.visible');
    
    // Verificar que las carpetas del sistema no tienen botón de eliminar
    cy.get('[data-testid="folder-row"]').contains('Bandeja de entrada')
      .find('[data-testid="delete-folder-button"]').should('not.exist');
    
    cy.get('[data-testid="folder-row"]').contains('Enviados')
      .find('[data-testid="delete-folder-button"]').should('not.exist');
  });

  it('permite vaciar la carpeta de papelera', () => {
    // Simular respuesta para la carpeta Papelera con correos
    cy.intercept('GET', '**/api/email/trash', {
      statusCode: 200,
      body: {
        success: true,
        data: [{
          id: 'email4',
          from: 'proveedor4@example.com',
          to: 'usuario.test@lovenda.com',
          subject: 'Mensaje eliminado',
          body: '<p>Este correo está en la papelera</p>',
          date: '2025-07-11T08:30:00Z',
          read: true,
          folder: 'trash',
          tags: []
        }]
      }
    }).as('getTrashRequest');
    
    // Simular respuesta después de vaciar la papelera
    cy.intercept('DELETE', '**/api/email/trash/empty', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('emptyTrashRequest');
    
    // Simular respuesta para la carpeta Papelera vacía
    cy.intercept('GET', '**/api/email/trash', {
      statusCode: 200,
      body: {
        success: true,
        data: []
      }
    }).as('getEmptyTrashRequest');
    
    // Navegar a la bandeja de entrada
    cy.navigateToEmailInbox();
    cy.wait('@getFoldersRequest');
    cy.wait('@getInboxRequest');
    
    // Navegar a la carpeta Papelera
    cy.get('[data-testid="folder-item"]').contains('Papelera').click();
    cy.wait('@getTrashRequest');
    
    // Verificar que hay correos en la papelera
    cy.get('[data-testid="email-list-item"]').should('have.length', 1);
    
    // Vaciar la papelera
    cy.get('[data-testid="empty-trash-button"]').click();
    
    // Confirmar la acción
    cy.get('[data-testid="confirm-empty-button"]').click();
    cy.wait('@emptyTrashRequest');
    cy.wait('@getEmptyTrashRequest');
    
    // Verificar que la papelera está vacía
    cy.get('[data-testid="email-list-item"]').should('not.exist');
    cy.get('[data-testid="empty-folder-message"]').should('be.visible');
  });
});
