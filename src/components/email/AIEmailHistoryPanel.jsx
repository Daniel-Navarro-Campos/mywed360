import React, { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab, CircularProgress, Paper, Divider, 
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
         Chip, Card, CardContent, Grid, LinearProgress } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
         LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import AIEmailTrackingService from '../../services/AIEmailTrackingService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar componentes de Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

/**
 * Componente que muestra estadísticas y el historial de correos originados desde búsquedas AI
 */
const AIEmailHistoryPanel = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  
  const trackingService = new AIEmailTrackingService();
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Cargar actividades
      const activitiesData = trackingService.getActivities();
      setActivities(activitiesData);
      
      // Cargar métricas
      const metricsData = trackingService.getMetrics();
      setMetrics(metricsData);
      
      // Cargar datos de comparación
      const comparisonData = trackingService.getComparisonData();
      setComparisonData(comparisonData);
      
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Datos para el gráfico de tasa de respuesta
  const responseRateChartData = {
    labels: ['Correos AI', 'Correos Tradicionales'],
    datasets: [
      {
        label: 'Tasa de Respuesta (%)',
        data: comparisonData ? [
          parseFloat(comparisonData.ai.responseRate),
          parseFloat(comparisonData.nonAi.responseRate)
        ] : [0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Datos para el gráfico de tasa de respuesta por categoría
  const categoryChartData = {
    labels: comparisonData?.categoryBreakdown?.map(cat => cat.category) || [],
    datasets: [
      {
        label: 'Tasa de Respuesta por Categoría (%)',
        data: comparisonData?.categoryBreakdown?.map(cat => parseFloat(cat.responseRate)) || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Opciones para los gráficos de barras
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Historial de Correos desde Búsqueda AI
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Resumen" />
          <Tab label="Comparativa AI vs Tradicional" />
          <Tab label="Historial de Actividad" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tab 1: Resumen */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Correos Enviados
                      </Typography>
                      <Typography variant="h4">
                        {metrics?.totalEmails || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tasa de Respuesta
                      </Typography>
                      <Typography variant="h4">
                        {metrics ? `${metrics.responseRate.toFixed(2)}%` : '0%'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tiempo Promedio de Respuesta
                      </Typography>
                      <Typography variant="h4">
                        {metrics ? `${metrics.averageResponseTime.toFixed(1)}h` : '0h'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Distribución de Respuestas
                      </Typography>
                      <Box height={250}>
                        <Pie 
                          data={{
                            labels: ['Respondidos', 'Sin Respuesta'],
                            datasets: [
                              {
                                data: [
                                  metrics?.totalResponses || 0,
                                  (metrics?.totalEmails || 0) - (metrics?.totalResponses || 0)
                                ],
                                backgroundColor: [
                                  'rgba(75, 192, 192, 0.6)',
                                  'rgba(255, 99, 132, 0.6)',
                                ],
                                borderColor: [
                                  'rgba(75, 192, 192, 1)',
                                  'rgba(255, 99, 132, 1)',
                                ],
                                borderWidth: 1,
                              },
                            ],
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Tasas de Respuesta por Categoría
                      </Typography>
                      <Box height={250}>
                        <Bar 
                          data={categoryChartData} 
                          options={barOptions} 
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Tab 2: Comparativa */}
          {activeTab === 1 && comparisonData && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Comparación de Efectividad: Correos AI vs Tradicionales
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Métrica</TableCell>
                              <TableCell align="center">Correos AI</TableCell>
                              <TableCell align="center">Correos Tradicionales</TableCell>
                              <TableCell align="center">Diferencia</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Total Enviados</TableCell>
                              <TableCell align="center">{comparisonData.ai.total}</TableCell>
                              <TableCell align="center">{comparisonData.nonAi.total}</TableCell>
                              <TableCell align="center">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Total Respondidos</TableCell>
                              <TableCell align="center">{comparisonData.ai.responded}</TableCell>
                              <TableCell align="center">{comparisonData.nonAi.responded}</TableCell>
                              <TableCell align="center">-</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Tasa de Respuesta</TableCell>
                              <TableCell align="center">{comparisonData.ai.responseRate}%</TableCell>
                              <TableCell align="center">{comparisonData.nonAi.responseRate}%</TableCell>
                              <TableCell 
                                align="center"
                                sx={{
                                  color: parseFloat(comparisonData.difference.responseRate) > 0 ? 'success.main' : 'error.main',
                                  fontWeight: 'bold'
                                }}
                              >
                                {comparisonData.difference.responseRate > 0 ? '+' : ''}{comparisonData.difference.responseRate}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Tiempo Promedio de Respuesta</TableCell>
                              <TableCell align="center">{comparisonData.ai.avgResponseTime}h</TableCell>
                              <TableCell align="center">{comparisonData.nonAi.avgResponseTime}h</TableCell>
                              <TableCell 
                                align="center"
                                sx={{
                                  color: parseFloat(comparisonData.difference.avgResponseTime) > 0 ? 'success.main' : 'error.main',
                                  fontWeight: 'bold'
                                }}
                              >
                                {comparisonData.difference.avgResponseTime > 0 ? '+' : ''}{comparisonData.difference.avgResponseTime}h
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Comparación de Tasas de Respuesta
                      </Typography>
                      <Box height={250}>
                        <Bar 
                          data={responseRateChartData}
                          options={barOptions}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Eficacia por Categoría de Proveedor
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Categoría</TableCell>
                              <TableCell align="center">Total</TableCell>
                              <TableCell align="center">Tasa Respuesta</TableCell>
                              <TableCell align="center">Tiempo Promedio</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {comparisonData.categoryBreakdown.map((cat, index) => (
                              <TableRow key={index}>
                                <TableCell>{cat.category}</TableCell>
                                <TableCell align="center">{cat.total}</TableCell>
                                <TableCell align="center">{cat.responseRate}%</TableCell>
                                <TableCell align="center">{cat.avgResponseTime}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* Tab 3: Historial de Actividad */}
          {activeTab === 2 && (
            <Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Consulta Original</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Tiempo de Respuesta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            {format(new Date(activity.timestamp), 'dd MMM yyyy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>{activity.providerName || 'N/A'}</TableCell>
                          <TableCell>{activity.templateCategory || 'general'}</TableCell>
                          <TableCell>
                            {activity.searchQuery?.length > 30
                              ? `${activity.searchQuery.substring(0, 30)}...`
                              : activity.searchQuery}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.responseReceived ? 'Respondido' : 'Pendiente'} 
                              color={activity.responseReceived ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {activity.responseTime 
                              ? `${activity.responseTime.toFixed(1)}h` 
                              : 'Pendiente'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body1">
                            No hay actividades registradas
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default AIEmailHistoryPanel;
