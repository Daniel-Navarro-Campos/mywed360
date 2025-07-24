/**
 * Índice de todas las plantillas predefinidas de email
 * Este archivo centraliza la exportación de todas las colecciones de plantillas
 */

import proveedorTemplates from './proveedorTemplates';
import invitadosTemplates from './invitadosTemplates';
import generalTemplates from './generalTemplates';
import seguimientoTemplates from './seguimientoTemplates';

// Combinar todas las plantillas en una sola colección
const allTemplates = [
  ...proveedorTemplates,
  ...invitadosTemplates,
  ...generalTemplates,
  ...seguimientoTemplates
];

export {
  proveedorTemplates,
  invitadosTemplates,
  generalTemplates,
  seguimientoTemplates,
  allTemplates
};
