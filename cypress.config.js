const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Definimos la URL base dinámicamente para que Cypress se adapte al puerto configurado por la app
    // 1. Si existe la variable de entorno CYPRESS_BASE_URL, la usamos (prioridad máxima)
    // 2. En caso contrario, usamos FRONTEND_PORT definido en .env o 3000 por defecto
    baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },
});
