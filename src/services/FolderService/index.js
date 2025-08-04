// Bridge de compatibilidad para imports en tests y componentes
// Reexporta todo desde el módulo real folderService.js
import * as actual from '../folderService.js';
export default actual;
export * from '../folderService.js';
