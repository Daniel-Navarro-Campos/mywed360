import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Grid, Card, CardContent, CardHeader, Typography, Box, Chip, Avatar } from '@mui/material';
import { 
  Users, 
  Mail, 
  Calendar, 
  Check, 
  AlertTriangle,
  Bell,
  Activity,
  ShoppingBag
} from 'lucide-react';

/**
 * Panel de administración principal
 * Muestra resumen de métricas y accesos rápidos
 */
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activeUsers: 0,
    pendingProviders: 0,
    emailsSent: 0,
    upcomingEvents: 0,
    completedOrders: 0,
    alerts: 0
  });

  // Simular carga de datos
  useEffect(() => {
    // En una implementación real, estos datos vendrían de una API
    setTimeout(() => {
      setStats({
        activeUsers: 432,
        pendingProviders: 12,
        emailsSent: 2789,
        upcomingEvents: 8,
        completedOrders: 145,
        alerts: 3
      });
    }, 800);
  }, []);

  // Tarjetas de métricas para el dashboard
  const metricsCards = [
    {
      title: 'Usuarios activos',
      value: stats.activeUsers,
      icon: <Users size={24} />,
      color: 'rgb(37, 99, 235)'
    },
    {
      title: 'Proveedores pendientes',
      value: stats.pendingProviders,
      icon: <ShoppingBag size={24} />,
      color: 'rgb(236, 72, 153)'
    },
    {
      title: 'Emails enviados',
      value: stats.emailsSent,
      icon: <Mail size={24} />,
      color: 'rgb(234, 88, 12)'
    },
    {
      title: 'Eventos próximos',
      value: stats.upcomingEvents,
      icon: <Calendar size={24} />,
      color: 'rgb(5, 150, 105)'
    },
    {
      title: 'Pedidos completados',
      value: stats.completedOrders,
      icon: <Check size={24} />,
      color: 'rgb(79, 70, 229)'
    },
    {
      title: 'Alertas del sistema',
      value: stats.alerts,
      icon: <AlertTriangle size={24} />,
      color: 'rgb(239, 68, 68)'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <Typography variant="h4" className="font-medium">
          Panel de Administración
        </Typography>
        <Chip
          avatar={<Avatar alt={currentUser?.displayName || 'Admin'}>{(currentUser?.displayName?.[0] || 'A').toUpperCase()}</Avatar>}
          label={`Hola, ${currentUser?.displayName || 'Admin'}`}
          variant="outlined"
          color="primary"
        />
      </div>

      {/* Métricas principales */}
      <Grid container spacing={3} className="mb-8">
        {metricsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card className="h-full">
              <CardContent>
                <Box className="flex justify-between items-center">
                  <Box>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" className="font-semibold">
                      {card.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: card.color,
                      width: 56,
                      height: 56
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Accesos rápidos */}
      <Typography variant="h5" className="mb-4">
        Accesos Rápidos
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="h-full">
            <CardHeader 
              title="Sistema de Correo"
              subheader="Gestión de correos electrónicos"
              avatar={
                <Avatar sx={{ bgcolor: 'rgb(234, 88, 12)' }}>
                  <Mail size={20} />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Accede al panel de administración de correo para monitorizar el envío, recepción y rendimiento del sistema de email.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card className="h-full">
            <CardHeader 
              title="Actividad del Sistema" 
              subheader="Monitorización en tiempo real"
              avatar={
                <Avatar sx={{ bgcolor: 'rgb(79, 70, 229)' }}>
                  <Activity size={20} />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Visualiza la actividad del sistema en tiempo real, incluyendo sesiones de usuarios, transacciones y eventos del sistema.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AdminDashboard;
