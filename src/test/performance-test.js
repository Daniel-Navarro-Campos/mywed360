/**
 * Script de pruebas de rendimiento para el sistema de emails de Lovenda
 * 
 * Este script simula cargas de datos y uso intensivo para evaluar
 * el rendimiento y la escalabilidad de los componentes implementados.
 */

// Importar dependencias necesarias
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuración de la prueba
const CONFIG = {
  // Número de emails a generar para las pruebas
  emailCount: {
    small: 100,
    medium: 1000,
    large: 10000
  },
  
  // Número de notificaciones para las pruebas
  notificationCount: {
    small: 50,
    medium: 500,
    large: 2000
  },
  
  // Número de eventos para las pruebas
  eventCount: {
    small: 20,
    medium: 200,
    large: 1000
  },
  
  // Número de proveedores para las pruebas
  providerCount: {
    small: 10,
    medium: 50,
    large: 200
  },
  
  // Número de plantillas para las pruebas
  templateCount: {
    small: 5,
    medium: 20,
    large: 100
  },
  
  // Tamaño del cuerpo de email (en caracteres) para las pruebas
  emailBodySize: {
    small: 1000,
    medium: 10000,
    large: 50000
  },
  
  // Directorio para guardar resultados
  outputDir: './performance-results',
  
  // Número de repeticiones para cada prueba (para obtener promedio)
  repetitions: 5
};

