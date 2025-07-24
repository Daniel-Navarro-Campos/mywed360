import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from 'recharts';
import { performanceMonitor } from '../../services/PerformanceMonitor';

/**
 * Dashboard para visualizar métricas de rendimiento del sistema
 * Especialmente enfocado en el sistema de correo electrónico personalizado
 * 
 * @component
 * @example
 * ```jsx
 * <MetricsDashboard />
 * ```
 */
function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('day'); // day, week, month
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Colores para gráficos
  const colors = {
    email: '#8884d8',
    search: '#82ca9d',
    notification: '#ffc658',
    eventDetection: '#ff8042',
    error: '#ff0000'
  };

  // Cargar datos de métricas al montar el componente
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Intentar obtener métricas de localStorage (modo desarrollo)
        let localMetrics = null;
        try {
          const storedMetrics = localStorage.getItem('lovenda_last_metrics');
          if (storedMetrics) {
            localMetrics = JSON.parse(storedMetrics);
          }
        } catch (e) {
          console.log('No se encontraron métricas locales');
        }
        
        // Si hay un endpoint de métricas configurado, obtener de allí
        let remoteMetrics = null;
        const metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT;
        
        if (metricsEndpoint) {
          const response = await fetch(`${metricsEndpoint}/dashboard?timeframe=${selectedTimeframe}`);
          if (response.ok) {
            remoteMetrics = await response.json();
          } else {
            throw new Error(`Error al obtener métricas: ${response.statusText}`);
          }
        }
        
        // Usar métricas remotas si están disponibles, sino las locales
        setMetrics(remoteMetrics || localMetrics || generateMockMetrics());
      } catch (err) {
        console.error('Error al cargar métricas:', err);
        setError('No se pudieron cargar las métricas. Usando datos de ejemplo.');
        setMetrics(generateMockMetrics());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMetrics();
    
    // Programar actualización de métricas cada minuto
    const intervalId = setInterval(fetchMetrics, 60000);
    return () => clearInterval(intervalId);
  }, [selectedTimeframe]);
  
  // Generar datos de ejemplo para desarrollo y demostración
  const generateMockMetrics = () => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Generar datos para los últimos 7 días
    const timeSeriesData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(now - (6 - i) * dayInMs);
      return {
        date: date.toISOString().split('T')[0],
        emailSent: Math.floor(Math.random() * 25) + 5,
        emailReceived: Math.floor(Math.random() * 30) + 10,
        searchCount: Math.floor(Math.random() * 40) + 20,
        notificationsRendered: Math.floor(Math.random() * 100) + 50,
        eventsDetected: Math.floor(Math.random() * 8) + 1,
      };
    });
    
    // Datos de rendimiento
    const performanceData = {
      emailProcessing: Math.floor(Math.random() * 500) + 100,
      searchPerformance: Math.floor(Math.random() * 300) + 50,
      notificationsRendering: Math.floor(Math.random() * 100) + 20,
      eventDetection: Math.floor(Math.random() * 800) + 200,
    };
    
    // Datos de errores
    const errorData = [
      { name: 'Email', value: Math.floor(Math.random() * 5) },
      { name: 'Búsqueda', value: Math.floor(Math.random() * 3) },
      { name: 'Notificaciones', value: Math.floor(Math.random() * 2) },
      { name: 'Detección de eventos', value: Math.floor(Math.random() * 1) },
    ];
    
    // Datos de uso
    const usageData = [
      { name: 'Email enviados', value: Math.floor(Math.random() * 100) + 50 },
      { name: 'Email recibidos', value: Math.floor(Math.random() * 150) + 70 },
      { name: 'Búsquedas', value: Math.floor(Math.random() * 80) + 30 },
      { name: 'Eventos detectados', value: Math.floor(Math.random() * 30) + 10 },
    ];
    
    return {
      timeSeriesData,
      performanceData,
      errorData,
      usageData,
      timestamp: now,
    };
  };
  
  // Procesar los datos de rendimiento para el gráfico de barras
  const processedPerformanceData = useMemo(() => {
    if (!metrics || !metrics.performanceData) return [];
    
    return Object.entries(metrics.performanceData).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: value,
    }));
  }, [metrics]);
  
  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Panel de Métricas</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedTimeframe('day')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'day' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setSelectedTimeframe('week')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setSelectedTimeframe('month')}
            className={`px-4 py-2 text-sm rounded-md ${
              selectedTimeframe === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de actividad de email */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Actividad de Email</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics?.timeSeriesData || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="emailSent" name="Enviados" stroke={colors.email} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="emailReceived" name="Recibidos" stroke={colors.notification} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico de rendimiento */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Tiempo de Respuesta (ms)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedPerformanceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Tiempo (ms)">
                  {processedPerformanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name.includes('Email') ? colors.email :
                        entry.name.includes('Search') ? colors.search :
                        entry.name.includes('Notification') ? colors.notification :
                        colors.eventDetection
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Errores */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Errores por Componente</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.errorData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {metrics?.errorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.error} opacity={(index + 5) / 10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Uso del sistema */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Uso del Sistema</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.usageData || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad">
                  {metrics?.usageData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name.includes('Email enviados') ? colors.email :
                        entry.name.includes('Email recibidos') ? colors.notification :
                        entry.name.includes('Búsquedas') ? colors.search :
                        colors.eventDetection
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Estadísticas de Uso del Sistema de Emails</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjetas de estadísticas */}
          <StatCard 
            title="Emails enviados hoy" 
            value={metrics?.timeSeriesData?.[metrics.timeSeriesData.length-1]?.emailSent || 0} 
            trend={10} 
            icon="📤" 
          />
          <StatCard 
            title="Emails recibidos hoy" 
            value={metrics?.timeSeriesData?.[metrics.timeSeriesData.length-1]?.emailReceived || 0} 
            trend={15} 
            icon="📥" 
          />
          <StatCard 
            title="Búsquedas realizadas" 
            value={metrics?.timeSeriesData?.[metrics.timeSeriesData.length-1]?.searchCount || 0} 
            trend={-5} 
            icon="🔍" 
          />
          <StatCard 
            title="Eventos detectados" 
            value={metrics?.timeSeriesData?.[metrics.timeSeriesData.length-1]?.eventsDetected || 0} 
            trend={20} 
            icon="📅" 
          />
        </div>
      </div>
      
      {/* Última actualización */}
      <div className="mt-6 text-right text-sm text-gray-500">
        Última actualización: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
}

/**
 * Tarjeta para mostrar estadísticas individuales
 */
function StatCard({ title, value, trend, icon }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-2xl">{icon}</span>
        <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      <h4 className="mt-2 text-gray-500 text-sm">{title}</h4>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

export default MetricsDashboard;
