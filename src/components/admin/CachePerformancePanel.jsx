import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from '../ui';
import { Zap, BarChart2, RefreshCw, Save, Trash2, Clock } from 'lucide-react';
import { runCacheBenchmark, generateCacheReport, testCategoryPreloading } from '../../utils/CacheDiagnostics';
import { templateCache } from '../../services/TemplateCacheService';
import { useEmailMonitoring } from '../../hooks/useEmailMonitoring';

/**
 * Panel para visualizar y analizar el rendimiento de la caché de plantillas
 * Disponible solo para administradores del sistema
 */
const CachePerformancePanel = () => {
  // Estados
  const [cacheReport, setCacheReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [preloadResults, setPreloadResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Hooks
  const { measureCachePerformance } = useEmailMonitoring();
  
  // Cargar informe inicial y categorías
  useEffect(() => {
    loadCacheReport();
    
    // Obtener categorías disponibles
    const cacheStats = templateCache.getCacheStats();
    if (cacheStats.categoryHits) {
      const categoryList = Object.keys(cacheStats.categoryHits);
      setCategories(categoryList.length ? categoryList : ['Sin categoría']);
      setSelectedCategory(categoryList[0] || 'Sin categoría');
    }
  }, []);
  
  // Cargar informe actual de caché
  const loadCacheReport = useCallback(() => {
    setLoading(true);
    try {
      const report = generateCacheReport();
      setCacheReport(report);
      // Registrar en monitoreo
      measureCachePerformance('report_generated', 0, { 
        hitRatio: report.stats.hitRatio,
        entries: report.memory.entryCount
      });
    } catch (error) {
      console.error('Error generando informe de caché:', error);
    } finally {
      setLoading(false);
    }
  }, [measureCachePerformance]);
  
  // Iniciar prueba de rendimiento
  const handleRunBenchmark = useCallback(async () => {
    setBenchmarkLoading(true);
    try {
      // Ejecutar benchmark y guardar resultados
      const results = await runCacheBenchmark([], 3); // 3 iteraciones por defecto
      setBenchmarkResults(results);
      
      // Registrar métricas
      measureCachePerformance('benchmark', 0, {
        improvementPercent: results.improvement.percent,
        timesSaved: results.improvement.timesSaved
      });
    } catch (error) {
      console.error('Error ejecutando benchmark:', error);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [measureCachePerformance]);
  
  // Probar precarga de categoría
  const handleTestPreloading = useCallback(async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const results = await testCategoryPreloading(selectedCategory);
      setPreloadResults(results);
      
      // Registrar métricas
      measureCachePerformance('preload_test', 0, {
        category: selectedCategory,
        templatesLoaded: results.templatesLoaded
      });
    } catch (error) {
      console.error(`Error probando precarga de categoría ${selectedCategory}:`, error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, measureCachePerformance]);
  
  // Limpiar toda la caché
  const handleClearCache = useCallback(() => {
    if (window.confirm('¿Estás seguro de que deseas limpiar toda la caché?')) {
      templateCache.clearAll();
      loadCacheReport();
      
      // Registrar evento
      measureCachePerformance('clear_all', 0);
    }
  }, [loadCacheReport, measureCachePerformance]);
  
  // Formatear un número con dos decimales
  const formatNumber = (num) => Number(num).toFixed(2);
  
  // Renderizar gráfico básico de barras para efectividad
  const renderEffectivenessBar = () => {
    if (!cacheReport) return null;
    
    const hitRatio = parseFloat(cacheReport.stats.hitRatio);
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Efectividad de caché</span>
          <span className="font-medium">{hitRatio}%</span>
        </div>
        <Progress value={hitRatio} className="h-2" />
      </div>
    );
  };
  
  // Renderizar resultados de benchmark
  const renderBenchmarkResults = () => {
    if (!benchmarkResults) return null;
    
    const { withCache, withoutCache, improvement } = benchmarkResults;
    
    return (
      <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium">Resultados del benchmark</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600">Con caché</h4>
            <p className="text-sm">Tiempo total: <span className="font-medium">{formatNumber(withCache.totalTime)} ms</span></p>
            <p className="text-sm">Tiempo promedio: <span className="font-medium">{formatNumber(withCache.avgTime)} ms</span></p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-600">Sin caché</h4>
            <p className="text-sm">Tiempo total: <span className="font-medium">{formatNumber(withoutCache.totalTime)} ms</span></p>
            <p className="text-sm">Tiempo promedio: <span className="font-medium">{formatNumber(withoutCache.avgTime)} ms</span></p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            <Zap size={16} />
            Mejora de rendimiento
          </h4>
          <p className="mt-2 text-sm">
            Ahorro de tiempo: <span className="font-medium">{formatNumber(improvement.timesSaved)} ms</span>
          </p>
          <p className="text-sm">
            Mejora porcentual: <span className="font-medium text-green-600">{improvement.percent}%</span>
          </p>
        </div>
      </div>
    );
  };
  
  // Renderizar resultados de precarga
  const renderPreloadResults = () => {
    if (!preloadResults) return null;
    
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-700">Resultados de precarga: {preloadResults.category}</h4>
        <p className="mt-1 text-sm">
          Se precargaron <span className="font-medium">{preloadResults.templatesLoaded}</span> plantillas
          en <span className="font-medium">{preloadResults.duration}</span>
        </p>
        
        {preloadResults.templates.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Plantillas precargadas:</p>
            <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {preloadResults.templates.map(template => (
                <li key={template.id} className="text-gray-700">{template.name || template.id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!cacheReport) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Rendimiento de caché</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCacheReport}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Cargar datos'}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-medium">Rendimiento de caché de plantillas</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCacheReport}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearCache}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar caché
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="stats">
        <TabsList className="mb-4">
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          <TabsTrigger value="preload">Precarga</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estadísticas generales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Estadísticas generales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-600">Aciertos (hits)</p>
                  <p className="text-2xl font-bold text-blue-600">{cacheReport.stats.hits}</p>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-md">
                  <p className="text-sm text-gray-600">Fallos (misses)</p>
                  <p className="text-2xl font-bold text-amber-600">{cacheReport.stats.misses}</p>
                </div>
              </div>
              
              {renderEffectivenessBar()}
              
              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  Tiempo promedio de acceso (hit): <span className="font-medium">{cacheReport.stats.avgHitTime} ms</span>
                </p>
                <p className="text-sm">
                  Tiempo promedio de acceso (miss): <span className="font-medium">{cacheReport.stats.avgMissTime} ms</span>
                </p>
                <p className="text-sm">
                  Tiempo ahorrado promedio: <span className="font-medium text-green-600">{cacheReport.stats.avgTimeSaved} ms</span>
                </p>
              </div>
            </div>
            
            {/* Uso de caché por categoría */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Uso por categoría</h3>
              
              <div className="max-h-64 overflow-y-auto space-y-3">
                {Object.entries(cacheReport.usage.byCategory).map(([category, data]) => (
                  <div key={category} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium mb-1">{category}</p>
                    <div className="flex justify-between text-sm">
                      <span>Total accesos: {data.total}</span>
                      <span>
                        <span className="text-green-600">{data.hits} hits</span> / 
                        <span className="text-amber-600">{data.misses} misses</span>
                      </span>
                    </div>
                    {data.total > 0 && (
                      <Progress 
                        value={(data.hits / data.total) * 100} 
                        className="h-1.5 mt-1" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Estado de la caché */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Estado actual</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Entradas en memoria</p>
                  <p className="text-xl font-medium">{cacheReport.memory.entryCount}</p>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Distribución por categoría:</p>
                    {Object.entries(cacheReport.memory.byCategory).map(([category, count]) => (
                      <p key={category} className="text-xs flex justify-between">
                        <span>{category}:</span>
                        <span className="font-medium">{count}</span>
                      </p>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Tamaño en localStorage</p>
                  <p className="text-xl font-medium">{cacheReport.localStorage.sizeFormatted}</p>
                </div>
              </div>
            </div>
            
            {/* Plantillas más utilizadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plantillas más utilizadas</h3>
              
              <div className="space-y-2">
                {cacheReport.usage.topTemplates.length > 0 ? (
                  cacheReport.usage.topTemplates.map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {template.name || template.id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {template.useCount} usos
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No hay datos de uso suficientes</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="benchmark">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Prueba de rendimiento</h3>
              
              <Button 
                onClick={handleRunBenchmark} 
                disabled={benchmarkLoading}
              >
                {benchmarkLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Ejecutar benchmark
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              El benchmark compara el tiempo de acceso a las plantillas con y sin caché activada.
              Esto permite medir la mejora de rendimiento real que proporciona el sistema.
            </p>
            
            {renderBenchmarkResults()}
          </div>
        </TabsContent>
        
        <TabsContent value="preload">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Prueba de precarga por categoría</h3>
              
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    id="category"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={loading}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <Button 
                  onClick={handleTestPreloading}
                  disabled={loading || !selectedCategory}
                >
                  {loading ? 'Probando...' : 'Probar precarga'}
                </Button>
              </div>
              
              {renderPreloadResults()}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium flex items-center gap-2">
                <Clock size={16} />
                Acerca de la precarga
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                La precarga permite cargar anticipadamente plantillas que es probable que se necesiten
                en base a patrones de uso históricos. Esto mejora la experiencia al minimizar los
                tiempos de espera para el usuario.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Las plantillas se precargan automáticamente en segundo plano según su frecuencia
                de uso, categoría y última fecha de acceso.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Configuración actual</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(cacheReport.config).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{key}</p>
                  <p className="text-sm mt-1">
                    {typeof value === 'boolean' 
                      ? (value ? 'Activado' : 'Desactivado')
                      : String(value)
                    }
                  </p>
                </div>
              ))}
            </div>
            
            {/* Opciones avanzadas de configuración - para futura implementación */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Configuración avanzada</h3>
                <Button variant="outline" disabled>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Estas opciones permiten ajustar el comportamiento del sistema de caché.
                Funcionalidad en desarrollo para próximas versiones.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CachePerformancePanel;
