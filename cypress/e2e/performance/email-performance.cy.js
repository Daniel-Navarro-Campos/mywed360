/// <reference types="cypress" />

/**
 * Pruebas de rendimiento para el sistema de correo electrónico
 * 
 * Estas pruebas utilizan Cypress para medir el rendimiento de las operaciones
 * críticas del sistema de correo electrónico.
 */

describe('Pruebas de rendimiento para el sistema de correo', () => {
  beforeEach(() => {
    // Interceptar solicitudes de red para simular respuestas rápidas en pruebas
    cy.intercept('GET', '**/api/emails*', { 
      fixture: 'emails-large-list.json',
      delay: 50 
    }).as('getEmails');

    cy.intercept('GET', '**/api/tags*', { 
      fixture: 'tags-list.json',
      delay: 20 
    }).as('getTags');

    cy.intercept('GET', '**/api/folders*', { 
      fixture: 'folders-list.json',
      delay: 20 
    }).as('getFolders');

    // Simular login
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('authUser', JSON.stringify({ 
        uid: 'test-user-123', 
        email: 'test@example.com'
      }));
      
      win.localStorage.setItem('userProfile', JSON.stringify({
        id: 'profile123',
        userId: 'test-user-123',
        brideFirstName: 'María',
        brideLastName: 'García',
        groomFirstName: 'Juan',
        groomLastName: 'López',
        weddingDate: '2025-06-15',
        emailAlias: 'maria.garcia'
      }));
    });
  });

  it('debe cargar la lista de correos en menos de 1 segundo', () => {
    // Empezar a contar el tiempo
    const startTime = performance.now();
    
    // Visitar la página de correo
    cy.visit('/email');
    
    // Esperar a que se cargue la lista de correos
    cy.get('[data-testid="email-list"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="email-list-item"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
    
    // Medir tiempo de carga
    cy.window().then(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Registrar el tiempo de carga en la consola
      cy.log(`Tiempo de carga de la lista de correos: ${loadTime}ms`);
      
      // Verificar que el tiempo de carga sea menor a 1000ms
      expect(loadTime).to.be.lessThan(1000);
    });
  });

  it('debe filtrar correos rápidamente', () => {
    // Visitar la página de correo y esperar que se cargue
    cy.visit('/email');
    cy.get('[data-testid="email-list-item"]', { timeout: 10000 }).should('be.visible');
    
    // Interceptar la búsqueda para medir su rendimiento
    cy.intercept('GET', '**/api/emails*', { 
      fixture: 'emails-search-results.json',
      delay: 30
    }).as('searchEmails');
    
    // Empezar a contar el tiempo
    cy.window().then((win) => {
      win.performance.mark('filter-start');
    });
    
    // Realizar búsqueda
    cy.get('[data-testid="email-search-input"]').type('presupuesto');
    
    // Esperar a que se complete la búsqueda
    cy.wait('@searchEmails');
    cy.get('[data-testid="email-list-item"]').should('have.length.greaterThan', 0);
    
    // Medir tiempo de filtrado
    cy.window().then((win) => {
      win.performance.mark('filter-end');
      win.performance.measure('filter-time', 'filter-start', 'filter-end');
      const measures = win.performance.getEntriesByName('filter-time');
      const filterTime = measures[0].duration;
      
      // Registrar el tiempo de filtrado en la consola
      cy.log(`Tiempo de filtrado de correos: ${filterTime}ms`);
      
      // Verificar que el tiempo de filtrado sea menor a 500ms
      expect(filterTime).to.be.lessThan(500);
    });
  });

  it('debe abrir correos con adjuntos en menos de 300ms', () => {
    // Visitar la página de correo y esperar que se cargue
    cy.visit('/email');
    cy.get('[data-testid="email-list-item"]', { timeout: 10000 }).should('be.visible');
    
    // Interceptar la carga del correo con adjuntos
    cy.intercept('GET', '**/api/emails/*/attachments', { 
      fixture: 'email-attachments.json',
      delay: 20
    }).as('getAttachments');
    
    // Empezar a contar el tiempo
    cy.window().then((win) => {
      win.performance.mark('open-email-start');
    });
    
    // Hacer clic en un correo con adjuntos
    cy.get('[data-testid="email-with-attachment"]').first().click();
    
    // Esperar a que se cargue el correo y sus adjuntos
    cy.wait('@getAttachments');
    cy.get('[data-testid="email-attachment-list"]').should('be.visible');
    
    // Medir tiempo de apertura
    cy.window().then((win) => {
      win.performance.mark('open-email-end');
      win.performance.measure('open-email-time', 'open-email-start', 'open-email-end');
      const measures = win.performance.getEntriesByName('open-email-time');
      const openTime = measures[0].duration;
      
      // Registrar el tiempo de apertura en la consola
      cy.log(`Tiempo de apertura de correo con adjuntos: ${openTime}ms`);
      
      // Verificar que el tiempo de apertura sea menor a 300ms
      expect(openTime).to.be.lessThan(300);
    });
  });

  it('debe cambiar entre carpetas rápidamente', () => {
    // Visitar la página de correo y esperar que se cargue
    cy.visit('/email');
    cy.get('[data-testid="email-list-item"]', { timeout: 10000 }).should('be.visible');
    
    // Interceptar la carga de correos de otra carpeta
    cy.intercept('GET', '**/api/emails*', { 
      fixture: 'emails-sent-folder.json',
      delay: 30
    }).as('getSentEmails');
    
    // Empezar a contar el tiempo
    cy.window().then((win) => {
      win.performance.mark('folder-switch-start');
    });
    
    // Hacer clic en la carpeta "Enviados"
    cy.get('[data-testid="folder-sent"]').click();
    
    // Esperar a que se carguen los correos de la carpeta
    cy.wait('@getSentEmails');
    cy.get('[data-testid="email-list-item"]').should('have.length.greaterThan', 0);
    
    // Medir tiempo de cambio de carpeta
    cy.window().then((win) => {
      win.performance.mark('folder-switch-end');
      win.performance.measure('folder-switch-time', 'folder-switch-start', 'folder-switch-end');
      const measures = win.performance.getEntriesByName('folder-switch-time');
      const switchTime = measures[0].duration;
      
      // Registrar el tiempo de cambio de carpeta en la consola
      cy.log(`Tiempo de cambio de carpeta: ${switchTime}ms`);
      
      // Verificar que el tiempo de cambio sea menor a 400ms
      expect(switchTime).to.be.lessThan(400);
    });
  });
});
