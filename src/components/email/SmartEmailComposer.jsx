import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Send from '@mui/icons-material/Send';
import Lightbulb from '@mui/icons-material/Lightbulb';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import Schedule from '@mui/icons-material/Schedule';
import AccessTime from '@mui/icons-material/AccessTime';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import EmailRecommendationService from '../../services/EmailRecommendationService';
import EmailRecommendationsPanel from './EmailRecommendationsPanel';
import { safeRender, ensureNotPromise, safeMap } from '../../utils/promiseSafeRenderer';

/**
 * Componente para componer correos con recomendaciones inteligentes integradas
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.provider - Proveedor al que se enviará el correo (opcional)
 * @param {string} props.searchQuery - Consulta de búsqueda original (opcional)
 * @param {Function} props.onSend - Función llamada al enviar el correo
 * @param {Function} props.onCancel - Función llamada al cancelar
 * @param {Array} props.templates - Lista de plantillas disponibles (opcional)
 */
const SmartEmailComposer = ({ 
  provider, 
  searchQuery, 
  onSend, 
  onCancel,
  templates = []
}) => {
  // Estado del formulario
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Estado de las recomendaciones
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [category, setCategory] = useState(provider?.service || null);
  
  // Para seguimiento de recomendaciones aplicadas
  const [appliedRecommendations, setAppliedRecommendations] = useState([]);
  
  // Servicio de recomendaciones
  const recommendationService = new EmailRecommendationService();
  
  // Cargar plantilla inicial si hay proveedor y categoría
  useEffect(() => {
    if (provider && category && templates.length > 0) {
      const categoryTemplate = templates.find(t => t.category === category);
      if (categoryTemplate) {
        setSelectedTemplate(categoryTemplate.id);
        
        // Pre-rellenar el asunto y mensaje con la plantilla
        setSubject(categoryTemplate.subjectTemplate
          .replace('[Proveedor]', provider.name || 'proveedor')
          .replace('[Servicio]', provider.service || 'servicio'));
        
        setMessage(categoryTemplate.messageTemplate
          .replace('[Proveedor]', provider.name || 'proveedor')
          .replace('[Servicio]', provider.service || 'servicio'));
      }
    }
  }, [provider, category, templates]);
  
  // Manejar envío del correo
  const handleSend = () => {
    if (!subject || !message) {
      setFeedback({
        type: 'error',
        message: 'Por favor, completa el asunto y el mensaje antes de enviar.'
      });
      return;
    }
    
    // Preparar datos del correo
    const emailData = {
      to: provider?.email || '',
      subject,
      message,
      scheduledTime: scheduledTime || null,
      provider,
      searchQuery,
      wasCustomized: appliedRecommendations.length > 0,
      appliedRecommendations
    };
    
    // Llamar a la función de envío proporcionada por el padre
    if (onSend) {
      onSend(emailData);
    }
  };
  
  // Manejar aplicación de recomendaciones
  const handleApplyRecommendation = (type, data) => {
    // Registrar la recomendación aplicada
    setAppliedRecommendations([...appliedRecommendations, { type, timestamp: new Date().toISOString() }]);
    
    // Aplicar la recomendación según su tipo
    switch (type) {
      case 'subject':
        // Aplicar el patrón de asunto recomendado
        const newSubject = data
          .replace('[Servicio]', provider?.service || 'servicio')
          .replace('[Fecha]', 'próximamente')
          .replace('[Evento]', 'evento');
        
        setSubject(newSubject);
        setFeedback({
          type: 'success',
          message: 'Línea de asunto actualizada con la recomendación'
        });
        break;
        
      case 'template':
        // Buscar la plantilla recomendada
        const template = templates.find(t => t.category === data || t.id === data);
        if (template) {
          setSelectedTemplate(template.id);
          
          // Actualizar el mensaje con la plantilla
          const templateMessage = template.messageTemplate
            .replace('[Proveedor]', provider?.name || 'proveedor')
            .replace('[Servicio]', provider?.service || 'servicio');
          
          setMessage(templateMessage);
          setFeedback({
            type: 'success',
            message: `Plantilla "${template.name}" aplicada`
          });
        }
        break;
        
      case 'time':
        // Programar el envío para la franja horaria recomendada
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        let hour = 10; // Por defecto a media mañana
        
        // Ajustar hora según la franja recomendada
        if (data.bestTimeSlot === 'morning') hour = 10;
        else if (data.bestTimeSlot === 'afternoon') hour = 14;
        else if (data.bestTimeSlot === 'evening') hour = 18;
        else if (data.bestTimeSlot === 'night') hour = 21;
        
        // Formatear fecha para input datetime-local
        const scheduledDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`;
        
        setScheduledTime(scheduledDate);
        setFeedback({
          type: 'success',
          message: `Correo programado para mañana a las ${hour}:00h (${data.bestTimeSlotName})`
        });
        break;
        
      default:
        console.log('Tipo de recomendación no implementado:', type, data);
    }
  };
  
  // Cambiar plantilla seleccionada
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        // Actualizar el mensaje con la plantilla
        const templateMessage = template.messageTemplate
          .replace('[Proveedor]', provider?.name || 'proveedor')
          .replace('[Servicio]', provider?.service || 'servicio');
        
        setMessage(templateMessage);
      }
    }
  };
  
  // Cerrar alerta de feedback
  const handleCloseFeedback = () => {
    setFeedback(null);
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Redactar Correo
        {provider && (
          <Typography component="span" variant="subtitle1" sx={{ ml: 1 }}>
            a {provider.name}
          </Typography>
        )}
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={showRecommendations ? 7 : 12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Mensaje</Typography>
              <Tooltip title={showRecommendations ? "Ocultar recomendaciones" : "Mostrar recomendaciones"}>
                <IconButton onClick={() => setShowRecommendations(!showRecommendations)}>
                  {showRecommendations ? <Lightbulb color="primary" /> : <LightbulbOutlined />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Grid container spacing={2}>
              {/* Asunto */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Asunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  variant="outlined"
                  placeholder="Escribe un asunto efectivo..."
                />
              </Grid>
              
              {/* Selección de plantilla */}
              {templates.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="template-select-label">Plantilla</InputLabel>
                    <Select
                      labelId="template-select-label"
                      value={selectedTemplate}
                      label="Plantilla"
                      onChange={handleTemplateChange}
                    >
                      <MenuItem value="">
                        <em>Ninguna</em>
                      </MenuItem>
                      {templates.map(template => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {/* Mensaje */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Mensaje"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  variant="outlined"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </Grid>
              
              {/* Programación de envío */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Programar envío:
                  </Typography>
                  <TextField
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ ml: 1 }}
                    size="small"
                  />
                  {scheduledTime && (
                    <Button 
                      size="small"
                      onClick={() => setScheduledTime('')}
                      sx={{ ml: 1 }}
                    >
                      Limpiar
                    </Button>
                  )}
                </Box>
              </Grid>
              
              {/* Botones de acción */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={onCancel}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={scheduledTime ? <Schedule /> : <Send />}
                    onClick={handleSend}
                  >
                    {scheduledTime ? 'Programar' : 'Enviar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Panel de recomendaciones */}
        {showRecommendations && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ height: '100%', overflow: 'auto' }}>
              <EmailRecommendationsPanel 
                category={category}
                searchQuery={searchQuery}
                onApplyRecommendation={handleApplyRecommendation}
              />
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Alertas de feedback */}
      <Snackbar 
        open={!!feedback} 
        autoHideDuration={6000} 
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseFeedback} 
          severity={feedback?.type || 'info'} 
          sx={{ width: '100%' }}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SmartEmailComposer;
