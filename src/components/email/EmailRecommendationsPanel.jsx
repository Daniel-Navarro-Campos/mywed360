import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip,
  Rating,
  Grid
} from '@mui/material';
import Lightbulb from '@mui/icons-material/Lightbulb';
import AccessTime from '@mui/icons-material/AccessTime';
import Subject from '@mui/icons-material/Subject';
import Edit from '@mui/icons-material/Edit';
import Category from '@mui/icons-material/Category';
import TipsAndUpdates from '@mui/icons-material/TipsAndUpdates';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CheckCircle from '@mui/icons-material/CheckCircle';
import VerifiedUser from '@mui/icons-material/VerifiedUser';
import Schedule from '@mui/icons-material/Schedule';
import EmailRecommendationService from '../../services/EmailRecommendationService';

/**
 * Componente que muestra recomendaciones personalizadas para mejorar la efectividad
 * de los correos electrónicos enviados a proveedores
 */
const EmailRecommendationsPanel = ({ category, searchQuery, onApplyRecommendation }) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  
  // Instanciar el servicio de recomendaciones
  const recommendationService = new EmailRecommendationService();
  
  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generar recomendaciones basadas en el contexto proporcionado
        const data = recommendationService.generateRecommendations(category, searchQuery);
        setRecommendations(data);
      } catch (err) {
        console.error('Error generando recomendaciones:', err);
        setError('No se pudieron generar las recomendaciones. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    generateRecommendations();
  }, [category, searchQuery]);
  
  // Función para aplicar una recomendación
  const handleApplyRecommendation = (type, data) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(type, data);
    }
  };
  
  // Renderiza el indicador de confianza
  const renderConfidenceIndicator = () => {
    if (!recommendations) return null;
    
    const score = recommendations.confidenceScore || 0;
    let color = 'error';
    let label = 'Baja';
    
    if (score >= 70) {
      color = 'success';
      label = 'Alta';
    } else if (score >= 40) {
      color = 'warning';
      label = 'Media';
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" mr={1}>
          Confianza en recomendaciones:
        </Typography>
        <Chip 
          size="small"
          label={`${label} (${score}%)`} 
          color={color}
          icon={<VerifiedUser fontSize="small" />}
        />
      </Box>
    );
  };
  
  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Analizando datos y generando recomendaciones...
        </Typography>
      </Box>
    );
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // Si no hay recomendaciones, mostrar mensaje
  if (!recommendations) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No hay suficientes datos para generar recomendaciones personalizadas.
      </Alert>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Recomendaciones Personalizadas
        </Typography>
        <Tooltip title="Las recomendaciones se basan en datos históricos de efectividad">
          <TipsAndUpdates color="primary" />
        </Tooltip>
      </Box>
      
      {renderConfidenceIndicator()}
      
      <Grid container spacing={2}>
        {/* Mejor momento para enviar */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <AccessTime color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Mejor momento para enviar</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                {recommendations.bestTimeToSend.hasSufficientData ? (
                  <>
                    <Typography variant="body1">
                      El mejor momento para enviar correos es por la {' '}
                      <strong>{recommendations.bestTimeToSend.bestTimeSlotName}</strong>
                      {' '} con una tasa de respuesta del {recommendations.bestTimeToSend.bestRate}%
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Schedule />}
                        onClick={() => handleApplyRecommendation('time', recommendations.bestTimeToSend)}
                      >
                        Programar en este horario
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    No hay suficientes datos para determinar el mejor momento. 
                    Por ahora, recomendamos enviar por la mañana (8-12h).
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Línea de asunto */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Subject color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Línea de asunto efectiva</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Patrones recomendados:
              </Typography>
              <List dense disablePadding>
                {recommendations.subjectLineRecommendations.recommendedPatterns.map((pattern, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                      <CheckCircle fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={pattern}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                    <Button
                      size="small"
                      onClick={() => handleApplyRecommendation('subject', pattern)}
                    >
                      Usar
                    </Button>
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                Longitud óptima: entre {recommendations.subjectLineRecommendations.optimalLength.min} y {recommendations.subjectLineRecommendations.optimalLength.max} caracteres
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Personalización */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Edit color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Impacto de personalización</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recommendations.customizationImpact.hasSufficientData ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" mr={1}>
                      Los mensajes personalizados tienen un 
                    </Typography>
                    <Chip 
                      label={`+${recommendations.customizationImpact.impact}%`} 
                      color={parseFloat(recommendations.customizationImpact.impact) > 0 ? "success" : "default"}
                      size="small"
                    />
                    <Typography variant="body1" ml={1}>
                      de tasa de respuesta
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">
                        {recommendations.customizationImpact.customized.rate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Personalizados
                      </Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">
                        {recommendations.customizationImpact.nonCustomized.rate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No personalizados
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  {recommendations.customizationImpact.recommendCustomization 
                    ? 'Recomendamos personalizar tus mensajes para aumentar la tasa de respuesta.' 
                    : 'No hay suficientes datos para medir el impacto de la personalización.'}
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Plantillas */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Category color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Plantilla recomendada</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recommendations.templateRecommendations.hasSufficientData ? (
                <>
                  <Typography variant="body1">
                    La plantilla con mejor rendimiento es{' '}
                    <strong>{recommendations.templateRecommendations.bestOverallTemplate}</strong>
                    {' '}con una tasa de respuesta del {recommendations.templateRecommendations.bestOverallResponseRate}%
                  </Typography>
                  
                  {recommendations.templateRecommendations.categorySpecificTemplate && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Para la categoría <strong>{recommendations.templateRecommendations.categorySpecificTemplate.category}</strong>:
                        Tasa de respuesta del {recommendations.templateRecommendations.categorySpecificTemplate.responseRate}%
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleApplyRecommendation('template', recommendations.templateRecommendations.bestOverallTemplate)}
                    >
                      Aplicar plantilla recomendada
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  No hay suficientes datos para recomendar una plantilla específica.
                  Por ahora, recomendamos usar la plantilla general.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Tiempo de respuesta esperado */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Schedule color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Tiempo de respuesta esperado</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recommendations.responseTimeExpectations.hasSufficientData ? (
                <>
                  <Typography variant="body1">
                    Tiempo promedio de respuesta: <strong>{recommendations.responseTimeExpectations.averageTime} horas</strong>
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tiempo mediano: {recommendations.responseTimeExpectations.medianTime} horas
                  </Typography>
                  
                  <Box sx={{ display: 'flex', mt: 1, justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Respuesta más rápida: {recommendations.responseTimeExpectations.fastestResponse}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Respuesta más lenta: {recommendations.responseTimeExpectations.slowestResponse}h
                    </Typography>
                  </Box>
                  
                  {recommendations.responseTimeExpectations.categoryAverageTime && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Para esta categoría específica: <strong>{recommendations.responseTimeExpectations.categoryAverageTime} horas</strong>
                    </Typography>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  Con base en promedios generales, espera una respuesta en aproximadamente 24-48 horas.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
        
        {/* Recomendaciones específicas de categoría */}
        {recommendations.categorySpecific && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Lightbulb color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  Recomendaciones para {category || 'esta categoría'}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {recommendations.categorySpecific.hasSufficientData ? (
                  <>
                    <Typography variant="body2" gutterBottom>
                      Tasa de respuesta en esta categoría: {recommendations.categorySpecific.responseRate}%
                    </Typography>
                    <List dense>
                      {recommendations.categorySpecific.recommendations.map((rec, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Alert severity="info">
                    No hay suficientes datos para recomendaciones específicas en esta categoría.
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
        
        {/* Recomendaciones basadas en la consulta */}
        {recommendations.querySpecific && recommendations.querySpecific.recommendations.length > 0 && (
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Lightbulb color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  Basado en tu búsqueda
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {recommendations.querySpecific.recommendations.map((rec, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EmailRecommendationsPanel;
