/**
 * Panel de visualización de métricas del sistema de emails
 * 
 * Este componente muestra estadísticas y métricas de rendimiento
 * recopiladas por el sistema de monitoreo para el módulo de emails y plantillas.
 * 
 * @module components/metrics/MetricsDashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, Filter, ChevronDown, Download } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

/**
 * Componente para visualizar métricas del sistema de emails y plantillas
 * @returns {React.ReactElement} Dashboard de métricas
 */
const MetricsDashboard = () => {
  // Estados para almacenar las métricas
  const [metrics, setMetrics] = useState({
    counters: {},
    timings: {},
    events: [],
    errors: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d, all
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Detectar dispositivos móviles
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Cargar métricas desde el servicio de monitoreo
  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    
    try {
      // En producción, estas métricas vendrían de una API
      // Por ahora usamos las métricas almacenadas en localStorage por el monitor
      let rawMetrics;
      try {
        rawMetrics = JSON.parse(localStorage.getItem('lovenda_last_metrics') || '{}');
      } catch (e) {
        rawMetrics = {
          counters: {},
          timings: {},
          events: [],
          errors: []
        };
      }
      
      // También añadimos las métricas actuales del monitor
      const currentMetrics = {
        counters: { ...performanceMonitor.metrics.counters },
        timings: { ...performanceMonitor.metrics.timings },
        events: [...performanceMonitor.metrics.events],
        errors: [...performanceMonitor.metrics.errors]
      };
      
      // Combinamos ambas fuentes
      const combinedMetrics = {
        counters: { ...rawMetrics.counters, ...currentMetrics.counters },
        timings: { ...rawMetrics.timings, ...currentMetrics.timings },
        events: [...(rawMetrics.events || []), ...currentMetrics.events],
        errors: [...(rawMetrics.errors || []), ...currentMetrics.errors]
      };
      
      // Filtrar por rango de tiempo si es necesario
      if (timeRange !== 'all') {
        const now = Date.now();
        let timeLimit;
        
        switch (timeRange) {
          case '24h':
            timeLimit = now - (24 * 60 * 60 * 1000);
            break;
          case '7d':
            timeLimit = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            timeLimit = now - (30 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeLimit = 0;
        }
        
        combinedMetrics.events = combinedMetrics.events.filter(
          event => event.timestamp >= timeLimit
        );
        combinedMetrics.errors = combinedMetrics.errors.filter(
          error => error.timestamp >= timeLimit
        );
      }
      
      setMetrics(combinedMetrics);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
      setError('No se pudieron cargar las métricas');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar métricas al iniciar el componente
  useEffect(() => {
    loadMetrics();
  }, [timeRange, filterCategory]);
  
  // Preparar datos para el gráfico de uso de plantillas por categoría
  const templateUsageByCategory = useMemo(() => {
    const categoryCounters = {};
    
    // Contar eventos por categoría
    metrics.events
      .filter(event => event.name === 'template_usage')
      .forEach(event => {
        const category = event.data.category || 'Sin categoría';
        if (!categoryCounters[category]) {
          categoryCounters[category] = 0;
        }
        categoryCounters[category]++;
      });
    
    // Convertir a formato para gráfico
    return Object.entries(categoryCounters).map(([category, count]) => ({
      name: category,
      value: count
    }));
  }, [metrics.events]);
  
  // Preparar datos para el gráfico de tipos de operaciones
  const operationTypes = useMemo(() => {
    const operations = {};
    
    // Buscar operaciones en contadores
    Object.entries(metrics.counters)
      .filter(([key]) => key.startsWith('template_') || key.startsWith('email_operation_'))
      .forEach(([key, value]) => {
        const operation = key.replace('template_', '').replace('email_operation_', '');
        operations[operation] = value;
      });
    
    // Convertir a formato para gráfico
    return Object.entries(operations).map(([name, value]) => ({
      name,
      value
    }));
  }, [metrics.counters]);
  
  // Preparar datos para el gráfico de tiempos de operación
  const operationTimings = useMemo(() => {
    return Object.entries(metrics.timings)
      .filter(([key]) => key.startsWith('email_') || key.startsWith('template_'))
      .map(([key, timing]) => ({
        name: key.replace('email_', '').replace('template_', ''),
        avg: timing.total / timing.count,
        min: timing.min,
        max: timing.max
      }));
  }, [metrics.timings]);
  
  // Preparar lista de errores recientes
  const recentErrors = useMemo(() => {
    return metrics.errors
      .filter(error => error.type.startsWith('email_') || error.type.includes('template'))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [metrics.errors]);
  
  // Descargar métricas en formato CSV
  const downloadMetrics = () => {
    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Encabezados
    csvContent += "Tipo,Métrica,Valor,Timestamp\n";
    
    // Contadores
    Object.entries(metrics.counters).forEach(([key, value]) => {
      csvContent += `Counter,${key},${value},${Date.now()}\n`;
    });
    
    // Tiempos
    Object.entries(metrics.timings).forEach(([key, timing]) => {
      csvContent += `Timing,${key}_avg,${timing.total / timing.count},${Date.now()}\n`;
      csvContent += `Timing,${key}_min,${timing.min},${Date.now()}\n`;
      csvContent += `Timing,${key}_max,${timing.max},${Date.now()}\n`;
    });
    
    // Eventos
    metrics.events.forEach(event => {
      csvContent += `Event,${event.name},1,${event.timestamp}\n`;
    });
    
    // Errores
    metrics.errors.forEach(error => {
      csvContent += `Error,${error.type},"${error.message.replace(/"/g, '""')}",${error.timestamp}\n`;
    });
    
    // Crear enlace para descargar
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lovenda_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Dashboard de Métricas - Sistema de Emails</h2>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowFilters(!showFilters)}
            type="secondary"
            size="sm"
            className="flex items-center gap-1"
          >
            <Filter size={16} />
            <span>Filtros</span>
            <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <Button
            onClick={loadMetrics}
            type="secondary"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </Button>
          
          <Button
            onClick={downloadMetrics}
            type="primary"
            size="sm"
            className="flex items-center gap-1"
          >
            <Download size={16} />
            <span>Exportar</span>
          </Button>
        </div>
      </div>
      
      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div>
              <label className="block text-sm mb-1">Rango de tiempo</label>
              <select 
                className="border rounded px-3 py-1"
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="all">Todo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Categoría</label>
              <select 
                className="border rounded px-3 py-1"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="proveedores">Proveedores</option>
                <option value="invitados">Invitados</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </Card>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700 mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de uso de plantillas por categoría */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Uso de plantillas por categoría</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={templateUsageByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {templateUsageByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} usos`, 'Cantidad']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Gráfico de tipos de operaciones */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Operaciones por tipo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" name="Cantidad" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Gráfico de tiempos de operación */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Tiempos de operación (ms)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={operationTimings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg" name="Promedio" stroke="#8884d8" />
                <Line type="monotone" dataKey="min" name="Mínimo" stroke="#82ca9d" />
                <Line type="monotone" dataKey="max" name="Máximo" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Errores recientes */}
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Errores recientes</h3>
          {recentErrors.length > 0 ? (
            <div className="overflow-auto max-h-64">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Tipo</th>
                    <th className="text-left py-2">Mensaje</th>
                    <th className="text-left py-2">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentErrors.map((error, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 pr-4">{error.type}</td>
                      <td className="py-2 pr-4">{error.message}</td>
                      <td className="py-2">
                        {new Date(error.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No se han registrado errores.</p>
          )}
        </Card>
      </div>
      
      {/* Resumen de contadores */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Resumen de actividad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm text-blue-700">Plantillas usadas</h4>
            <p className="text-2xl font-semibold">{metrics.counters['template_use'] || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h4 className="text-sm text-green-700">Emails enviados</h4>
            <p className="text-2xl font-semibold">{metrics.counters['email_operation_send'] || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="text-sm text-purple-700">Plantillas creadas</h4>
            <p className="text-2xl font-semibold">{metrics.counters['template_create'] || 0}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-md">
            <h4 className="text-sm text-amber-700">Búsquedas realizadas</h4>
            <p className="text-2xl font-semibold">{
              Object.keys(metrics.counters)
                .filter(key => key.includes('search'))
                .reduce((sum, key) => sum + metrics.counters[key], 0)
            }</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MetricsDashboard;
