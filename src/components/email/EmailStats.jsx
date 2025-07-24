import React, { useState, useEffect } from 'react';
import { 
  Bar, Line, Pie, Doughnut 
} from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { RefreshCw, Mail, Clock, User, Tag, Folder, Eye, MousePointerClick } from 'lucide-react';
import Button from '../Button';
import Card from '../Card';
import { generateUserStats, getUserStats } from '../../services/statsService';
import { getDailyStats } from '../../services/emailMetricsService';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Componente que muestra estadísticas del correo en un dashboard visual
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.userId - ID del usuario actual
 */
const EmailStats = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

  // Cargar estadísticas al iniciar
  useEffect(() => {
    if (!userId) return;
    loadStats();
  }, [userId]);

  // Función para cargar estadísticas
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar primero desde localStorage para rendimiento
      let userStats = getUserStats(userId);
      
      // Si no hay estadísticas guardadas o están desactualizadas, generarlas
      const now = new Date();
      const lastUpdated = userStats.lastUpdated ? new Date(userStats.lastUpdated) : null;
      const isOutdated = !lastUpdated || 
        (now - lastUpdated) > (1000 * 60 * 60); // Más de 1 hora
      
      if (!userStats || Object.keys(userStats).length === 0 || isOutdated) {
        userStats = await generateUserStats(userId);
      }
      
      setStats(userStats);
      // Cargar métricas diarias para aperturas / clics
      const daily = await getDailyStats(userId, 30);
      setDailyStats(daily);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin mr-2">
          <RefreshCw size={24} />
        </div>
        <span>Cargando estadísticas...</span>
      </div>
    );
  }

  // Si hay error, mostrar mensaje
  if (error || !stats) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error || 'No hay estadísticas disponibles'}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={loadStats}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  // Formateador de fechas para legibilidad
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Datos para gráfico de actividad diaria
  const activityData = {
    labels: stats.activityMetrics.dailyGraph.map(day => formatDate(day.date)),
    datasets: [
      {
        label: 'Recibidos',
        data: stats.activityMetrics.dailyGraph.map(day => day.received),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
      {
        label: 'Enviados',
        data: stats.activityMetrics.dailyGraph.map(day => day.sent),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      }
    ]
  };

    const openClickData = {
    labels: dailyStats.map(day => formatDate(day.date)),
    datasets: [
      {
        label: 'Aperturas',
        data: dailyStats.map(day => day.opens || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
        tension: 0.3,
      },
      {
        label: 'Clics',
        data: dailyStats.map(day => day.clicks || 0),
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        borderColor: 'rgb(255, 206, 86)',
        borderWidth: 1,
        tension: 0.3,
      }
    ]
  };

  // Datos para gráfico circular de etiquetas
  const tagData = {
    labels: stats.tagDistribution.slice(0, 7).map(tag => tag.name),
    datasets: [{
      label: 'Correos',
      data: stats.tagDistribution.slice(0, 7).map(tag => tag.count),
      backgroundColor: stats.tagDistribution.slice(0, 7).map(tag => tag.color),
      borderColor: '#ffffff',
      borderWidth: 1,
    }],
  };

  // Datos para gráfico circular de carpetas
  const folderData = {
    labels: [
      'Bandeja de entrada', 
      'Enviados', 
      'Papelera', 
      ...stats.folderDistribution.custom.map(folder => folder.name)
    ],
    datasets: [{
      label: 'Correos',
      data: [
        stats.folderDistribution.system.inbox,
        stats.folderDistribution.system.sent,
        stats.folderDistribution.system.trash,
        ...stats.folderDistribution.custom.map(folder => folder.count)
      ],
      backgroundColor: [
        '#4CAF50', // Verde para inbox
        '#2196F3', // Azul para enviados
        '#F44336', // Rojo para papelera
        // Colores para carpetas personalizadas
        ...Array(stats.folderDistribution.custom.length)
          .fill()
          .map((_, i) => `hsl(${(i * 55) % 360}, 70%, 60%)`)
      ],
      borderColor: '#ffffff',
      borderWidth: 1,
    }],
  };
  
  // Opciones para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="email-stats">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Estadísticas de correo</h2>
        <Button 
          variant="outline" 
          onClick={loadStats}
          className="flex items-center"
        >
          <RefreshCw size={16} className="mr-1" />
          Actualizar
        </Button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <StatCard 
          title="Correos" 
          value={stats.emailCounts.total}
          subtitle={`${stats.emailCounts.unread} sin leer`}
          icon={<Mail />}
          color="bg-blue-50 text-blue-600"
        />
        
        <StatCard 
          title="Contactos" 
          value={stats.contactAnalysis.totalContacts}
          subtitle="Proveedores únicos"
          icon={<User />}
          color="bg-green-50 text-green-600"
        />
        
        <StatCard 
          title="Tasa de respuesta" 
          value={`${Math.round(stats.responseMetrics.responseRate * 100)}%`}
          subtitle={stats.responseMetrics.formattedAvgResponseTime ? 
            `Tiempo medio: ${stats.responseMetrics.formattedAvgResponseTime}` : 
            'Sin datos de respuesta'}
          icon={<Clock />}
          color="bg-purple-50 text-purple-600"
        />
        
        <StatCard 
          title="Actividad" 
          value={stats.activityMetrics.today}
          subtitle={`${stats.activityMetrics.thisWeek} esta semana`}
          icon={<Mail />}
          color="bg-amber-50 text-amber-600"
        />
        {stats.opens !== undefined && (
          <StatCard
            title="Aperturas"
            value={stats.opens}
            subtitle="Total"
            icon={<Eye />}
            color="bg-cyan-50 text-cyan-600"
          />
        )}
        {stats.clicks !== undefined && (
          <StatCard
            title="Clics"
            value={stats.clicks}
            subtitle="Total"
            icon={<MousePointerClick />}
            color="bg-yellow-50 text-yellow-600"
          />
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Actividad diaria */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Actividad diaria</h3>
          <div className="h-64">
            <Bar 
              data={activityData} 
              options={chartOptions}
            />
          </div>
        </Card>

        {/* Contactos frecuentes */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Contactos frecuentes</h3>
          <div className="space-y-3">
            {stats.contactAnalysis.topContacts.map((contact, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-sm text-gray-500">
                      {contact.total} correos
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-2">{contact.received} recibidos</span>
                    <span>{contact.sent} enviados</span>
                  </div>
                </div>
              </div>
            ))}
            
            {stats.contactAnalysis.topContacts.length === 0 && (
              <p className="text-center text-gray-500">
                No hay datos de contactos disponibles
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aperturas y clics */}
      <Card className="p-4 mb-6">
        <h3 className="text-lg font-medium mb-4">Aperturas y clics</h3>
        <div className="h-64">
          {dailyStats.length > 0 ? (
            <Line data={openClickData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No hay datos de aperturas o clics
            </div>
          )}
        </div>
      </Card>

      {/* Distribución por etiquetas */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Tag size={18} className="mr-2" />
            <h3 className="text-lg font-medium">Distribución por etiquetas</h3>
          </div>
          
          <div className="h-64">
            {stats.tagDistribution.length > 0 ? (
              <Doughnut 
                data={tagData} 
                options={chartOptions}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No hay etiquetas con correos asignados
              </div>
            )}
          </div>
        </Card>

        {/* Distribución por carpetas */}
        <Card className="p-4">
          <div className="flex items-center mb-4">
            <Folder size={18} className="mr-2" />
            <h3 className="text-lg font-medium">Distribución por carpetas</h3>
          </div>
          
          <div className="h-64">
            <Pie 
              data={folderData}
              options={chartOptions}
            />
          </div>
        </Card>
      </div>

      {/* Fecha de actualización */}
      <div className="text-xs text-gray-500 text-right mt-4">
        Última actualización: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

// Componente de tarjeta de estadística
const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card className="p-4">
    <div className="flex items-start">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  </Card>
);

export default EmailStats;