// Crear directorio de resultados si no existe
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Función para generar datos aleatorios
function generateTestData(type, size = 'medium') {
  console.log(`Generando datos de prueba: ${type}, tamaño: ${size}`);
  
  const startTime = performance.now();
  let result = [];
  
  switch (type) {
    case 'emails': {
      const count = CONFIG.emailCount[size];
      for (let i = 0; i < count; i++) {
        result.push({
          id: `email_${i}`,
          from: `sender${i % 100}@example.com`,
          to: 'usuario@lovenda.com',
          subject: `Asunto de prueba #${i} para evaluación de rendimiento`,
          body: generateRandomText(CONFIG.emailBodySize[size]),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          read: Math.random() > 0.3,
          folder: ['inbox', 'sent', 'drafts', 'important'][Math.floor(Math.random() * 4)],
          attachments: Math.random() > 0.7 ? [
            { name: 'documento.pdf', size: Math.floor(Math.random() * 5000000) }
          ] : [],
          providerId: Math.random() > 0.5 ? `prov_${Math.floor(Math.random() * CONFIG.providerCount[size])}` : null
        });
      }
      break;
    }
      
    case 'notifications': {
      const notifCount = CONFIG.notificationCount[size];
      for (let i = 0; i < notifCount; i++) {
        result.push({
          id: `notif_${i}`,
          type: ['email', 'event', 'provider', 'system'][Math.floor(Math.random() * 4)],
          message: `Notificación de prueba #${i} para evaluación de rendimiento`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          read: Math.random() > 0.4,
          action: Math.random() > 0.6 ? ['viewEmail', 'viewEvent', 'viewProvider'][Math.floor(Math.random() * 3)] : null,
          emailId: Math.random() > 0.6 ? `email_${Math.floor(Math.random() * CONFIG.emailCount[size])}` : null,
          eventId: Math.random() > 0.7 ? `event_${Math.floor(Math.random() * CONFIG.eventCount[size])}` : null,
          providerId: Math.random() > 0.8 ? `prov_${Math.floor(Math.random() * CONFIG.providerCount[size])}` : null
        });
      }
      break;
    }
      
    case 'events': {
      const eventCount = CONFIG.eventCount[size];
      for (let i = 0; i < eventCount; i++) {
        result.push({
          id: `event_${i}`,
          title: `Evento de prueba #${i} para evaluación de rendimiento`,
          dateTime: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          location: `Ubicación de prueba #${Math.floor(Math.random() * 20)}`,
          description: generateRandomText(Math.floor(Math.random() * 500)),
          attendees: Array.from({ length: Math.floor(Math.random() * 10) }, (_, j) => `Asistente ${j}`),
          providerRelated: Math.random() > 0.6,
          providerId: Math.random() > 0.6 ? `prov_${Math.floor(Math.random() * CONFIG.providerCount[size])}` : null
        });
      }
      break;
    }
      
    case 'providers': {
      const provCount = CONFIG.providerCount[size];
      for (let i = 0; i < provCount; i++) {
        result.push({
          id: `prov_${i}`,
          name: `Proveedor de prueba #${i}`,
          type: ['Catering', 'Fotografía', 'Flores', 'Música', 'Decoración'][Math.floor(Math.random() * 5)],
          contact: `proveedor${i}@ejemplo.com`,
          phone: `+34 ${Math.floor(Math.random() * 900000000) + 600000000}`,
          description: generateRandomText(Math.floor(Math.random() * 300) + 200),
          rating: Math.floor(Math.random() * 5) + 1
        });
      }
      break;
    }
      
    case 'tasks': {
      const taskCount = CONFIG.taskCount[size];
      for (let i = 0; i < taskCount; i++) {
        result.push({
          id: `task_${i}`,
          title: `Tarea de prueba #${i}`,
          description: generateRandomText(Math.floor(Math.random() * 200) + 100),
          completed: Math.random() > 0.6,
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      break;
    }
      
    default:
      console.warn(`Tipo de datos desconocido: ${type}`);
      break;
        result.push({
          id: `template_${i}`,
          name: `Plantilla de prueba #${i}`,
          category: ['Proveedores - Solicitud de información', 'Proveedores - Confirmación', 'General'][Math.floor(Math.random() * 3)],
          subject: `Asunto de plantilla #${i}: {{variable1}}`,
          body: `<p>Estimado/a {{nombre_proveedor}}:</p>
          <p>${generateRandomText(Math.floor(Math.random() * 500) + 500)}</p>
          <p>La fecha sería {{fecha_evento}} y necesitaríamos {{servicio}}.</p>
          <p>Saludos cordiales,</p>
          <p>{{nombre_usuario}}</p>`,
          variables: ['variable1', 'nombre_proveedor', 'fecha_evento', 'servicio', 'nombre_usuario'],
          isSystem: Math.random() > 0.8
        });
      }
      break;
  }
  
  const endTime = performance.now();
  console.log(`✅ Generados ${result.length} elementos en ${((endTime - startTime) / 1000).toFixed(2)} segundos`);
  
  return result;
}

// Función para generar texto aleatorio
function generateRandomText(length) {
  const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
  
  let result = '';
  while (result.length < length) {
    result += lorem;
  }
  
  return result.substring(0, length);
}

// Función para ejecutar pruebas de rendimiento
async function runPerformanceTest(testName, testFunction, params = {}, size = 'medium') {
  console.log(`\n=============================================`);
  console.log(`INICIANDO PRUEBA: ${testName} (tamaño: ${size})`);
  console.log(`=============================================`);
  
  const results = {
    testName,
    size,
    params,
    times: [],
    avgTime: 0,
    minTime: Number.MAX_SAFE_INTEGER,
    maxTime: 0,
    metadata: {}
  };
  
  // Ejecutar prueba varias veces para obtener un promedio
  for (let i = 0; i < CONFIG.repetitions; i++) {
    console.log(`Ejecución ${i + 1}/${CONFIG.repetitions}`);
    
    const startTime = performance.now();
    const testResult = await testFunction(params);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    results.times.push(executionTime);
    results.minTime = Math.min(results.minTime, executionTime);
    results.maxTime = Math.max(results.maxTime, executionTime);
    
    // Guardar metadata adicional del resultado si existe
    if (testResult && testResult.metadata) {
      results.metadata = { ...results.metadata, ...testResult.metadata };
    }
    
    console.log(`✅ Completado en ${(executionTime / 1000).toFixed(2)} segundos`);
  }
  
  // Calcular promedio
  results.avgTime = results.times.reduce((sum, time) => sum + time, 0) / results.times.length;
  
  // Guardar resultados
  const resultsPath = path.join(CONFIG.outputDir, `${testName.toLowerCase().replace(/\s+/g, '_')}_${size}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 RESULTADOS DE LA PRUEBA: ${testName}`);
  console.log(`Tiempo promedio: ${(results.avgTime / 1000).toFixed(2)} segundos`);
  console.log(`Tiempo mínimo: ${(results.minTime / 1000).toFixed(2)} segundos`);
  console.log(`Tiempo máximo: ${(results.maxTime / 1000).toFixed(2)} segundos`);
  console.log(`Resultados guardados en: ${resultsPath}\n`);
  
  return results;
}

// Prueba: Búsqueda global
async function testGlobalSearch(params) {
  const { emails, events, providers, query } = params;
  console.log(`Probando búsqueda con ${emails.length} emails, ${events.length} eventos, ${providers.length} proveedores`);
  console.log(`Término de búsqueda: "${query}"`);
  
  // Simulación de búsqueda
  const results = {
    emails: [],
    events: [],
    providers: []
  };
  
  // Buscar en emails
  const emailResults = emails.filter(email => 
    email.subject.toLowerCase().includes(query.toLowerCase()) || 
    email.body.toLowerCase().includes(query.toLowerCase()) ||
    email.from.toLowerCase().includes(query.toLowerCase())
  );
  results.emails = emailResults.slice(0, 5);
  
  // Buscar en eventos
  const eventResults = events.filter(event => 
    event.title.toLowerCase().includes(query.toLowerCase()) || 
    event.description.toLowerCase().includes(query.toLowerCase()) ||
    event.location.toLowerCase().includes(query.toLowerCase())
  );
  results.events = eventResults.slice(0, 5);
  
  // Buscar en proveedores
  const providerResults = providers.filter(provider => 
    provider.name.toLowerCase().includes(query.toLowerCase()) || 
    provider.type.toLowerCase().includes(query.toLowerCase()) ||
    provider.description.toLowerCase().includes(query.toLowerCase())
  );
  results.providers = providerResults.slice(0, 5);
  
  return {
    resultsCount: results.emails.length + results.events.length + results.providers.length,
    metadata: {
      totalMatches: emailResults.length + eventResults.length + providerResults.length,
      emailMatches: emailResults.length,
      eventMatches: eventResults.length,
      providerMatches: providerResults.length
    }
  };
}

// Prueba: Filtrado y ordenación de emails
async function testEmailFiltering(params) {
  const { emails, filterCriteria } = params;
  console.log(`Probando filtrado con ${emails.length} emails`);
  console.log(`Criterios: ${JSON.stringify(filterCriteria)}`);
  
  // Aplicar filtros
  let filteredEmails = [...emails];
  
  if (filterCriteria.folder) {
    filteredEmails = filteredEmails.filter(email => email.folder === filterCriteria.folder);
  }
  
  if (filterCriteria.read !== undefined) {
    filteredEmails = filteredEmails.filter(email => email.read === filterCriteria.read);
  }
  
  if (filterCriteria.hasAttachments !== undefined) {
    filteredEmails = filteredEmails.filter(email => 
      filterCriteria.hasAttachments ? (email.attachments && email.attachments.length > 0) : (!email.attachments || email.attachments.length === 0)
    );
  }
  
  if (filterCriteria.fromProvider !== undefined) {
    filteredEmails = filteredEmails.filter(email => 
      filterCriteria.fromProvider ? !!email.providerId : !email.providerId
    );
  }
  
  // Ordenar resultados
  if (filterCriteria.sortBy) {
    filteredEmails.sort((a, b) => {
      if (filterCriteria.sortBy === 'date') {
        return filterCriteria.sortOrder === 'asc' 
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      return 0;
    });
  }
  
  return {
    filteredCount: filteredEmails.length,
    metadata: {
      originalCount: emails.length,
      reductionPercentage: ((emails.length - filteredEmails.length) / emails.length * 100).toFixed(2) + '%'
    }
  };
}

// Prueba: Detección de eventos en emails
async function testEventDetection(params) {
  const { emails } = params;
  console.log(`Probando detección de eventos con ${emails.length} emails`);
  
  let detectedEvents = 0;
  let processedEmails = 0;
  
  // Expresiones regulares para detectar fechas y horas
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})|(\d{1,2}) de ([a-zá-úñ]+)( de (\d{4}))?/gi;
  const timeRegex = /(\d{1,2}):(\d{2})( ?(?:AM|PM|a\.m\.|p\.m\.))?/gi;
  
  for (const email of emails) {
    processedEmails++;
    
    // Comprobar si el email contiene fecha y hora (potencial evento)
    const hasDate = dateRegex.test(email.body);
    dateRegex.lastIndex = 0; // Reiniciar índice
    
    const hasTime = timeRegex.test(email.body);
    timeRegex.lastIndex = 0; // Reiniciar índice
    
    if (hasDate && hasTime) {
      detectedEvents++;
    }
    
    // Para simular procesamiento y no bloquear completamente
    if (processedEmails % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return {
    detectedEvents,
    metadata: {
      totalEmails: emails.length,
      detectionRate: ((detectedEvents / emails.length) * 100).toFixed(2) + '%'
    }
  };
}

// Prueba: Aplicación de plantillas con variables
async function testTemplateApplication(params) {
  const { templates, variables } = params;
  console.log(`Probando aplicación de plantillas con ${templates.length} plantillas`);
  
  const results = [];
  
  for (const template of templates) {
    let subject = template.subject;
    let body = template.body;
    
    // Reemplazar variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }
    
    results.push({
      templateId: template.id,
      processedSubject: subject,
      // No incluir el cuerpo completo para no sobrecargar los resultados
      bodyLength: body.length,
      variablesReplaced: Object.keys(variables).length
    });
  }
  
  return {
    processedCount: results.length,
    metadata: {
      averageBodyLength: results.reduce((sum, item) => sum + item.bodyLength, 0) / results.length
    }
  };
}

// Prueba: Carga y renderizado de notificaciones
async function testNotificationRendering(params) {
  const { notifications, batchSize } = params;
  console.log(`Probando renderizado de notificaciones con ${notifications.length} notificaciones`);
  
  const batches = [];
  for (let i = 0; i < notifications.length; i += batchSize) {
    batches.push(notifications.slice(i, i + batchSize));
  }
  
  let totalRenderTime = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const startTime = performance.now();
    
    // Simular renderizado procesando cada notificación
    for (const notification of batch) {
      // Operaciones para simular procesamiento del renderizado
      const formattedTimestamp = new Date(notification.timestamp).toLocaleString();
      const isHighPriority = !notification.read && ['email', 'system'].includes(notification.type);
      const actionUrl = notification.action 
        ? `/${notification.action.replace('view', '').toLowerCase()}/${
            notification.emailId || notification.eventId || notification.providerId
          }`
        : '';
      
      // Simular creación de elementos DOM
      const dummy = {
        type: notification.type,
        message: notification.message,
        timestamp: formattedTimestamp,
        priority: isHighPriority ? 'high' : 'normal',
        url: actionUrl,
        read: notification.read
      };
    }
    
    const endTime = performance.now();
    totalRenderTime += (endTime - startTime);
    
    // Para simular procesamiento y no bloquear completamente
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  
  return {
    batchCount: batches.length,
    averageBatchRenderTime: totalRenderTime / batches.length,
    metadata: {
      totalNotifications: notifications.length,
      batchSize,
      estimatedDOMElements: notifications.length * 5 // Aproximación de elementos DOM por notificación
    }
  };
}

// Función principal
async function runAllTests() {
  console.log(`
  =======================================================
  🚀 INICIANDO PRUEBAS DE RENDIMIENTO DE LOVENDA EMAIL
  =======================================================
  
  Configuración:
  - Repeticiones por prueba: ${CONFIG.repetitions}
  - Directorio de resultados: ${CONFIG.outputDir}
  
  =======================================================
  `);
  
  const startTime = performance.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Crear datos de prueba para cada tamaño
  const testSizes = ['small', 'medium', 'large'];
  const testData = {};
  
  for (const size of testSizes) {
    testData[size] = {
      emails: generateTestData('emails', size),
      notifications: generateTestData('notifications', size),
      events: generateTestData('events', size),
      providers: generateTestData('providers', size),
      templates: generateTestData('templates', size)
    };
  }
  
  // Ejecutar pruebas para cada tamaño
  const allResults = {};
  
  for (const size of testSizes) {
    console.log(`\n\n=======================================================`);
    console.log(`EJECUTANDO PRUEBAS CON TAMAÑO DE DATOS: ${size.toUpperCase()}`);
    console.log(`=======================================================\n`);
    
    // Prueba de búsqueda global
    allResults[`globalSearch_${size}`] = await runPerformanceTest(
      'Búsqueda global',
      testGlobalSearch,
      {
        emails: testData[size].emails,
        events: testData[size].events,
        providers: testData[size].providers,
        query: 'prueba'
      },
      size
    );
    
    // Prueba de filtrado y ordenación de emails
    allResults[`emailFiltering_${size}`] = await runPerformanceTest(
      'Filtrado de emails',
      testEmailFiltering,
      {
        emails: testData[size].emails,
        filterCriteria: {
          folder: 'inbox',
          read: false,
          hasAttachments: true,
          sortBy: 'date',
          sortOrder: 'desc'
        }
      },
      size
    );
    
    // Prueba de detección de eventos
    allResults[`eventDetection_${size}`] = await runPerformanceTest(
      'Detección de eventos',
      testEventDetection,
      {
        emails: testData[size].emails
      },
      size
    );
    
    // Prueba de aplicación de plantillas
    allResults[`templateApplication_${size}`] = await runPerformanceTest(
      'Aplicación de plantillas',
      testTemplateApplication,
      {
        templates: testData[size].templates,
        variables: {
          nombre_proveedor: 'Empresa Ejemplo',
          fecha_evento: '15/09/2025',
          servicio: 'fotografía profesional',
          nombre_usuario: 'María García',
          variable1: 'Consulta sobre servicios'
        }
      },
      size
    );
    
    // Prueba de renderizado de notificaciones
    allResults[`notificationRendering_${size}`] = await runPerformanceTest(
      'Renderizado de notificaciones',
      testNotificationRendering,
      {
        notifications: testData[size].notifications,
        batchSize: size === 'small' ? 10 : size === 'medium' ? 25 : 50
      },
      size
    );
  }
  
  // Generar informe resumen
  const endTime = performance.now();
  const totalExecutionTime = (endTime - startTime) / 1000;
  
  const summaryReport = {
    timestamp,
    totalExecutionTime,
    tests: Object.values(allResults).map(result => ({
      name: result.testName,
      size: result.size,
      avgTime: result.avgTime,
      minTime: result.minTime,
      maxTime: result.maxTime
    })),
    recommendations: []
  };
  
  // Añadir recomendaciones basadas en resultados
  if (allResults.globalSearch_large.avgTime > 1000) {
    summaryReport.recommendations.push(
      'Implementar caché para resultados de búsqueda global con conjuntos de datos grandes'
    );
  }
  
  if (allResults.notificationRendering_large.averageBatchRenderTime > 500) {
    summaryReport.recommendations.push(
      'Considerar virtualización para listas de notificaciones con más de 50 elementos'
    );
  }
  
  if (allResults.emailFiltering_large.avgTime > 800) {
    summaryReport.recommendations.push(
      'Optimizar algoritmos de filtrado para grandes volúmenes de emails'
    );
  }
  
  // Guardar informe resumen
  const summaryPath = path.join(CONFIG.outputDir, `resumen_pruebas_${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));
  
  console.log(`\n\n=======================================================`);
  console.log(`✅ PRUEBAS DE RENDIMIENTO COMPLETADAS`);
  console.log(`=======================================================`);
  console.log(`Tiempo total de ejecución: ${totalExecutionTime.toFixed(2)} segundos`);
  console.log(`Informe resumen guardado en: ${summaryPath}`);
  
  if (summaryReport.recommendations.length > 0) {
    console.log(`\n📋 RECOMENDACIONES DE OPTIMIZACIÓN:`);
    summaryReport.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }
  
  return summaryReport;
}

// Ejecutar todas las pruebas
runAllTests().catch(error => {
  console.error('❌ Error durante la ejecución de las pruebas:', error);
});
