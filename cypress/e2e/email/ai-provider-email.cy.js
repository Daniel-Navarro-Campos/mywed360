/// <reference types="cypress" />

/**
 * Prueba E2E para verificar el flujo de envío de correos desde búsqueda AI de proveedores.
 * Caso de prueba CP-EP-07: Integración entre sistema de búsqueda de AI para proveedores y sistema de correo.
 */

describe('Flujo de envío de correos desde búsqueda AI de proveedores (CP-EP-07)', () => {
  beforeEach(() => {
    // Interceptar peticiones de búsqueda AI y devolver resultados mockeados
    cy.intercept('POST', '**/api/ai/search', {
      fixture: 'ai-search-results.json',
      delay: 300 // Simular pequeña latencia para probar estados de carga
    }).as('aiSearch');
    
    // Interceptar peticiones de envío de correo y simular éxito
    cy.intercept('POST', '**/api/email/send', {
      statusCode: 200,
      body: { success: true, messageId: 'test-message-id-12345' }
    }).as('sendEmail');
    
    // Cargar la página de proveedores con búsqueda AI
    cy.visit('/proveedores');
    
    // Simular inicio de sesión y contexto de boda
    cy.window().then((win) => {
      win.localStorage.setItem('userEmail', 'usuario.test@lovenda.com');
      win.localStorage.setItem('isLoggedIn', 'true');
      // Configurar contexto de boda para que Proveedores se renderice correctamente
      win.localStorage.setItem('activeWedding', 'test-wedding-123');
      const mockWedding = {
        id: 'test-wedding-123',
        brideFirstName: 'María',
        brideLastName: 'García',
        groomFirstName: 'Juan',
        groomLastName: 'Pérez',
        weddingDate: '2025-10-15'
      };
      win.localStorage.setItem('lovenda_wedding_test-wedding-123', JSON.stringify(mockWedding));
    });
    
    // Refrescar para aplicar cambios de autenticación
    cy.reload();
  });
  
  it('debe permitir buscar proveedores con IA, seleccionar uno y enviarle un correo', () => {
    // 1. Abrir el modal de búsqueda AI
    cy.get('[data-testid="open-ai-search"]').click();
    
    // 2. Verificar que el modal está abierto
    cy.get('[data-testid="ai-search-modal"]').should('be.visible');
    
    // 3. Ingresar consulta de búsqueda
    cy.get('[data-testid="ai-search-input"]')
      .type('fotógrafo estilo natural para boda en exteriores');
    
    // 4. Enviar consulta de búsqueda
    cy.get('[data-testid="ai-search-button"]').click();
    
    // 5. Esperar que se complete la búsqueda
    cy.wait('@aiSearch');
    
    // 6. Verificar que se muestran los resultados
    cy.get('[data-testid="ai-results-list"]').should('be.visible');
    cy.contains('Fotografía Naturaleza Viva').should('be.visible');
    
    // 7. Verificar que el botón de email está presente
    cy.get('[data-testid="email-provider-btn"]').first().should('be.visible');
    
    // 8. Hacer clic en el botón "Enviar email" del primer resultado
    cy.get('[data-testid="email-provider-btn"]').first().click();
    
    // 9. Verificar que el modal de correo está abierto
    cy.get('[data-testid="email-form"]').should('be.visible');
    
    // 10. Verificar que los campos están prellenados correctamente
    cy.get('[data-testid="email-subject"]')
      .should('have.value', 'Consulta sobre Fotografía para boda - Fotografía Naturaleza Viva');
    
    cy.get('[data-testid="email-body"]')
      .should('contain', 'fotógrafo estilo natural para boda en exteriores');
    
    // 11. Modificar el asunto y cuerpo del correo
    cy.get('[data-testid="email-subject"]')
      .clear()
      .type('Consulta sobre servicios de fotografía para boda en Madrid');
    
    cy.get('[data-testid="email-body"]')
      .clear()
      .type('Hola,\n\nEstoy interesado en sus servicios de fotografía para una boda al aire libre en Madrid el próximo junio.\n\n¿Podría enviarme información sobre disponibilidad y precios?\n\nGracias,\nUsuario de prueba');
    
    // 12. Enviar el correo
    cy.get('[data-testid="send-email-btn"]').click();
    
    // 13. Esperar a que se envíe el correo
    cy.wait('@sendEmail');
    
    // 14. Verificar que se muestra el mensaje de éxito
    cy.get('[data-testid="success-alert"]').should('be.visible');
    cy.get('[data-testid="success-alert"]').contains('Email enviado correctamente').should('be.visible');
    
    // 15. Verificar que el modal se cierra automáticamente después de un tiempo
    cy.get('[data-testid="email-form"]', { timeout: 3000 }).should('not.exist');
  });
  
  it('debe manejar errores en el envío de correos desde búsqueda AI', () => {
    // Interceptar peticiones de envío de correo y simular error
    cy.intercept('POST', '**/api/email/send', {
      statusCode: 500,
      body: { success: false, error: 'Error al enviar el correo' }
    }).as('sendEmailError');
    
    // 1. Abrir el modal de búsqueda AI
    cy.get('[data-testid="open-ai-search"]').click();
    
    // 2. Ingresar consulta de búsqueda
    cy.get('[data-testid="ai-search-input"]')
      .type('fotógrafo estilo natural para boda en exteriores');
    
    // 3. Enviar consulta de búsqueda
    cy.get('[data-testid="ai-search-button"]').click();
    
    // 4. Esperar que se complete la búsqueda
    cy.wait('@aiSearch');
    
    // 5. Hacer clic en el botón "Enviar email" del primer resultado
    cy.get('[data-testid="email-provider-btn"]').first().click();
    
    // 6. Verificar que el modal de correo está abierto
    cy.get('[data-testid="email-form"]').should('be.visible');
    
    // 7. Enviar el correo (que debe fallar)
    cy.get('[data-testid="send-email-btn"]').click();
    
    // 8. Esperar a que se intente enviar el correo
    cy.wait('@sendEmailError');
    
    // 9. Verificar que se muestra el mensaje de error
    cy.get('[data-testid="error-alert"]').should('be.visible');
    cy.get('[data-testid="error-alert"]').contains('Error').should('be.visible');
  });
  
  it('debe permitir cancelar el envío del correo', () => {
    // 1. Abrir el modal de búsqueda AI
    cy.get('[data-testid="open-ai-search"]').click();
    
    // 2. Ingresar consulta de búsqueda
    cy.get('[data-testid="ai-search-input"]')
      .type('fotógrafo estilo natural para boda en exteriores');
    
    // 3. Enviar consulta de búsqueda
    cy.get('[data-testid="ai-search-button"]').click();
    
    // 4. Esperar que se complete la búsqueda
    cy.wait('@aiSearch');
    
    // 5. Hacer clic en el botón "Enviar email" del primer resultado
    cy.get('[data-testid="email-provider-btn"]').first().click();
    
    // 6. Verificar que el modal de correo está abierto
    cy.get('[data-testid="email-form"]').should('be.visible');
    
    // 7. Hacer clic en el botón cancelar
    cy.contains('Cancelar').click();
    
    // 8. Verificar que el modal se cierra
    cy.get('[data-testid="email-form"]').should('not.exist');
  });
});
