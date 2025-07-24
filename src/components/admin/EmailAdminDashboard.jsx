import React, { useState, useEffect } from 'react';
import { Card, CardContent, Tabs, Tab, Button, Box, Typography, Menu, MenuItem, Paper, Badge, Divider } from '@mui/material';
// Eliminando importación problemática de @mui/icons-material
// Vamos a usar alternativas simples de texto para los íconos
import { performanceMonitor } from '../../services/PerformanceMonitor';
import MetricsDashboard from './MetricsDashboard';
import { useNavigate } from 'react-router-dom';

/**
 * Panel de administración para el sistema de correo electrónico
 * Proporciona acceso a métricas, configuración y feedback de usuarios
 * 
 * @component
 * @example
 * ```jsx
 * <EmailAdminDashboard />
 * ```
 */
function EmailAdminDashboard() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [isLoading, setIsLoading] = useState(true);
  const [emailStats, setEmailStats] = useState({
    totalAccounts: 0,
    activeToday: 0,
    totalSent: 0,
    totalReceived: 0,
    averageResponseTime: 0,
    topSenders: [],
    topDomains: []
  });
  const [feedbackStats, setFeedbackStats] = useState({
    averageRating: 0,
    totalFeedback: 0,
    recentFeedback: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Simular carga de datos de estadísticas
    const loadStats = async () => {
      setIsLoading(true);
      
      try {
        // En producción, estos datos vendrían de una API
        // Por ahora generamos datos de ejemplo
        
        // Estadísticas de correos
        setEmailStats({
          totalAccounts: 120,
          activeToday: 45,
          totalSent: 876,
          totalReceived: 1243,
          averageResponseTime: 43, // minutos
          topSenders: [
            { email: 'maria@lovenda.com', count: 56 },
            { email: 'juan@lovenda.com', count: 42 },
            { email: 'ana@lovenda.com', count: 38 }
          ],
          topDomains: [
            { domain: 'gmail.com', count: 356 },
            { domain: 'hotmail.com', count: 189 },
            { domain: 'outlook.com', count: 132 }
          ]
        });
        
        // Estadísticas de feedback
        setFeedbackStats({
          averageRating: 4.2,
          totalFeedback: 38,
          recentFeedback: [
            { id: 1, rating: 5, comment: "Me encanta la detección automática de eventos", date: "2025-07-12" },
            { id: 2, rating: 4, comment: "Muy útil, aunque a veces es lento", date: "2025-07-10" },
            { id: 3, rating: 3, comment: "Necesita mejores plantillas", date: "2025-07-09" }
          ]
        });
        
        // Registrar visita al panel en el monitor de rendimiento
        performanceMonitor.logEvent('admin_dashboard_view', {
          tab: activeTab
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, [activeTab]);
  
  // Manejador para cambiar de pestaña
  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
    performanceMonitor.logEvent('admin_tab_change', { tab: newTab });
  };
  
  // Manejador para exportar informes
  const handleExportReport = (format) => {
    performanceMonitor.logEvent('export_report', { format, tab: activeTab });
    
    // Simulamos la exportación
    alert(`Informe exportado en formato ${format}`);
  };

  // Estado para el menú desplegable de exportación
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const openExportMenu = Boolean(exportAnchorEl);
  
  // Abrir menú de exportación
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  
  // Cerrar menú de exportación
  const handleExportClose = () => {
    setExportAnchorEl(null);
  };
  
  // Manejador para ir a la configuración de emails
  const handleGoToEmailSettings = () => {
    navigate('/settings/email');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Panel de Administración de Email</Typography>
        <Button 
          variant="contained"
          onClick={() => navigate('/admin/metrics')}
          // Eliminado el icono problemático
          
        >
          Ver Dashboard Completo
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5">Estadísticas</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <div>
            <Button 
              variant="outlined" 
              onClick={handleExportClick}
              // Eliminado el icono problemático
              
            >
              Exportar Informe
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={openExportMenu}
              onClose={handleExportClose}
            >
              <MenuItem onClick={() => { handleExportReport('pdf'); handleExportClose(); }}>
                PDF
              </MenuItem>
              <MenuItem onClick={() => { handleExportReport('csv'); handleExportClose(); }}>
                CSV
              </MenuItem>
              <MenuItem onClick={() => { handleExportReport('excel'); handleExportClose(); }}>
                Excel
              </MenuItem>
            </Menu>
          </div>
          
          <Button 
            variant="contained"
            onClick={handleGoToEmailSettings}
            // Eliminado el icono problemático
            
          >
            Configuración de Email
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Card sx={{ flex: '1 1 22%', minWidth: '160px', height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" color="primary">{emailStats.totalAccounts}</Typography>
            <Typography variant="body2" color="text.secondary">Cuentas de Email</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 22%', minWidth: '160px', height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" color="success.main">{emailStats.activeToday}</Typography>
            <Typography variant="body2" color="text.secondary">Usuarios Activos Hoy</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 22%', minWidth: '160px', height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" color="info.main">{emailStats.totalSent}</Typography>
            <Typography variant="body2" color="text.secondary">Emails Enviados</Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: '1 1 22%', minWidth: '160px', height: '100%' }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" color="warning.main">{emailStats.totalReceived}</Typography>
            <Typography variant="body2" color="text.secondary">Emails Recibidos</Typography>
          </CardContent>
        </Card>
      </Box>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 4 }}
      >
        <Tab value="metrics" label="Métricas" />
        <Tab value="feedback" label="Feedback de Usuarios" />
        <Tab value="accounts" label="Cuentas de Email" />
      </Tabs>

      {activeTab === 'metrics' && (
        <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
          <MetricsDashboard />
        </Paper>
      )}
      
      {activeTab === 'feedback' && (
        <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
              <div className="mb-4">
                <h3 className="h5 mb-3">Resumen de Feedback</h3>
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    <span className="h3 mb-0">{feedbackStats.averageRating.toFixed(1)}</span>
                    <div className="text-muted">Valoración media</div>
                  </div>
                  <div className="ms-4">
                    <div className="ratings">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={`h4 ${star <= Math.round(feedbackStats.averageRating) ? 'text-warning' : 'text-muted'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-muted">
                      Basado en {feedbackStats.totalFeedback} valoraciones
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="h5 mb-3">Comentarios Recientes</h3>
                {feedbackStats.recentFeedback.length === 0 ? (
                  <p className="text-muted">No hay comentarios recientes.</p>
                ) : (
                  <div className="list-group">
                    {feedbackStats.recentFeedback.map((item) => (
                      <div key={item.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <div>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={`small ${i < item.rating ? 'text-warning' : 'text-muted'}`}>
                                ★
                              </span>
                            ))}
                          </div>
                          <small className="text-muted">{item.date}</small>
                        </div>
                        <p className="mb-0">{item.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
        </Paper>
      )}
      
      {activeTab === 'accounts' && (
        <Paper elevation={1} sx={{ p: 4, mb: 4 }}>
              <h3 className="h5 mb-3">Gestión de Cuentas</h3>
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Usuario</th>
                      <th>Creado</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>juan@lovenda.com</td>
                      <td>Juan Pérez</td>
                      <td>10/06/2025</td>
                      <td>
                        <span className="badge bg-success">Activo</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>maria@lovenda.com</td>
                      <td>María García</td>
                      <td>15/06/2025</td>
                      <td>
                        <span className="badge bg-success">Activo</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>carlos@lovenda.com</td>
                      <td>Carlos López</td>
                      <td>20/06/2025</td>
                      <td>
                        <span className="badge bg-warning text-dark">Suspendido</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="d-flex justify-content-between mt-3">
                <button className="btn btn-outline-primary">
                  <i className="bi bi-plus"></i> Crear Cuenta
                </button>
                
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className="page-item disabled">
                      <a className="page-link" href="#" tabIndex="-1">Anterior</a>
                    </li>
                    <li className="page-item active">
                      <a className="page-link" href="#">1</a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">2</a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">3</a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">Siguiente</a>
                    </li>
                  </ul>
                </nav>
              </div>
        </Paper>
      )}
    </Box>
  );
}

export default EmailAdminDashboard;
