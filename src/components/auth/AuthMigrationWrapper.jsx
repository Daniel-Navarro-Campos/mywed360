// Wrapper de migración de autenticación
// Durante la transición al nuevo sistema se utiliza como contenedor limbo.
// Actualmente simplemente devuelve sus hijos sin modificaciones.

import React from 'react';

const AuthMigrationWrapper = ({ children }) => {
  return <>{children}</>;
};

export default AuthMigrationWrapper;
