import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Tabs, Tab, Button, TextField, Switch, FormControlLabel, Divider, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Componente de configuración del sistema para administradores
 * Permite gestionar parámetros globales de la aplicación
 * 
 * @component
 * @example
 * ```jsx
 * <SystemSettings />
 * ```
 */
function SystemSettings() {
  const [activeTab, setActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Estados para las diferentes configuraciones
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Lovenda',
    siteDescription: 'Plataforma de conexión con proveedores',
    maxUploadSize: 10,
    allowedFileTypes: '.jpg,.png,.pdf,.docx,.xlsx',
    enableUserRegistration: true,
    maintenanceMode: false,
    contactEmail: 'soporte@lovenda.com',
  });

  const [emailSettings, setEmailSettings] = useState({
    defaultEmailDomain: 'lovenda.com',
    smtpServer: 'smtp.lovenda.com',
    smtpPort: 587,
    smtpUseSSL: true,
    smtpUsername: '',
    smtpPassword: '',
    emailsPerHour: 100,
    maxAttachmentSize: 5,
    defaultSignature: '-- Enviado desde Lovenda',
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeoutMinutes: 30,
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    passwordResetTimeHours: 24,
    twoFactorAuthDefault: false,
    ipWhitelist: '',
  });
  
  // Manejo de cambios en las pestañas
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Manejadores de cambio para cada sección
  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings({
      ...emailSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Simulación de guardado
  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    // Simular una llamada API
    setTimeout(() => {
      setIsSaving(false);
      
      // Simulamos éxito (en producción esto sería una llamada a la API)
      setSaveSuccess(true);
      
      // Resetear el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">Configuración del Sistema</Typography>
      
      {saveSuccess && (
        <Alert severity="success" className="mb-4">
          Configuración guardada correctamente
        </Alert>
      )}
      
      {saveError && (
        <Alert severity="error" className="mb-4">
          Error al guardar la configuración: {saveError}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="configuración del sistema">
          <Tab label="General" />
          <Tab label="Correo Electrónico" />
          <Tab label="Seguridad" />
        </Tabs>
      </Box>
      
      {/* Panel General */}
      {activeTab === 0 && (
        <Card className="mt-4">
          <CardContent className="space-y-4">
            <Typography variant="h6">Configuración General</Typography>
            <Divider />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextField
                label="Nombre del Sitio"
                name="siteName"
                value={generalSettings.siteName}
                onChange={handleGeneralChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Descripción del Sitio"
                name="siteDescription"
                value={generalSettings.siteDescription}
                onChange={handleGeneralChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Tamaño máximo de archivos (MB)"
                name="maxUploadSize"
                type="number"
                value={generalSettings.maxUploadSize}
                onChange={handleGeneralChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Tipos de archivos permitidos"
                name="allowedFileTypes"
                value={generalSettings.allowedFileTypes}
                onChange={handleGeneralChange}
                fullWidth
                variant="outlined"
                helperText="Separados por comas, ej: .jpg,.png,.pdf"
              />
              
              <TextField
                label="Email de Contacto"
                name="contactEmail"
                value={generalSettings.contactEmail}
                onChange={handleGeneralChange}
                fullWidth
                variant="outlined"
              />
              
              <div className="col-span-1 md:col-span-2 flex flex-col space-y-2">
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.enableUserRegistration}
                      onChange={handleGeneralChange}
                      name="enableUserRegistration"
                    />
                  }
                  label="Permitir registro de usuarios"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.maintenanceMode}
                      onChange={handleGeneralChange}
                      name="maintenanceMode"
                    />
                  }
                  label="Modo de mantenimiento"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Panel de Email */}
      {activeTab === 1 && (
        <Card className="mt-4">
          <CardContent className="space-y-4">
            <Typography variant="h6">Configuración de Correo Electrónico</Typography>
            <Divider />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextField
                label="Dominio de email predeterminado"
                name="defaultEmailDomain"
                value={emailSettings.defaultEmailDomain}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Servidor SMTP"
                name="smtpServer"
                value={emailSettings.smtpServer}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Puerto SMTP"
                name="smtpPort"
                type="number"
                value={emailSettings.smtpPort}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <div className="flex items-center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailSettings.smtpUseSSL}
                      onChange={handleEmailChange}
                      name="smtpUseSSL"
                    />
                  }
                  label="Usar SSL"
                />
              </div>
              
              <TextField
                label="Usuario SMTP"
                name="smtpUsername"
                value={emailSettings.smtpUsername}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Contraseña SMTP"
                name="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Emails por hora"
                name="emailsPerHour"
                type="number"
                value={emailSettings.emailsPerHour}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
                helperText="Límite para evitar bloqueos por spam"
              />
              
              <TextField
                label="Tamaño máximo de adjuntos (MB)"
                name="maxAttachmentSize"
                type="number"
                value={emailSettings.maxAttachmentSize}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Firma predeterminada"
                name="defaultSignature"
                value={emailSettings.defaultSignature}
                onChange={handleEmailChange}
                fullWidth
                variant="outlined"
                multiline
                rows={2}
                className="col-span-1 md:col-span-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Panel de Seguridad */}
      {activeTab === 2 && (
        <Card className="mt-4">
          <CardContent className="space-y-4">
            <Typography variant="h6">Configuración de Seguridad</Typography>
            <Divider />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <TextField
                label="Tiempo de sesión (minutos)"
                name="sessionTimeoutMinutes"
                type="number"
                value={securitySettings.sessionTimeoutMinutes}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
                helperText="0 = sin límite"
              />
              
              <TextField
                label="Máximo de intentos de login"
                name="maxLoginAttempts"
                type="number"
                value={securitySettings.maxLoginAttempts}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
                helperText="Bloqueo temporal después de X intentos"
              />
              
              <TextField
                label="Tiempo de validez para reset de contraseña (horas)"
                name="passwordResetTimeHours"
                type="number"
                value={securitySettings.passwordResetTimeHours}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Lista blanca de IPs"
                name="ipWhitelist"
                value={securitySettings.ipWhitelist}
                onChange={handleSecurityChange}
                fullWidth
                variant="outlined"
                helperText="Separadas por comas, vacío = permitir todas"
              />
              
              <div className="col-span-1 md:col-span-2 flex flex-col space-y-2">
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.requireStrongPasswords}
                      onChange={handleSecurityChange}
                      name="requireStrongPasswords"
                    />
                  }
                  label="Requerir contraseñas seguras"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuthDefault}
                      onChange={handleSecurityChange}
                      name="twoFactorAuthDefault"
                    />
                  }
                  label="Autenticación de dos factores por defecto"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end mt-6 space-x-4">
        <Button 
          variant="outlined" 
          color="secondary"
          startIcon={<RefreshIcon />}
        >
          Restaurar Valores
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}

export default SystemSettings;
