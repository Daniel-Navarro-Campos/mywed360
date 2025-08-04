// Bridge de compatibilidad: expone los métodos reales de tagService.js
// para los imports que usan "services/TagService"
import * as actual from '../tagService.js';
export default actual;
export * from '../tagService.js';
