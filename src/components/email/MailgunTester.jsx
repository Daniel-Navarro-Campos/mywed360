import { useState } from 'react';
import { sendEmail, validateEmail, checkUsernameAvailability } from '../../services/mailgunService';
import { 
  Box, Button, TextField, Typography, Paper, Grid, 
  Snackbar, Alert, CircularProgress, Divider
} from '@mui/material';

/**
 * Componente para probar las funcionalidades de Mailgun
 * Permite probar envío de emails, validación y disponibilidad de nombres de usuario
 */
function MailgunTester() {
  // Estado para formulario de envío de email
  const [sending, setSending] = useState(false);
  const [emailForm, setEmailForm] = useState({
    from: `Test <test@mg.mywed360.com>`,
    to: '',
    subject: 'Prueba de Mailgun desde myWed360',
    text: 'Este es un correo de prueba enviado desde la aplicación myWed360.',
  });
  
  // Estado para validación de email
  const [validating, setValidating] = useState(false);
  const [emailToValidate, setEmailToValidate] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  // Estado para verificación de disponibilidad de username
  const [checking, setChecking] = useState(false);
  const [usernameToCheck, setUsernameToCheck] = useState('');
  const [availabilityResult, setAvailabilityResult] = useState(null);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Manejar cambios en el formulario de email
  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailForm(prev => ({ ...prev, [name]: value }));
  };

  // Enviar email de prueba
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      const result = await sendEmail(emailForm);
      setNotification({
        open: true,
        message: `Email enviado correctamente! ID: ${result.messageId}`,
        severity: 'success'
      });
      console.log('Respuesta del servidor:', result);
    } catch (error) {
      setNotification({
        open: true,
        message: `Error al enviar email: ${error.message}`,
        severity: 'error'
      });
      console.error('Error al enviar:', error);
    } finally {
      setSending(false);
    }
  };

  // Validar email
  const handleValidateEmail = async (e) => {
    e.preventDefault();
    setValidating(true);
    
    try {
      const result = await validateEmail(emailToValidate);
      setValidationResult(result);
      setNotification({
        open: true,
        message: result.isValid 
          ? 'El email es válido' 
          : `El email no es válido: ${result.reason || 'formato incorrecto'}`,
        severity: result.isValid ? 'success' : 'warning'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Error al validar: ${error.message}`,
        severity: 'error'
      });
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  // Verificar disponibilidad de nombre de usuario
  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setChecking(true);
    
    try {
      const isAvailable = await checkUsernameAvailability(usernameToCheck);
      setAvailabilityResult(isAvailable);
      setNotification({
        open: true,
        message: isAvailable 
          ? `El nombre de usuario "${usernameToCheck}" está disponible` 
          : `El nombre de usuario "${usernameToCheck}" ya está en uso`,
        severity: isAvailable ? 'success' : 'warning'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: `Error al verificar disponibilidad: ${error.message}`,
        severity: 'error'
      });
      setAvailabilityResult(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Probador de Mailgun myWed360
      </Typography>
      
      <Grid container spacing={4}>
        {/* Sección de envío de correo */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              1. Enviar Email de Prueba
            </Typography>
            <Box component="form" onSubmit={handleSendEmail} sx={{ mt: 2 }}>
              <TextField
                label="Desde"
                name="from"
                value={emailForm.from}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Para"
                name="to"
                value={emailForm.to}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                required
                placeholder="ejemplo@gmail.com"
              />
              <TextField
                label="Asunto"
                name="subject"
                value={emailForm.subject}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Mensaje"
                name="text"
                value={emailForm.text}
                onChange={handleEmailFormChange}
                fullWidth
                margin="normal"
                multiline
                rows={4}
                required
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2 }}
                disabled={sending}
              >
                {sending ? <CircularProgress size={24} /> : 'Enviar Email'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Sección de validación de email */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              2. Validar Email
            </Typography>
            <Box component="form" onSubmit={handleValidateEmail}>
              <TextField
                label="Email para validar"
                value={emailToValidate}
                onChange={(e) => setEmailToValidate(e.target.value)}
                fullWidth
                margin="normal"
                required
                placeholder="ejemplo@gmail.com"
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="secondary" 
                sx={{ mt: 2 }}
                disabled={validating}
              >
                {validating ? <CircularProgress size={24} /> : 'Validar'}
              </Button>
              
              {validationResult && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body1" color={validationResult.isValid ? 'success.main' : 'error.main'}>
                    {validationResult.isValid ? '✅ Email válido' : '❌ Email inválido'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Sección de verificación de disponibilidad */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              3. Verificar Disponibilidad
            </Typography>
            <Box component="form" onSubmit={handleCheckAvailability}>
              <TextField
                label="Nombre de usuario"
                value={usernameToCheck}
                onChange={(e) => setUsernameToCheck(e.target.value)}
                fullWidth
                margin="normal"
                required
                placeholder="nombre"
                helperText="Solo el nombre sin @mywed360.com"
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="secondary" 
                sx={{ mt: 2 }}
                disabled={checking}
              >
                {checking ? <CircularProgress size={24} /> : 'Verificar Disponibilidad'}
              </Button>
              
              {availabilityResult !== null && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body1" color={availabilityResult ? 'success.main' : 'error.main'}>
                    {availabilityResult 
                      ? `✅ "${usernameToCheck}@mywed360.com" está disponible` 
                      : `❌ "${usernameToCheck}@mywed360.com" ya está en uso`}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={() => setNotification({...notification, open: false})}
      >
        <Alert 
          onClose={() => setNotification({...notification, open: false})} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MailgunTester;
