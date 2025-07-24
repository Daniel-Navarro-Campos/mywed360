/**
 * Configuración y utilidades para pruebas de accesibilidad con axe
 */

import { configureAxe, toHaveNoViolations } from 'jest-axe';

// Extender los matchers de Jest para incluir toHaveNoViolations
expect.extend(toHaveNoViolations);

// Configuración personalizada para axe
// Más información: https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure
export const axe = configureAxe({
  rules: {
    // Personalizar reglas específicas
    'color-contrast': { enabled: true },
    'button-name': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-roles': { enabled: true },
    'document-title': { enabled: false }, // Desactivado para componentes individuales
    'landmark-one-main': { enabled: false }, // Desactivado para componentes individuales
    'region': { enabled: false }, // Desactivado para componentes individuales
  },
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa'], // Nivel de conformidad AA
  },
});

/**
 * Genera un mensaje de error detallado para las violaciones de accesibilidad
 * @param {Array} violations - Array de violaciones reportadas por axe
 * @returns {String} - Mensaje de error formateado
 */
export function formatViolations(violations) {
  return violations.map(violation => {
    const nodeMessage = violation.nodes.map(node => {
      const selector = node.target.join(', ');
      const helpUrl = violation.helpUrl;
      return `\n  - ${selector}\n    ${node.html}\n    ${node.failureSummary}\n    Más información: ${helpUrl}`;
    }).join('\n');
    
    return `\n${violation.id}: ${violation.help} (${violation.impact})\n${nodeMessage}`;
  }).join('\n\n');
}
