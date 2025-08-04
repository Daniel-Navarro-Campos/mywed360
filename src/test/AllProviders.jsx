import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// Importamos el AuthProvider real (a través del shim para que los mocks puedan interceptar)
import { AuthProvider } from '../context/AuthContext';

/*
 * Componente contenedor que envuelve el árbol de pruebas con los Providers
 * necesarios para la mayoría de los componentes: React-Router, MUI Theme y
 * AuthContext.  De este modo evitamos repetir envoltorios en cada test.
 */
const theme = createTheme();

const AllProviders = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default AllProviders;
