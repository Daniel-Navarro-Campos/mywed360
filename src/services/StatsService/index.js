// Bridge de compatibilidad para los tests y componentes que importan
// "services/StatsService" con mayúscula inicial. Reexporta todo desde
// el módulo real statsService.js
import * as actual from '../statsService.js';
export default actual;
export * from '../statsService.js';
